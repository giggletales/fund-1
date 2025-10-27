import { supabase } from '../lib/db';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
  type?: string;
}

export async function sendEmail(data: EmailData): Promise<boolean> {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return false;
    }

    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: data
    });

    if (error) {
      console.error('Error invoking email function:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return false;
    }

    console.log('Email function response:', result);

    if (result && result.success) {
      return true;
    } else {
      console.error('Email failed:', result?.error || 'Unknown error');
      return false;
    }
  } catch (error: any) {
    console.error('Email service error:', error.message || error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0066FF, #7B2EFF); padding: 40px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 32px;">Welcome to Fund8r!</h1>
      </div>
      <div style="padding: 30px; background: #ffffff;">
        <h2 style="color: #333;">Hey ${firstName},</h2>
        <p style="color: #666; line-height: 1.6;">
          We're thrilled to have you join our community of <strong>12,847+ traders</strong> worldwide!
        </p>
        <p style="color: #666; line-height: 1.6;">
          Your account has been successfully created. You're now ready to start your trading journey with Fund8r.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://fund8r.com/challenge-types"
             style="display: inline-block; padding: 15px 40px; background: #0066FF; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Choose Your Challenge
          </a>
        </div>
        <p style="color: #666; line-height: 1.6;">
          Best regards,<br>
          <strong>The Fund8r Team</strong>
        </p>
      </div>
      <div style="padding: 20px; background: #f5f5f5; text-align: center; color: #999; font-size: 12px;">
        <p>Fund8r | Professional Trading Evaluation</p>
      </div>
    </div>
  `;

  const text = `Welcome to Fund8r, ${firstName}!\n\nYour account has been created successfully. Choose your challenge: https://fund8r.com/challenge-types\n\nBest regards,\nThe Fund8r Team`;

  return sendEmail({
    to: email,
    subject: '🎉 Welcome to Fund8r - Your Trading Journey Starts Now!',
    html,
    text,
    type: 'welcome'
  });
}

export async function sendPhasePassedEmail(email: string, firstName: string, phase: number, accountSize: number): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #00C853, #00E676); padding: 40px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 32px;">🎉 Congratulations!</h1>
      </div>
      <div style="padding: 30px; background: #ffffff;">
        <h2 style="color: #333;">Amazing Work, ${firstName}!</h2>
        <p style="color: #666; line-height: 1.6;">
          You've successfully passed <strong>Phase ${phase}</strong> of your <strong>$${accountSize.toLocaleString()}</strong> challenge!
        </p>
        ${phase === 1 ? `
          <div style="background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1976D2;">Next Step: Phase 2</h3>
            <p style="margin: 0; color: #666;">
              You're now advancing to Phase 2. Keep up the excellent trading discipline!
            </p>
          </div>
        ` : `
          <div style="background: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #2E7D32;">🎊 You're Funded!</h3>
            <p style="margin: 0; color: #666;">
              Your funded account credentials will be sent shortly. Welcome to the funded traders club!
            </p>
          </div>
        `}
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://fund8r.com/dashboard"
             style="display: inline-block; padding: 15px 40px; background: #00C853; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
            View Dashboard
          </a>
        </div>
        <p style="color: #666; line-height: 1.6;">
          Keep trading smart!<br>
          <strong>The Fund8r Team</strong>
        </p>
      </div>
    </div>
  `;

  const text = `Congratulations ${firstName}!\n\nYou've passed Phase ${phase} of your $${accountSize.toLocaleString()} challenge!\n\n${phase === 1 ? 'Moving to Phase 2...' : "You're now funded!"}\n\nView Dashboard: https://fund8r.com/dashboard`;

  return sendEmail({
    to: email,
    subject: `🎉 Phase ${phase} Complete - ${phase === 1 ? 'Advancing to Phase 2' : "You're Funded!"}`,
    html,
    text,
    type: 'phase_passed'
  });
}

export async function sendCertificateEmail(email: string, firstName: string, accountSize: number, certificateUrl: string): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #FFD700, #FFA000); padding: 40px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 32px;">🏆 Your Certificate is Ready!</h1>
      </div>
      <div style="padding: 30px; background: #ffffff;">
        <h2 style="color: #333;">Congratulations, ${firstName}!</h2>
        <p style="color: #666; line-height: 1.6;">
          Your <strong>$${accountSize.toLocaleString()}</strong> funded account certificate is now available for download.
        </p>
        <div style="background: #fff3e0; border-left: 4px solid #FF9800; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #666;">
            This certificate validates your successful completion of our evaluation program and confirms your status as a funded trader.
          </p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${certificateUrl}"
             style="display: inline-block; padding: 15px 40px; background: #FFD700; color: #333; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Download Certificate
          </a>
        </div>
        <p style="color: #666; line-height: 1.6;">
          Share your achievement with the trading community!<br>
          <strong>The Fund8r Team</strong>
        </p>
      </div>
    </div>
  `;

  const text = `Congratulations ${firstName}!\n\nYour $${accountSize.toLocaleString()} funded account certificate is ready.\n\nDownload: ${certificateUrl}\n\nBest regards,\nThe Fund8r Team`;

  return sendEmail({
    to: email,
    subject: '🏆 Your Fund8r Certificate is Ready!',
    html,
    text,
    type: 'certificate'
  });
}

export async function sendTestEmailToAdmin(): Promise<boolean> {
  const testEmails = [
    {
      type: 'welcome',
      send: () => sendWelcomeEmail('mainhusharm@gmail.com', 'Admin')
    },
    {
      type: 'phase1_passed',
      send: () => sendPhasePassedEmail('mainhusharm@gmail.com', 'Admin', 1, 100000)
    },
    {
      type: 'phase2_passed',
      send: () => sendPhasePassedEmail('mainhusharm@gmail.com', 'Admin', 2, 100000)
    },
    {
      type: 'certificate',
      send: () => sendCertificateEmail('mainhusharm@gmail.com', 'Admin', 100000, 'https://fund8r.com/certificate/test-123')
    }
  ];

  console.log('Sending test emails to mainhusharm@gmail.com...');

  for (const email of testEmails) {
    console.log(`Sending ${email.type}...`);
    await email.send();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between emails
  }

  return true;
}
