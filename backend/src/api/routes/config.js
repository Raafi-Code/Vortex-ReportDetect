import { Router } from 'express';
import supabase from '../../supabase.js';

const router = Router();

/**
 * GET /api/config
 * Get all app configuration
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('*');

    if (error) throw error;

    // Convert array to key-value object
    const configObj = {};
    for (const item of data || []) {
      configObj[item.key] = item.value;
    }

    res.json({ success: true, data: configObj });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/config/:key
 * Set a config value
 */
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ success: false, error: 'value is required' });
    }

    const { data, error } = await supabase
      .from('app_config')
      .upsert(
        { key, value: String(value) },
        { onConflict: 'key' }
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
 * GET /api/forwarding-rules
 * Get all forwarding rules
 */
router.get('/forwarding-rules', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('forwarding_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/forwarding-rules
 * Create a forwarding rule
 */
router.post('/forwarding-rules', async (req, res) => {
  try {
    const { source_group_jid, target_jid, target_name, target_type } = req.body;

    if (!source_group_jid || !target_jid || !target_name) {
      return res.status(400).json({
        success: false,
        error: 'source_group_jid, target_jid, and target_name are required',
      });
    }

    const { data, error } = await supabase
      .from('forwarding_rules')
      .insert({
        source_group_jid,
        target_jid,
        target_name,
        target_type: target_type || 'group',
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/forwarding-rules/:id
 * Update a forwarding rule
 */
router.patch('/forwarding-rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('forwarding_rules')
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
 * DELETE /api/forwarding-rules/:id
 * Delete a forwarding rule
 */
router.delete('/forwarding-rules/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('forwarding_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Forwarding rule deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
