import { Router } from 'express';
import supabase from '../../supabase.js';

const router = Router();

/**
 * GET /api/messages
 * Get paginated messages with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      group_jid,
      is_read,
      search,
      keyword,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    // Apply filters
    if (group_jid) query = query.eq('group_jid', group_jid);
    if (is_read !== undefined) query = query.eq('is_read', is_read === 'true');
    if (keyword) query = query.eq('matched_keyword', keyword);
    if (search) query = query.ilike('message_text', `%${search}%`);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/messages/stats
 * Get message statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Total messages
    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    // Unread messages
    const { count: unreadMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    // Forwarded messages
    const { count: forwardedMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_forwarded', true);

    // Messages with media
    const { count: mediaMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .not('media_url', 'is', null);

    // Active groups count
    const { count: activeGroups } = await supabase
      .from('monitored_groups')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Active keywords count
    const { count: activeKeywords } = await supabase
      .from('keywords')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Today's messages
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    res.json({
      success: true,
      data: {
        totalMessages,
        unreadMessages,
        forwardedMessages,
        mediaMessages,
        activeGroups,
        activeKeywords,
        todayMessages,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/messages/:id
 * Get single message detail
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Mark as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', id);

    res.json({ success: true, data: { ...data, is_read: true } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/messages/:id/read
 * Mark message as read
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/messages/read-all
 * Mark all messages as read
 */
router.patch('/read-all', async (req, res) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) throw error;
    res.json({ success: true, message: 'All messages marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/messages/:id
 * Delete a message
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get message to check for media
    const { data: msg } = await supabase
      .from('messages')
      .select('media_storage_path')
      .eq('id', id)
      .single();

    // Delete media from storage if exists
    if (msg?.media_storage_path) {
      await supabase.storage
        .from('whatsapp-media')
        .remove([msg.media_storage_path]);
    }

    // Delete message
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
