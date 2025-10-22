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

      const { data: existing } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('email', email)
        .single();

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

      const { error } = await supabase
        .from('email_verifications')
        .upsert(upsertData, { onConflict: 'email' });

      if (error) throw error;

      await emailService.sendVerificationEmail(email, code);

      return { success: true, message: 'Verification code sent to email', expiresAt };
    } catch (error) {
      console.error('Error creating verification code:', error);
      throw error;
    }
  }

  async verifyCode(email, code) {
    try {
      const { data: verification } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('email', email)
        .single();

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
        await supabase
          .from('email_verifications')
          .update({ is_verified: true, verified_at: new Date().toISOString() })
          .eq('email', email);

        return { success: true, message: 'Email verified successfully!' };
      } else {
        await supabase
          .from('email_verifications')
          .update({ attempts: verification.attempts + 1 })
          .eq('email', email);

        return { success: false, message: `Invalid verification code. ${5 - (verification.attempts + 1)} attempts remaining.` };
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      throw error;
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
      const { data: existing } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('email', email)
        .single();

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
      throw error;
    }
  }
}

export default new VerificationService();