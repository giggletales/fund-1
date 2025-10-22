import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('challenge_types')
      .select('*')
      .eq('is_active', true)
      .order('recommended', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const { data, error } = await supabase
      .from('challenge_types')
      .select('*')
      .eq('challenge_code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching challenge:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:code/pricing', async (req, res) => {
  try {
    const { code } = req.params;

    const { data: challenge } = await supabase
      .from('challenge_types')
      .select('id')
      .eq('challenge_code', code)
      .maybeSingle();

    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    const { data, error } = await supabase
      .from('challenge_pricing')
      .select('*')
      .eq('challenge_type_id', challenge.id)
      .order('account_size', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:code/rules', async (req, res) => {
  try {
    const { code } = req.params;

    const { data: challenge } = await supabase
      .from('challenge_types')
      .select('id')
      .eq('challenge_code', code)
      .maybeSingle();

    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    const { data, error } = await supabase
      .from('challenge_rules')
      .select('*')
      .eq('challenge_type_id', challenge.id);

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/purchase', async (req, res) => {
  try {
    const { user_id, challenge_code, account_size, discount_code } = req.body;

    if (!user_id || !challenge_code || !account_size) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const { data: challenge } = await supabase
      .from('challenge_types')
      .select('id, challenge_code')
      .eq('challenge_code', challenge_code)
      .maybeSingle();

    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    const { data: pricing } = await supabase
      .from('challenge_pricing')
      .select('*')
      .eq('challenge_type_id', challenge.id)
      .eq('account_size', account_size)
      .maybeSingle();

    if (!pricing) {
      return res.status(404).json({ success: false, error: 'Pricing not found' });
    }

    let amount = pricing.discount_price;

    if (challenge_code === 'PAYG_2STEP') {
      amount = pricing.phase_1_price / 2;
    }

    const { data: userChallenge, error } = await supabase
      .from('user_challenges')
      .insert({
        user_id,
        challenge_type_id: challenge.id,
        account_size,
        amount_paid: amount,
        status: 'active',
        start_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: userChallenge });
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('user_challenges')
      .select(`
        *,
        challenge_types (
          challenge_code,
          challenge_name,
          description
        )
      `)
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching user challenges:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/challenge/:challengeId/stats', async (req, res) => {
  try {
    const { challengeId } = req.params;

    const { data: dailyStats, error: statsError } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_challenge_id', challengeId)
      .order('trading_date', { ascending: true });

    if (statsError) throw statsError;

    const { data: trades, error: tradesError } = await supabase
      .from('trading_activity')
      .select('*')
      .eq('user_challenge_id', challengeId)
      .order('open_time', { ascending: false })
      .limit(10);

    if (tradesError) throw tradesError;

    res.json({
      success: true,
      data: {
        dailyStats,
        recentTrades: trades
      }
    });
  } catch (error) {
    console.error('Error fetching challenge stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
