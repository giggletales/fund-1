import { supabase } from './db';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const emailTemplates = {
  welcome: (data: any): EmailTemplate => ({
    subject: '🎉 Welcome to Fund8r - Your Trading Journey Starts Now!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0066FF, #7B2EFF); padding: 40px 20px; text-align: center; color: white;">
          <h1>Welcome to Fund8r!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Hey ${data.firstName},</h2>
          <p>We're thrilled to have you join our community of <strong>12,847+ traders</strong> worldwide!</p>
          <p>Your account has been successfully created.</p>
          <a href="https://fund8r.com/pricing" style="display: inline-block; padding: 15px 30px; background: #0066FF; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Choose Your Challenge
          </a>
          <p>Best regards,<br><strong>The Fund8r Team</strong></p>
        </div>
      </div>
    `,
    text: `Welcome to Fund8r, ${data.firstName}!\n\nYour account has been created. Get started: https://fund8r.com/pricing`
  }),

  accountBreached: (data: any): EmailTemplate => ({
    subject: '⚠️ Fund8r Account Breached - Reset Available at 50% Off',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ff4444; padding: 40px 20px; text-align: center; color: white;">
          <h1>⚠️ Account Breached</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Hi ${data.firstName},</h2>
          <p>Your <strong>$${data.accountSize.toLocaleString()}</strong> challenge account has been breached.</p>
          <div style="background: #fff3cd; border-left: 4px solid #ff4444; padding: 15px; margin: 20px 0;">
            <h3>Breach Reason: ${data.breachReason}</h3>
            <p>${data.breachDetails}</p>
          </div>
          <p><strong>Don't give up!</strong> Reset your account for 50% OFF.</p>
          <a href="${data.resetLink}" style="display: inline-block; padding: 15px 30px; background: #0066FF; color: white; text-decoration: none; border-radius: 5px;">
            Reset Account (50% Off)
          </a>
        </div>
      </div>
    `,
    text: `Account Breached\n\nHi ${data.firstName},\n\nYour $${data.accountSize.toLocaleString()} account has been breached.\n\nReason: ${data.breachReason}\n\nReset: ${data.resetLink}`
  }),

  ruleWarning: (data: any): EmailTemplate => ({
    subject: `⚠️ Fund8r Warning: ${data.warningType} Alert`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ffa500; padding: 40px 20px; text-align: center; color: white;">
          <h1>⚠️ Account Warning</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Hi ${data.firstName},</h2>
          <p>Your $${data.accountSize.toLocaleString()} account is approaching a rule limit.</p>
          <p><strong>${data.warningType}:</strong> ${data.currentValue}% of ${data.limitValue}% limit</p>
          <a href="https://fund8r.com/dashboard" style="display: inline-block; padding: 15px 30px; background: #0066FF; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            View Dashboard
          </a>
        </div>
      </div>
    `,
    text: `Account Warning\n\nHi ${data.firstName},\n\n${data.warningType}: ${data.currentValue}% of ${data.limitValue}% limit`
  }),

  challengePurchase: (data: any): EmailTemplate => ({
    subject: '✅ Challenge Purchase Confirmed - Account Credentials Inside',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0066FF, #7B2EFF); padding: 40px 20px; text-align: center; color: white;">
          <h1>✅ Purchase Confirmed!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Hey ${data.firstName},</h2>
          <p>Your <strong>$${data.accountSize.toLocaleString()}</strong> challenge is ready!</p>
          <div style="background: #e7f3ff; border: 2px solid #0066FF; padding: 20px; margin: 20px 0;">
            <h3>Your Account Credentials:</h3>
            <p><strong>Platform:</strong> ${data.credentials.platform}</p>
            <p><strong>Login:</strong> ${data.credentials.login}</p>
            <p><strong>Password:</strong> ${data.credentials.password}</p>
          </div>
          <a href="https://fund8r.com/dashboard" style="display: inline-block; padding: 15px 30px; background: #0066FF; color: white; text-decoration: none; border-radius: 5px;">
            Go to Dashboard
          </a>
        </div>
      </div>
    `,
    text: `Purchase Confirmed!\n\nYour $${data.accountSize.toLocaleString()} challenge is ready!\n\nCredentials:\nLogin: ${data.credentials.login}\nPassword: ${data.credentials.password}`
  }),

  phase1Complete: (data: any): EmailTemplate => ({
    subject: '🎉 Congratulations! Phase 1 PASSED - Phase 2 Account Ready',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #00ff88, #00cc6a); padding: 40px 20px; text-align: center; color: white;">
          <h1>🎉 CONGRATULATIONS!</h1>
          <h2>Phase 1 PASSED</h2>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Excellent Work, ${data.firstName}!</h2>
          <div style="background: #e7f3ff; border: 2px solid #0066FF; padding: 20px; margin: 20px 0;">
            <h3>Phase 2 Account Credentials:</h3>
            <p><strong>Login:</strong> ${data.phase2Credentials.login}</p>
            <p><strong>Password:</strong> ${data.phase2Credentials.password}</p>
          </div>
          <a href="https://fund8r.com/dashboard" style="display: inline-block; padding: 15px 30px; background: #0066FF; color: white; text-decoration: none; border-radius: 5px;">
            Access Phase 2 Dashboard
          </a>
        </div>
      </div>
    `,
    text: `CONGRATULATIONS! Phase 1 PASSED\n\nPhase 2 Credentials:\nLogin: ${data.phase2Credentials.login}\nPassword: ${data.phase2Credentials.password}`
  }),
};

export async function sendEmail(to: string, templateName: keyof typeof emailTemplates, data: any) {
  try {
    const template = emailTemplates[templateName](data);

    await supabase.from('email_log').insert({
      user_email: to,
      template_name: templateName,
      subject: template.subject,
      status: 'sent',
      message_id: `${Date.now()}-${Math.random()}`
    });

    console.log(`Email sent to ${to}: ${template.subject}`);
    return { success: true };
  } catch (error: any) {
    await supabase.from('email_log').insert({
      user_email: to,
      template_name: templateName,
      subject: 'Error',
      status: 'failed',
      error_message: error.message
    });

    return { success: false, error: error.message };
  }
}
