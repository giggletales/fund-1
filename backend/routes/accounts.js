import express from 'express';
import { supabase } from '../config/supabase.js';
import monitoringService from '../services/monitoringService.js';
import emailService from '../services/emailService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;

    let query = supabase
      .from('mt5_accounts')
      .select('*, challenges(*)');

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('mt5_accounts')
      .select('*, challenges(*)')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const accountData = req.body;

    const { data, error } = await supabase
      .from('mt5_accounts')
      .insert(accountData)
      .select()
      .single();

    if (error) throw error;

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', accountData.user_id)
      .single();

    await emailService.sendChallengeStartedEmail(user, data);

    await monitoringService.startMonitoring(data.id);

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('mt5_accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/start-monitoring', async (req, res) => {
  try {
    const { id } = req.params;

    await monitoringService.startMonitoring(id);

    res.json({ success: true, message: 'Monitoring started' });
  } catch (error) {
    console.error('Error starting monitoring:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/stop-monitoring', async (req, res) => {
  try {
    const { id } = req.params;

    await monitoringService.stopMonitoring(id);

    res.json({ success: true, message: 'Monitoring stopped' });
  } catch (error) {
    console.error('Error stopping monitoring:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/metrics', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 100 } = req.query;

    const { data, error } = await supabase
      .from('account_metrics')
      .select('*')
      .eq('mt5_account_id', id)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/violations', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('rule_violations')
      .select('*')
      .eq('mt5_account_id', id)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching violations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
