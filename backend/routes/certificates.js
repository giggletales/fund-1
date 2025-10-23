import express from 'express';
import certificateService from '../services/certificateService.js';
import fs from 'fs';
import path from 'path';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Get certificate by account ID (legacy)
router.get('/:account_id', async (req, res) => {
  try {
    const { account_id } = req.params;

    const certificatePath = await certificateService.getCertificate(account_id);

    if (!fs.existsSync(certificatePath)) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found'
      });
    }

    res.sendFile(path.resolve(certificatePath));
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate challenge certificate (legacy)
router.post('/generate/:account_id', async (req, res) => {
  try {
    const { account_id } = req.params;

    const result = await certificateService.generateCertificate(account_id);

    res.json({
      success: true,
      message: 'Certificate generated successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate welcome certificate
router.post('/welcome', async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required'
      });
    }

    // Get user data
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(user_id);
    
    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const result = await certificateService.generateWelcomeCertificate(user_id, {
      full_name: user.user_metadata?.full_name || user.user_metadata?.name,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Welcome certificate generated successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error generating welcome certificate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate challenge started certificate
router.post('/challenge-started', async (req, res) => {
  try {
    const { user_id, account_id, challenge_type, account_size } = req.body;

    if (!user_id || !account_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id and account_id are required'
      });
    }

    // Get user data
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(user_id);
    
    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const result = await certificateService.generateChallengeStartedCertificate(user_id, {
      id: account_id,
      trader_name: user.user_metadata?.full_name || user.email,
      challenge_type: challenge_type || 'Trading Challenge',
      account_size: account_size || 10000,
      start_date: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Challenge started certificate generated successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error generating challenge started certificate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate purchase invoice
router.post('/invoice', async (req, res) => {
  try {
    const { user_id, customer_name, customer_email, description, amount, discount } = req.body;

    if (!user_id || !customer_name || !customer_email || !description || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const result = await certificateService.generatePurchaseInvoice(user_id, {
      customer_name,
      customer_email,
      description,
      amount: parseFloat(amount),
      discount: parseFloat(discount) || 0
    });

    res.json({
      success: true,
      message: 'Invoice generated successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all user documents
router.get('/user/:user_id/documents', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { type } = req.query;

    let query = supabase
      .from('downloads')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('document_type', type);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching user documents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
