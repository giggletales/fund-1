import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;

    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const notificationData = req.body;

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/mark-all-read/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user_id)
      .eq('read', false);

    if (error) throw error;

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
