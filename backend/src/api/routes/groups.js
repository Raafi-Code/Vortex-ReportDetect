import { Router } from 'express';
import supabase from '../../supabase.js';
import { getAllGroups } from '../../whatsapp.js';

const router = Router();

/**
 * GET /api/groups/available
 * Get all WhatsApp groups the bot is part of
 */
router.get('/available', async (req, res) => {
  try {
    const groups = await getAllGroups();
    res.json({ success: true, data: groups });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/groups
 * Get all monitored groups from database
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('monitored_groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/groups
 * Add a group to monitored list
 */
router.post('/', async (req, res) => {
  try {
    const { group_jid, group_name } = req.body;
    if (!group_jid || !group_name) {
      return res.status(400).json({ success: false, error: 'group_jid and group_name required' });
    }

    const { data, error } = await supabase
      .from('monitored_groups')
      .upsert(
        { group_jid, group_name, is_active: true },
        { onConflict: 'group_jid' }
      )
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/groups/:id
 * Update a monitored group (toggle active, rename)
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('monitored_groups')
      .update(updates)
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
 * DELETE /api/groups/:id
 * Remove a group from monitored list
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('monitored_groups')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Group removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
