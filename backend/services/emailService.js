import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

dotenv.config();

class EmailService {
  constructor() {
    // Initialize transporter as null, will be created on first use
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Check if SMTP credentials are configured
    const hasCredentials = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
    
    if (hasCredentials) {
      try {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
          }
        });
        this.isConfigured = true;
        console.log('✅ Email service configured with SMTP');
        console.log(`   Host: ${process.env.SMTP_HOST}`);
        console.log(`   User: ${process.env.SMTP_USER}`);
      } catch (error) {
        console.error('❌ Failed to initialize SMTP transporter:', error.message);
        this.isConfigured = false;
      }
    } else {
      console.warn('⚠️  Email service not configured - SMTP credentials missing');
      console.warn('   Required: SMTP_HOST, SMTP_USER, SMTP_PASSWORD');
      console.warn('   Emails will be logged to console instead of being sent');
    }
  }

  // Method to reinitialize transporter (useful when env vars are loaded after import)
  reinitialize() {
    this.initializeTransporter();
    return this.isConfigured;
    
    // Ensure certificates directory exists
    this.certsDir = path.join(process.cwd(), 'public', 'certificates');
    if (!fs.existsSync(this.certsDir)) {
      fs.mkdirSync(this.certsDir, { recursive: true });
    }
  }

  async sendEmail(to, subject, html) {
    try {
      if (!this.isConfigured || !this.transporter) {
        console.log('\n' + '='.repeat(60));
        console.log('📧 EMAIL SIMULATION (SMTP not configured)');
        console.log('='.repeat(60));
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log('='.repeat(60) + '\n');
        return; // Don't throw error, just log
      }
      
      await this.transporter.sendMail({
        from: `"${process.env.COMPANY_NAME}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
      });
      console.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendVerificationEmail(email, code) {
    try {
      if (!this.isConfigured || !this.transporter) {
        console.error('\n' + '='.repeat(60));
        console.error('❌ SMTP NOT CONFIGURED - Cannot send verification email');
        console.error('='.repeat(60));
        console.error(`To: ${email}`);
        console.error(`Verification Code: ${code}`);
        console.error(`Expires: 10 minutes`);
        console.error('\nRequired environment variables:');
        console.error('  - SMTP_HOST');
        console.error('  - SMTP_USER');
        console.error('  - SMTP_PASSWORD');
        console.error('='.repeat(60) + '\n');
        // Throw error instead of silently failing
        throw new Error('SMTP not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD environment variables.');
      }
      
      const subject = `🔐 Verify Your Email - ${process.env.COMPANY_NAME || 'Fund8r'}`;
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
              padding: 20px;
            }
            .email-container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: #ffffff;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white; 
              padding: 50px 30px; 
              text-align: center;
              position: relative;
            }
            .header h1 { 
              font-size: 32px; 
              margin-bottom: 10px;
              text-shadow: 0 2px 10px rgba(0,0,0,0.3);
            }
            .content { 
              padding: 50px 40px;
              background: #ffffff;
              text-align: center;
            }
            .verification-badge {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 10px 25px;
              border-radius: 50px;
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 30px;
              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            }
            .code-container {
              background: linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%);
              border: 3px dashed #667eea;
              border-radius: 15px;
              padding: 40px;
              margin: 30px 0;
            }
            .code {
              font-size: 56px;
              font-weight: bold;
              color: #667eea;
              letter-spacing: 15px;
              font-family: 'Courier New', monospace;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            }
            .code-label {
              font-size: 14px;
              color: #6c757d;
              margin-top: 15px;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .instructions {
              color: #4a5568;
              font-size: 16px;
              line-height: 1.8;
              margin: 30px 0;
            }
            .warning-box {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 20px;
              border-radius: 8px;
              margin: 30px 0;
              text-align: left;
            }
            .timer {
              display: inline-flex;
              align-items: center;
              gap: 10px;
              background: #e7f3ff;
              padding: 15px 25px;
              border-radius: 50px;
              color: #667eea;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer { 
              background: #f8f9fa;
              text-align: center; 
              padding: 30px; 
              color: #6c757d; 
              font-size: 13px;
              border-top: 1px solid #e9ecef;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>🔐 Verify Your Email</h1>
              <p>One more step to get started</p>
            </div>
            <div class="content">
              <div class="verification-badge">✨ EMAIL VERIFICATION</div>
              
              <p class="instructions">
                To complete your registration and access the payment page, please enter this verification code:
              </p>

              <div class="code-container">
                <div class="code">${code}</div>
                <div class="code-label">Your Verification Code</div>
              </div>

              <div class="timer">
                <span>⏱️</span>
                <span>This code expires in 10 minutes</span>
              </div>

              <p class="instructions">
                Enter this code on the verification page to continue with your challenge purchase.
              </p>

              <div class="warning-box">
                <strong>🛡️ Security Notice:</strong>
                <ul style="margin: 10px 0 0 20px; color: #856404;">
                  <li>Never share this code with anyone</li>
                  <li>Fund8r will never ask for this code via phone or email</li>
                  <li>If you didn't request this code, please ignore this email</li>
                </ul>
              </div>

              <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
                Didn't request this? You can safely ignore this email.
              </p>
            </div>
            <div class="footer">
              <p>Need help? Contact us at support@fund8r.com</p>
              <p style="margin-top: 15px; opacity: 0.7;">&copy; ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Fund8r'}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.transporter.sendMail({
        from: `"${process.env.COMPANY_NAME || 'Fund8r'}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: subject,
        html: html
      });

      console.log(`Verification email sent to ${email}`);
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(user) {
    try {
      if (!this.isConfigured || !this.transporter) {
        console.log('\n' + '='.repeat(60));
        console.log('📧 WELCOME EMAIL SIMULATION (SMTP not configured)');
        console.log('='.repeat(60));
        console.log(`To: ${user.email}`);
        console.log(`Name: ${user.full_name || user.email}`);
        console.log('='.repeat(60) + '\n');
        return; // Don't throw error, just log
      }
      
      const subject = `🚀 Welcome to ${process.env.COMPANY_NAME || 'Fund8r'} - Your Trading Journey Begins!`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
            padding: 20px;
          }
          .email-container { 
            max-width: 650px; 
            margin: 0 auto; 
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 50px 30px; 
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 4s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
          .header h1 { 
            font-size: 32px; 
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
          }
          .header p {
            font-size: 16px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
          }
          .content { 
            padding: 40px 30px;
            background: #ffffff;
          }
          .welcome-badge {
            display: inline-block;
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
            padding: 8px 20px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 20px;
            box-shadow: 0 4px 15px rgba(17, 153, 142, 0.3);
          }
          .greeting { 
            font-size: 20px; 
            color: #1a1f3a; 
            margin-bottom: 20px;
            font-weight: 600;
          }
          .intro-text {
            color: #4a5568;
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 30px;
          }
          .features-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 30px 0;
          }
          .feature-card {
            background: linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%);
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #667eea;
            transition: transform 0.3s ease;
          }
          .feature-icon {
            font-size: 32px;
            margin-bottom: 10px;
          }
          .feature-title {
            font-size: 16px;
            font-weight: bold;
            color: #1a1f3a;
            margin-bottom: 5px;
          }
          .feature-desc {
            font-size: 13px;
            color: #6c757d;
          }
          .cta-button { 
            display: inline-block; 
            padding: 16px 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            text-decoration: none; 
            border-radius: 50px; 
            margin: 30px 0;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
          }
          .stats-bar {
            background: linear-gradient(135deg, #1a1f3a 0%, #2d3748 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin: 30px 0;
            text-align: center;
          }
          .stat-item {
            display: inline-block;
            margin: 0 20px;
          }
          .stat-number {
            font-size: 28px;
            font-weight: bold;
            color: #38ef7d;
          }
          .stat-label {
            font-size: 12px;
            opacity: 0.8;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .footer { 
            background: #f8f9fa;
            text-align: center; 
            padding: 30px; 
            color: #6c757d; 
            font-size: 13px;
            border-top: 1px solid #e9ecef;
          }
          .social-links {
            margin: 20px 0;
          }
          .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #667eea;
            text-decoration: none;
            font-weight: bold;
          }
          @media only screen and (max-width: 600px) {
            .features-grid { grid-template-columns: 1fr; }
            .stat-item { display: block; margin: 15px 0; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>🚀 Welcome Aboard!</h1>
            <p>Your journey to becoming a funded trader starts now</p>
          </div>
          <div class="content">
            <div class="welcome-badge">✨ NEW MEMBER</div>
            <div class="greeting">Hi ${user.full_name || user.email?.split('@')[0] || 'Trader'},</div>
            <div class="intro-text">
              Welcome to <strong>${process.env.COMPANY_NAME || 'Fund8r'}</strong>! 🎉 We're thrilled to have you join our elite community of traders. You've just taken the first step toward trading with real capital and keeping up to 90% of your profits.
            </div>

            <div class="stats-bar">
              <div class="stat-item">
                <div class="stat-number">$200K+</div>
                <div class="stat-label">Max Funding</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">90%</div>
                <div class="stat-label">Profit Split</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">24/7</div>
                <div class="stat-label">Support</div>
              </div>
            </div>

            <div class="features-grid">
              <div class="feature-card">
                <div class="feature-icon">📊</div>
                <div class="feature-title">Choose Your Challenge</div>
                <div class="feature-desc">Select from multiple challenge types that fit your trading style</div>
              </div>
              <div class="feature-card">
                <div class="feature-icon">💰</div>
                <div class="feature-title">Get Funded</div>
                <div class="feature-desc">Pass the challenge and trade with our capital</div>
              </div>
              <div class="feature-card">
                <div class="feature-icon">📈</div>
                <div class="feature-title">Real-Time Tracking</div>
                <div class="feature-desc">Monitor your progress with advanced analytics</div>
              </div>
              <div class="feature-card">
                <div class="feature-icon">🎓</div>
                <div class="feature-title">Expert Resources</div>
                <div class="feature-desc">Access trading guides and educational content</div>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing" class="cta-button">
                🚀 Browse Challenges
              </a>
            </div>

            <div style="margin-top: 30px; padding: 20px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 8px;">
              <strong>💡 Pro Tip:</strong> Start with our Rapid Fire challenge if you're an aggressive trader, or choose Classic 2-Step for a more conservative approach.
            </div>
          </div>
          <div class="footer">
            <div class="social-links">
              <a href="#">Twitter</a> • 
              <a href="#">Discord</a> • 
              <a href="#">Instagram</a>
            </div>
            <p>Need help? Reply to this email or visit our <a href="${process.env.FRONTEND_URL}/support" style="color: #667eea;">Support Center</a></p>
            <p style="margin-top: 15px; opacity: 0.7;">&copy; 2024 ${process.env.COMPANY_NAME || 'Fund8r'}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Generate welcome certificate
    const certNumber = 'CERT-' + Date.now();
    const certPath = path.join(this.certsDir, `welcome_${certNumber}.pdf`);
    await this.generateWelcomeCertificate(certPath, user.full_name || user.email, certNumber);

    // Send email with certificate attachment
    await this.transporter.sendMail({
      from: `"${process.env.COMPANY_NAME || 'Fund8r'}" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: subject,
      html: html,
      attachments: [
        {
          filename: `Welcome_Certificate_${certNumber}.pdf`,
          path: certPath,
          contentType: 'application/pdf'
        }
      ]
    });
    
    console.log(`Welcome email with certificate sent to ${user.email}`);
    
    // Also notify admin
    await this.notifyAdminNewSignup(user);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  async sendChallengeStartedEmail(user, account) {
    const subject = 'Your Challenge Has Started!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .credential-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Challenge Started!</h1>
          </div>
          <div class="content">
            <p>Hi ${user.full_name || 'Trader'},</p>
            <p>Your challenge has been activated and is now live!</p>

            <div class="credentials">
              <h3>MT5 Account Credentials</h3>
              <div class="credential-row">
                <strong>Account Number:</strong>
                <span>${account.account_number}</span>
              </div>
              <div class="credential-row">
                <strong>Password:</strong>
                <span>${account.password}</span>
              </div>
              <div class="credential-row">
                <strong>Server:</strong>
                <span>${account.server}</span>
              </div>
              <div class="credential-row">
                <strong>Initial Balance:</strong>
                <span>$${account.initial_balance.toLocaleString()}</span>
              </div>
            </div>

            <div class="warning">
              <strong>Important Rules:</strong>
              <ul>
                <li>Maximum Daily Loss: ${account.challenges.max_daily_loss}%</li>
                <li>Maximum Total Loss: ${account.challenges.max_total_loss}%</li>
                <li>Profit Target: $${account.profit_target.toLocaleString()}</li>
                <li>Minimum Trading Days: ${account.challenges.min_trading_days || 'N/A'}</li>
              </ul>
            </div>

            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">View Dashboard</a>

            <p>Good luck with your challenge!</p>
            <p>Best regards,<br>The ${process.env.COMPANY_NAME} Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(user.email, subject, html);
  }

  async sendRuleViolationEmail(account, violation) {
    const { data: user } = await supabase.from('users').select('*').eq('id', account.user_id).single();

    const subject = violation.severity === 'critical' ? 'URGENT: Rule Violation Detected' : 'Warning: Rule Violation';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${violation.severity === 'critical' ? '#dc3545' : '#ffc107'}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .violation { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${violation.severity === 'critical' ? '#dc3545' : '#ffc107'}; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${violation.severity === 'critical' ? 'Critical Rule Violation' : 'Rule Violation Warning'}</h1>
          </div>
          <div class="content">
            <p>Hi ${user.full_name || 'Trader'},</p>
            <p>${violation.severity === 'critical' ? 'Your account has been suspended due to a critical rule violation.' : 'A rule violation has been detected on your account.'}</p>

            <div class="violation">
              <h3>Violation Details</h3>
              <p><strong>Rule:</strong> ${violation.rule.replace('_', ' ').toUpperCase()}</p>
              <p><strong>Current Value:</strong> ${violation.value.toFixed(2)}%</p>
              <p><strong>Allowed Limit:</strong> ${violation.limit}%</p>
              <p><strong>Severity:</strong> ${violation.severity.toUpperCase()}</p>
            </div>

            ${violation.severity === 'critical' ? '<p><strong>Your account has been automatically suspended. Please contact support for more information.</strong></p>' : '<p>Please review your trading strategy to avoid further violations.</p>'}

            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">View Dashboard</a>

            <p>Best regards,<br>The ${process.env.COMPANY_NAME} Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(user.email, subject, html);
  }

  async sendChallengePassedEmail(account) {
    const { data: user } = await supabase.from('users').select('*').eq('id', account.user_id).single();

    const subject = 'Congratulations! You Passed Your Challenge!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745; }
          .button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations!</h1>
          </div>
          <div class="content">
            <p>Hi ${user.full_name || 'Trader'},</p>
            <p>Fantastic news! You've successfully passed your challenge!</p>

            <div class="success">
              <h3>Challenge Results</h3>
              <p><strong>Final Balance:</strong> $${account.balance.toLocaleString()}</p>
              <p><strong>Profit Target:</strong> $${account.profit_target.toLocaleString()}</p>
              <p><strong>Total Profit:</strong> $${(account.balance - account.initial_balance).toLocaleString()}</p>
            </div>

            <p>Our team will review your account and contact you within 24-48 hours regarding the next steps.</p>

            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">View Certificate</a>

            <p>Congratulations again on this achievement!</p>
            <p>Best regards,<br>The ${process.env.COMPANY_NAME} Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(user.email, subject, html);
  }

  async sendChallengePurchaseEmail(user, challengeData) {
    try {
      const subject = `🎉 Challenge Purchased - ${challengeData.challenge_type} Activated!`;
      
      const certNumber = 'CERT-CHALLENGE-' + Date.now();
      const invoiceNumber = 'INV-' + Date.now();
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; background: #f4f4f4; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
            .content { padding: 30px; }
            .challenge-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; margin: 20px 0; }
            .detail { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.2); }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏆 Challenge Purchased!</h1>
              <p>Your ${challengeData.challenge_type} is ready</p>
            </div>
            <div class="content">
              <h2>Hi ${user.full_name || 'Trader'},</h2>
              <p>Congratulations! You've successfully purchased the <strong>${challengeData.challenge_type}</strong> challenge.</p>
              
              <div class="challenge-card">
                <h3>Challenge Details</h3>
                <div class="detail"><span>Account Size:</span><span>$${challengeData.account_size.toLocaleString()}</span></div>
                <div class="detail"><span>Profit Split:</span><span>${challengeData.profit_split}%</span></div>
                <div class="detail"><span>Price Paid:</span><span>$${challengeData.price_paid}</span></div>
              </div>
              
              <p>📎 <strong>Attached Documents:</strong></p>
              <ul>
                <li>Challenge Certificate (${certNumber}.pdf)</li>
                <li>Purchase Invoice (${invoiceNumber}.pdf)</li>
              </ul>
              
              <p>Your MT5 credentials will be sent within 24 hours.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Fund8r'}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Generate certificates
      const certPath = path.join(this.certsDir, `challenge_${certNumber}.pdf`);
      const invoicePath = path.join(this.certsDir, `invoice_${invoiceNumber}.pdf`);
      
      await this.generateChallengeCertificate(certPath, user.full_name || user.email, certNumber, challengeData);
      await this.generateInvoice(invoicePath, user.full_name || user.email, user.email, invoiceNumber, challengeData);
      
      // Send email with attachments
      await this.transporter.sendMail({
        from: `"${process.env.COMPANY_NAME || 'Fund8r'}" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: subject,
        html: html,
        attachments: [
          {
            filename: `Challenge_Certificate_${certNumber}.pdf`,
            path: certPath,
            contentType: 'application/pdf'
          },
          {
            filename: `Invoice_${invoiceNumber}.pdf`,
            path: invoicePath,
            contentType: 'application/pdf'
          }
        ]
      });
      
      console.log(`Challenge purchase email with certificates sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending challenge purchase email:', error);
      throw error;
    }
  }

  async sendPayoutEmail(user, payoutData) {
    try {
      const subject = `💰 Payout Processed - $${payoutData.amount.toLocaleString()}`;
      const certNumber = 'PAYOUT-' + Date.now();
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; background: #f4f4f4; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 40px; text-align: center; }
            .content { padding: 30px; }
            .payout-card { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px; margin: 20px 0; text-align: center; }
            .amount { font-size: 48px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Payout Processed!</h1>
            </div>
            <div class="content">
              <h2>Hi ${user.full_name || 'Trader'},</h2>
              <p>Great news! Your payout has been successfully processed.</p>
              
              <div class="payout-card">
                <p>Payout Amount</p>
                <div class="amount">$${payoutData.amount.toLocaleString()}</div>
                <p>Payment Method: ${payoutData.payment_method || 'Bank Transfer'}</p>
              </div>
              
              <p>📎 <strong>Attached:</strong> Payout Certificate (${certNumber}.pdf)</p>
              
              <p>The funds should arrive in your account within 2-5 business days.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Fund8r'}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Generate payout certificate
      const certPath = path.join(this.certsDir, `payout_${certNumber}.pdf`);
      await this.generatePayoutCertificate(certPath, user.full_name || user.email, certNumber, payoutData);
      
      // Send email with certificate
      await this.transporter.sendMail({
        from: `"${process.env.COMPANY_NAME || 'Fund8r'}" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: subject,
        html: html,
        attachments: [
          {
            filename: `Payout_Certificate_${certNumber}.pdf`,
            path: certPath,
            contentType: 'application/pdf'
          }
        ]
      });
      
      console.log(`Payout email with certificate sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending payout email:', error);
      throw error;
    }
  }

  async sendDailyProgressEmail(user, account, metrics) {
    const subject = 'Your Daily Trading Progress';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .stats { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .stat-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Daily Progress Report</h1>
          </div>
          <div class="content">
            <p>Hi ${user.full_name || 'Trader'},</p>
            <p>Here's your daily trading progress:</p>

            <div class="stats">
              <div class="stat-row">
                <strong>Current Balance:</strong>
                <span>$${metrics.balance.toLocaleString()}</span>
              </div>
              <div class="stat-row">
                <strong>Today's P&L:</strong>
                <span style="color: ${metrics.profit >= 0 ? '#28a745' : '#dc3545'}">
                  ${metrics.profit >= 0 ? '+' : ''}$${metrics.profit.toFixed(2)}
                </span>
              </div>
              <div class="stat-row">
                <strong>Daily Drawdown:</strong>
                <span>${metrics.daily_drawdown.toFixed(2)}%</span>
              </div>
              <div class="stat-row">
                <strong>Max Drawdown:</strong>
                <span>${metrics.max_drawdown.toFixed(2)}%</span>
              </div>
              <div class="stat-row">
                <strong>Trading Days:</strong>
                <span>${metrics.trading_days}</span>
              </div>
              <div class="stat-row">
                <strong>Consistency Score:</strong>
                <span>${metrics.consistency_score.toFixed(1)}/100</span>
              </div>
            </div>

            <p>Keep up the great work!</p>
            <p>Best regards,<br>The ${process.env.COMPANY_NAME} Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(user.email, subject, html);
  }

  // ========================================
  // PDF CERTIFICATE GENERATION METHODS
  // ========================================

  generateWelcomeCertificate(filePath, traderName, certNumber) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0a0e27');
      doc.moveTo(0, 0).lineTo(100, 0).lineTo(0, 100).fill('#667eea');
      doc.moveTo(0, 0).lineTo(80, 0).lineTo(0, 80).fill('#8B5CF6');
      doc.moveTo(doc.page.width, doc.page.height).lineTo(doc.page.width - 100, doc.page.height).lineTo(doc.page.width, doc.page.height - 100).fill('#667eea');
      doc.moveTo(doc.page.width, doc.page.height).lineTo(doc.page.width - 80, doc.page.height).lineTo(doc.page.width, doc.page.height - 80).fill('#8B5CF6');
      doc.rect(60, 60, doc.page.width - 120, doc.page.height - 120).lineWidth(2).strokeOpacity(0.3).stroke('#667eea');
      doc.rect(70, 70, doc.page.width - 140, doc.page.height - 140).lineWidth(1).strokeOpacity(0.5).stroke('#8B5CF6');
      doc.moveTo(150, 120).lineTo(doc.page.width - 150, 120).lineWidth(1).strokeOpacity(0.5).stroke('#667eea');
      doc.fontSize(56).fillColor('#FFFFFF').font('Helvetica-Bold').text('FUND8R', 0, 90, { align: 'center' });
      doc.fontSize(14).fillColor('#8B5CF6').font('Helvetica').text('CERTIFICATE OF WELCOME', 0, 155, { align: 'center', characterSpacing: 3 });
      doc.moveTo(doc.page.width / 2 - 100, 200).lineTo(doc.page.width / 2 + 100, 200).lineWidth(1).strokeOpacity(0.3).stroke('#667eea');
      doc.fontSize(13).fillColor('#FFFFFF').fillOpacity(0.7).text('This certifies that', 0, 230, { align: 'center' });
      doc.fontSize(42).fillColor('#667eea').fillOpacity(1).font('Helvetica-Bold').text(traderName, 0, 260, { align: 'center' });
      doc.fontSize(13).fillColor('#FFFFFF').fillOpacity(0.7).font('Helvetica').text('has joined the Fund8r elite trading community', 0, 320, { align: 'center' });
      doc.fontSize(16).fillColor('#8B5CF6').fillOpacity(0.9).font('Helvetica-Oblique').text('"Trade Like a Lion, Lead Like a King"', 0, 370, { align: 'center' });
      doc.moveTo(150, 430).lineTo(doc.page.width - 150, 430).lineWidth(1).strokeOpacity(0.3).stroke('#667eea');
      doc.fontSize(10).fillColor('#FFFFFF').fillOpacity(0.5).font('Helvetica').text(`Certificate No: ${certNumber}`, 0, 460, { align: 'center' }).text(`Issued: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 0, 480, { align: 'center' });
      doc.end();
      writeStream.on('finish', () => resolve(filePath));
      writeStream.on('error', reject);
    });
  }

  generateChallengeCertificate(filePath, traderName, certNumber, challengeData) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0f1729');
      doc.polygon([doc.page.width, 0], [doc.page.width - 150, 0], [doc.page.width, 150]).fill('#667eea').fillOpacity(0.1);
      doc.polygon([0, doc.page.height], [150, doc.page.height], [0, doc.page.height - 150]).fill('#8B5CF6').fillOpacity(0.1);
      doc.rect(80, 80, doc.page.width - 160, doc.page.height - 160).lineWidth(2).strokeOpacity(0.6).stroke('#667eea');
      doc.moveTo(100, 100).lineTo(doc.page.width - 100, 100).lineWidth(1).strokeOpacity(0.3).stroke('#8B5CF6');
      doc.moveTo(100, doc.page.height - 100).lineTo(doc.page.width - 100, doc.page.height - 100).lineWidth(1).strokeOpacity(0.3).stroke('#8B5CF6');
      doc.fontSize(48).fillColor('#FFFFFF').font('Helvetica-Bold').text('CHALLENGE PURCHASED', 0, 110, { align: 'center' });
      doc.moveTo(doc.page.width / 2 - 150, 170).lineTo(doc.page.width / 2 + 150, 170).lineWidth(2).strokeOpacity(0.5).stroke('#667eea');
      doc.fontSize(12).fillColor('#8B5CF6').font('Helvetica').text('TRADER', 0, 200, { align: 'center', characterSpacing: 2 });
      doc.fontSize(38).fillColor('#667eea').font('Helvetica-Bold').text(traderName, 0, 225, { align: 'center' });
      
      const detailsY = 290;
      const leftX = 200;
      const rightX = doc.page.width - 350;
      doc.fontSize(11).fillColor('#8B5CF6').fillOpacity(0.7).font('Helvetica').text('CHALLENGE TYPE', leftX, detailsY, { width: 200 });
      doc.fontSize(16).fillColor('#FFFFFF').font('Helvetica-Bold').text(challengeData.challenge_type || 'CLASSIC 2-STEP', leftX, detailsY + 20, { width: 200 });
      doc.fontSize(11).fillColor('#8B5CF6').fillOpacity(0.7).font('Helvetica').text('ACCOUNT SIZE', leftX, detailsY + 60, { width: 200 });
      doc.fontSize(16).fillColor('#FFFFFF').font('Helvetica-Bold').text(`$${challengeData.account_size.toLocaleString()}`, leftX, detailsY + 80, { width: 200 });
      doc.fontSize(11).fillColor('#8B5CF6').fillOpacity(0.7).font('Helvetica').text('PROFIT SPLIT', rightX, detailsY, { width: 200 });
      doc.fontSize(16).fillColor('#FFFFFF').font('Helvetica-Bold').text(`${challengeData.profit_split}%`, rightX, detailsY + 20, { width: 200 });
      doc.fontSize(11).fillColor('#8B5CF6').fillOpacity(0.7).font('Helvetica').text('PURCHASE DATE', rightX, detailsY + 60, { width: 200 });
      doc.fontSize(16).fillColor('#FFFFFF').font('Helvetica-Bold').text(new Date().toLocaleDateString(), rightX, detailsY + 80, { width: 200 });
      doc.fontSize(15).fillColor('#667eea').fillOpacity(0.9).font('Helvetica-Oblique').text('Your Journey to Funded Trading Begins Now!', 0, 440, { align: 'center' });
      doc.fontSize(9).fillColor('#FFFFFF').fillOpacity(0.4).font('Helvetica').text(`Certificate No: ${certNumber}`, 0, doc.page.height - 60, { align: 'center' });
      doc.end();
      writeStream.on('finish', () => resolve(filePath));
      writeStream.on('error', reject);
    });
  }

  generateInvoice(filePath, customerName, customerEmail, invoiceNumber, challengeData) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      doc.rect(0, 0, doc.page.width, 200).fill('#0f1729');
      doc.rect(0, 200, doc.page.width, doc.page.height - 200).fill('#FFFFFF');
      doc.rect(0, 0, doc.page.width, 5).fill('#667eea');
      doc.fontSize(42).fillColor('#FFFFFF').font('Helvetica-Bold').text('FUND8R', 60, 70);
      doc.fontSize(18).fillColor('#8B5CF6').font('Helvetica').text('INVOICE', 60, 120);
      doc.fontSize(11).fillColor('#FFFFFF').fillOpacity(0.7).text('INVOICE NUMBER', doc.page.width - 220, 70, { width: 150, align: 'right' });
      doc.fontSize(16).fillColor('#FFFFFF').fillOpacity(1).font('Helvetica-Bold').text(invoiceNumber, doc.page.width - 220, 90, { width: 150, align: 'right' });
      doc.fontSize(11).fillColor('#FFFFFF').fillOpacity(0.7).font('Helvetica').text('DATE', doc.page.width - 220, 130, { width: 150, align: 'right' });
      doc.fontSize(14).fillColor('#FFFFFF').fillOpacity(1).text(new Date().toLocaleDateString(), doc.page.width - 220, 150, { width: 150, align: 'right' });
      doc.fontSize(11).fillColor('#8B5CF6').text('BILL TO', 60, 250);
      doc.fontSize(16).fillColor('#0f1729').font('Helvetica-Bold').text(customerName, 60, 275);
      doc.fontSize(12).fillColor('#666666').font('Helvetica').text(customerEmail, 60, 300);
      doc.moveTo(60, 340).lineTo(doc.page.width - 60, 340).lineWidth(1).strokeOpacity(0.2).stroke('#667eea');
      doc.fontSize(11).fillColor('#8B5CF6').font('Helvetica-Bold').text('DESCRIPTION', 60, 370).text('AMOUNT', doc.page.width - 160, 370, { width: 100, align: 'right' });
      doc.moveTo(60, 390).lineTo(doc.page.width - 60, 390).lineWidth(1).strokeOpacity(0.1).stroke('#667eea');
      
      let yPos = 410;
      doc.fontSize(13).fillColor('#0f1729').font('Helvetica').text(`${challengeData.challenge_type} Challenge`, 60, yPos).text(`$${challengeData.account_size.toLocaleString()} Account`, 60, yPos + 18, { fillColor: '#666666', fontSize: 11 }).fillColor('#0f1729').text(`$${challengeData.original_price || challengeData.price_paid}`, doc.page.width - 160, yPos, { width: 100, align: 'right' });
      
      if (challengeData.discount > 0) {
        yPos += 60;
        doc.fontSize(13).fillColor('#10B981').text(`Discount (${challengeData.discount_percent || '50'}% OFF)`, 60, yPos).text(`-$${challengeData.discount}`, doc.page.width - 160, yPos, { width: 100, align: 'right' });
      }
      
      yPos += 80;
      doc.rect(doc.page.width - 280, yPos - 20, 220, 100).fillOpacity(0.05).fill('#667eea');
      doc.fontSize(12).fillColor('#666666').fillOpacity(1).font('Helvetica').text('Total:', doc.page.width - 260, yPos + 30).fillColor('#667eea').fontSize(16).font('Helvetica-Bold').text(`$${challengeData.price_paid}`, doc.page.width - 160, yPos + 28, { width: 100, align: 'right' });
      doc.fontSize(10).fillColor('#666666').font('Helvetica').text('Thank you for choosing Fund8r!', 60, doc.page.height - 100, { align: 'center', width: doc.page.width - 120 });
      doc.fontSize(9).fillColor('#999999').text('Questions? Contact support@fund8r.com', 60, doc.page.height - 80, { align: 'center', width: doc.page.width - 120 });
      doc.rect(0, doc.page.height - 5, doc.page.width, 5).fill('#667eea');
      doc.end();
      writeStream.on('finish', () => resolve(filePath));
      writeStream.on('error', reject);
    });
  }

  generatePayoutCertificate(filePath, traderName, certNumber, payoutData) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0a0e27');
      doc.polygon([doc.page.width / 2, 0], [doc.page.width / 2 + 200, 150], [doc.page.width / 2 - 200, 150]).fill('#10B981').fillOpacity(0.1);
      doc.rect(60, 60, doc.page.width - 120, doc.page.height - 120).lineWidth(3).strokeOpacity(0.5).stroke('#10B981');
      doc.rect(70, 70, doc.page.width - 140, doc.page.height - 140).lineWidth(1).strokeOpacity(0.3).stroke('#10B981');
      doc.fontSize(56).fillColor('#10B981').font('Helvetica-Bold').text('PAYOUT CERTIFICATE', 0, 100, { align: 'center' });
      doc.moveTo(200, 170).lineTo(doc.page.width - 200, 170).lineWidth(2).strokeOpacity(0.5).stroke('#10B981');
      doc.fontSize(14).fillColor('#FFFFFF').fillOpacity(0.7).font('Helvetica').text('Payout awarded to', 0, 210, { align: 'center' });
      doc.fontSize(42).fillColor('#FFFFFF').fillOpacity(1).font('Helvetica-Bold').text(traderName, 0, 245, { align: 'center' });
      doc.fontSize(16).fillColor('#10B981').fillOpacity(0.8).font('Helvetica').text(`on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 0, 300, { align: 'center' });
      doc.fontSize(72).fillColor('#10B981').font('Helvetica-Bold').text(`$${payoutData.amount.toLocaleString()}`, 0, 350, { align: 'center' });
      doc.fontSize(14).fillColor('#FFFFFF').fillOpacity(0.6).font('Helvetica-Oblique').text('Congratulations on your successful trading!', 0, 440, { align: 'center' });
      doc.fontSize(10).fillColor('#FFFFFF').fillOpacity(0.4).font('Helvetica').text(`Certificate No: ${certNumber}`, 0, doc.page.height - 80, { align: 'center' });
      doc.fontSize(12).fillColor('#10B981').fillOpacity(0.8).text('CEO & FOUNDER', doc.page.width - 200, doc.page.height - 100, { width: 150, align: 'center' });
      doc.end();
      writeStream.on('finish', () => resolve(filePath));
      writeStream.on('error', reject);
    });
  }
}

export default new EmailService();
