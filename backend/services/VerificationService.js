import { supabase } from '../config/supabase.js';
import emailService from './emailService.js';

class VerificationService {
  generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createVerificationCode(email) {
    try {
      const code = this.generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

<<<<<<< HEAD
      const { data: existing } = await supabase
=======
      const { data: existing, error: fetchError } = await supabase
>>>>>>> email-verification
        .from('email_verifications')
        .select('*')
        .eq('email', email)
        .single();

<<<<<<< HEAD
=======
      // Ignore "not found" errors for single()
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Database error fetching existing verification:', fetchError);
        if (fetchError.code === '42P01') {
          return { 
            success: false, 
            message: 'Email verification table not found. Please run the setup endpoint first.' 
          };
        }
        return { 
          success: false, 
          message: 'Failed to create verification code. Please try again.' 
        };
      }

>>>>>>> email-verification
      if (existing?.is_verified) {
        return { success: true, alreadyVerified: true, message: 'Email already verified' };
      }

      const upsertData = {
        email,
        verification_code: code,
        code_expires_at: expiresAt.toISOString(),
        attempts: 0,
        updated_at: new Date().toISOString()
      };

<<<<<<< HEAD
      const { error } = await supabase
        .from('email_verifications')
        .upsert(upsertData, { onConflict: 'email' });

      if (error) throw error;

      await emailService.sendVerificationEmail(email, code);

      return { success: true, message: 'Verification code sent to email', expiresAt };
    } catch (error) {
      console.error('Error creating verification code:', error);
      throw error;
=======
      const { error: upsertError } = await supabase
        .from('email_verifications')
        .upsert(upsertData, { onConflict: 'email' });

      if (upsertError) {
        console.error('Error upserting verification code:', upsertError);
        return { 
          success: false, 
          message: 'Failed to save verification code. Please try again.' 
        };
      }

      try {
        await emailService.sendVerificationEmail(email, code);
        // Return success with code in development mode for easy testing
        return { 
          success: true, 
          message: 'Verification code sent successfully', 
          expiresAt,
          // Include code in development for testing without email
          code: process.env.NODE_ENV === 'development' ? code : undefined
        };
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
        
        // Check if SMTP is configured
        const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
        
        if (!smtpConfigured) {
          // SMTP not configured - return error
          return { 
            success: false, 
            message: 'Email service not configured. Please contact support or check your .env file has SMTP_HOST, SMTP_USER, and SMTP_PASSWORD set.',
            error: 'SMTP_NOT_CONFIGURED',
            // Include code in development for testing
            code: process.env.NODE_ENV === 'development' ? code : undefined
          };
        }
        
        // SMTP is configured but email failed to send
        return { 
          success: false, 
          message: 'Failed to send verification email. Please try again or contact support.',
          error: emailError.message
        };
      }
    } catch (error) {
      console.error('Error creating verification code:', error);
      return { 
        success: false, 
        message: 'An unexpected error occurred. Please try again.' 
      };
>>>>>>> email-verification
    }
  }

  async verifyCode(email, code) {
    try {
<<<<<<< HEAD
      const { data: verification } = await supabase
=======
      const { data: verification, error: fetchError } = await supabase
>>>>>>> email-verification
        .from('email_verifications')
        .select('*')
        .eq('email', email)
        .single();

<<<<<<< HEAD
=======
      if (fetchError) {
        console.error('Database error fetching verification:', fetchError);
        if (fetchError.code === '42P01') {
          return { 
            success: false, 
            message: 'Email verification system not set up. Please contact support.' 
          };
        }
        return { 
          success: false, 
          message: 'Failed to verify code. Please try again.' 
        };
      }

>>>>>>> email-verification
      if (!verification) {
        return { success: false, message: 'No verification code found for this email' };
      }

      if (verification.is_verified) {
        return { success: true, message: 'Email already verified', alreadyVerified: true };
      }

      if (new Date(verification.code_expires_at) < new Date()) {
        return { success: false, message: 'Verification code has expired. Please request a new one.' };
      }

      if (verification.attempts >= 5) {
        return { success: false, message: 'Maximum verification attempts exceeded. Please request a new code.' };
      }

      if (verification.verification_code === code) {
<<<<<<< HEAD
        await supabase
=======
        const { error: updateError } = await supabase
>>>>>>> email-verification
          .from('email_verifications')
          .update({ is_verified: true, verified_at: new Date().toISOString() })
          .eq('email', email);

<<<<<<< HEAD
        return { success: true, message: 'Email verified successfully!' };
      } else {
        await supabase
=======
        if (updateError) {
          console.error('Error updating verification status:', updateError);
          return { success: false, message: 'Failed to update verification status.' };
        }

        return { success: true, message: 'Email verified successfully!' };
      } else {
        const { error: updateError } = await supabase
>>>>>>> email-verification
          .from('email_verifications')
          .update({ attempts: verification.attempts + 1 })
          .eq('email', email);

<<<<<<< HEAD
=======
        if (updateError) {
          console.error('Error updating attempts:', updateError);
        }

>>>>>>> email-verification
        return { success: false, message: `Invalid verification code. ${5 - (verification.attempts + 1)} attempts remaining.` };
      }
    } catch (error) {
      console.error('Error verifying code:', error);
<<<<<<< HEAD
      throw error;
=======
      return { 
        success: false, 
        message: 'An unexpected error occurred. Please try again.' 
      };
>>>>>>> email-verification
    }
  }

  async isEmailVerified(email) {
    try {
      const { data } = await supabase
        .from('email_verifications')
        .select('is_verified')
        .eq('email', email)
        .single();

      return data?.is_verified || false;
    } catch (error) {
      return false;
    }
  }

  async resendCode(email) {
    try {
<<<<<<< HEAD
      const { data: existing } = await supabase
=======
      const { data: existing, error: fetchError } = await supabase
>>>>>>> email-verification
        .from('email_verifications')
        .select('*')
        .eq('email', email)
        .single();

<<<<<<< HEAD
=======
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Database error fetching verification:', fetchError);
        if (fetchError.code === '42P01') {
          return { 
            success: false, 
            message: 'Email verification table not found. Please run the setup endpoint first.' 
          };
        }
        return { 
          success: false, 
          message: 'Failed to resend code. Please try again.' 
        };
      }

>>>>>>> email-verification
      if (!existing) {
        return { success: false, message: 'No verification request found for this email' };
      }

      if (existing.is_verified) {
        return { success: false, message: 'Email already verified' };
      }

      const lastUpdate = new Date(existing.updated_at);
      const timeDiff = (new Date() - lastUpdate) / 1000;

      if (timeDiff < 60) {
        return { success: false, message: `Please wait ${Math.ceil(60 - timeDiff)} seconds before requesting a new code` };
      }

      return await this.createVerificationCode(email);
    } catch (error) {
      console.error('Error resending code:', error);
<<<<<<< HEAD
      throw error;
=======
      return { 
        success: false, 
        message: 'An unexpected error occurred. Please try again.' 
      };
>>>>>>> email-verification
    }
  }
}

export default new VerificationService();