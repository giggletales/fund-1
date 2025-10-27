import express from 'express';
import affiliateService from '../services/affiliateService.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.post('/create', async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const { data: existing } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (existing) {
      return res.json({ success: true, data: existing });
    }

    const affiliate = await affiliateService.createAffiliate(user_id);

    res.json({ success: true, data: affiliate });
  } catch (error) {
    console.error('Error creating affiliate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/track-referral', async (req, res) => {
  try {
    const { affiliate_code, referred_user_id } = req.body;

    if (!affiliate_code || !referred_user_id) {
      return res.status(400).json({
        success: false,
        error: 'Affiliate code and referred user ID are required'
      });
    }

    const referral = await affiliateService.trackReferral(affiliate_code, referred_user_id);

    if (!referral) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate code not found or inactive'
      });
    }

    res.json({ success: true, data: referral });
  } catch (error) {
    console.error('Error tracking referral:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get affiliate by user_id
router.get('/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data: affiliate, error } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (error || !affiliate) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate not found'
      });
    }

    res.json({ success: true, data: affiliate });
  } catch (error) {
    console.error('Error fetching affiliate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const stats = await affiliateService.getAffiliateStats(user_id);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate not found'
      });
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching affiliate stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/payouts/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate not found'
      });
    }

    const { data: payouts, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('requested_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: payouts });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/request-payout', async (req, res) => {
  try {
    const { user_id, amount } = req.body;

    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate not found'
      });
    }

    if (amount > affiliate.total_earnings) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient earnings for payout'
      });
    }

    if (amount < 100) {
      return res.status(400).json({
        success: false,
        error: 'Minimum payout amount is $100'
      });
    }

    const { data: payout, error } = await supabase
      .from('payouts')
      .insert({
        affiliate_id: affiliate.id,
        amount,
        status: 'pending',
        requested_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: payout });
  } catch (error) {
    console.error('Error requesting payout:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/validate-code/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('*')
      .eq('affiliate_code', code)
      .eq('status', 'active')
      .single();

    if (!affiliate) {
      return res.json({ success: true, valid: false });
    }

    res.json({ success: true, valid: true, data: affiliate });
  } catch (error) {
    console.error('Error validating affiliate code:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
