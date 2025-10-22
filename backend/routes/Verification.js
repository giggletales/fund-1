import express from 'express';
import verificationService from '../services/VerificationService.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Setup endpoint - Run this once to create the table
router.post('/setup-table', async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create email_verifications table
        CREATE TABLE IF NOT EXISTS email_verifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) NOT NULL UNIQUE,
          verification_code VARCHAR(6) NOT NULL,
          is_verified BOOLEAN DEFAULT FALSE,
          code_expires_at TIMESTAMPTZ NOT NULL,
          verified_at TIMESTAMPTZ,
          attempts INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
        CREATE INDEX IF NOT EXISTS idx_email_verifications_verified ON email_verifications(is_verified);
        
        ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Anyone can manage verifications" ON email_verifications;
        CREATE POLICY "Anyone can manage verifications" ON email_verifications FOR ALL USING (true);
      `
    });

    if (error) {
      // If RPC doesn't exist, provide manual SQL
      return res.json({
        success: false,
        message: 'Please run this SQL manually in Supabase SQL Editor',
        sql: `
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  verification_code VARCHAR(6) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  code_expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_verified ON email_verifications(is_verified);

ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can manage verifications" ON email_verifications;
CREATE POLICY "Anyone can manage verifications" ON email_verifications FOR ALL USING (true);
        `,
        supabaseUrl: 'https://supabase.com/dashboard/project/_/sql'
      });
    }

    res.json({ success: true, message: 'Email verification table created successfully!' });
  } catch (error) {
    console.error('Error setting up table:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send verification code
router.post('/send-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const result = await verificationService.createVerificationCode(email);
    res.json(result);
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify code
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email and code are required' });
    }

    const result = await verificationService.verifyCode(email, code);
    res.json(result);
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check verification status
router.get('/status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const isVerified = await verificationService.isEmailVerified(email);
    res.json({ success: true, isVerified });
  } catch (error) {
    console.error('Error checking verification status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Resend verification code
router.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const result = await verificationService.resendCode(email);
    res.json(result);
  } catch (error) {
    console.error('Error resending verification code:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;