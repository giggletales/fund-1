import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.get('/tickets', async (req, res) => {
  try {
    const { user_id, status } = req.query;

    if (!user_id) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    let query = supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (ticketError) throw ticketError;

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const { data: messages, error: messagesError } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    res.json({ success: true, data: { ...ticket, messages } });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/tickets', async (req, res) => {
  try {
    const { user_id, subject, category, priority, description } = req.body;

    if (!user_id || !subject || !description) {
      return res.status(400).json({
        success: false,
        error: 'User ID, subject, and description are required'
      });
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id,
        subject,
        category: category || 'general',
        priority: priority || 'normal',
        description,
        status: 'open'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/tickets/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const { data, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: id,
        user_id,
        message,
        is_staff: false
      })
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateData = { updated_at: new Date().toISOString() };

    if (status) {
      updateData.status = status;
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
