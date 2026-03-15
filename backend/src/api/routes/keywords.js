import { Router } from 'express';
import supabase from '../../supabase.js';

const router = Router();

/**
 * GET /api/keywords
 * Get all keywords
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/keywords
 * Add a new keyword
 */
router.post('/', async (req, res) => {
  try {
    const { keyword } = req.body;
    if (!keyword) {
      return res.status(400).json({ success: false, error: 'keyword is required' });
    }

    const { data, error } = await supabase
      .from('keywords')
      .insert({ keyword: keyword.toLowerCase(), is_active: true })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/keywords/:id
 * Update a keyword (toggle active, rename)
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('keywords')
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
 * DELETE /api/keywords/:id
 * Delete a keyword
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('keywords')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Keyword deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
