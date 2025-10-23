<<<<<<< HEAD
import emailService from './services/emailService.js';
=======
>>>>>>> email-verification
import dotenv from 'dotenv';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
<<<<<<< HEAD

dotenv.config();
=======
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from both root and backend directories FIRST
dotenv.config({ path: path.join(__dirname, '../.env') }); // Root .env
dotenv.config({ path: path.join(__dirname, '.env') }); // Backend .env (overrides root)

// Import emailService AFTER env is loaded (dynamic import)
const { default: emailService } = await import('./services/emailService.js');

// Reinitialize to pick up env variables
emailService.reinitialize();
>>>>>>> email-verification

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ Unhandled Promise Rejection:');
  console.error('Reason:', reason);
  if (reason && typeof reason === 'object') {
    console.error('\nDetailed error:');
    if (reason.message) console.error('Message:', reason.message);
    if (reason.code) console.error('Code:', reason.code);
    if (reason.stack) console.error('Stack:', reason.stack);
    console.error('\nFull object:', JSON.stringify(reason, null, 2));
  }
  process.exit(1);
});

// Check environment variables
function checkEnvVars() {
  console.log('\n🔍 Checking environment variables...');
<<<<<<< HEAD
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
=======
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'];
>>>>>>> email-verification
  const missing = [];
  
  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
      console.log(`❌ ${key}: NOT SET`);
    } else {
      console.log(`✅ ${key}: ${key.includes('PASS') ? '***' : process.env[key]}`);
    }
  });
  
  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:', missing.join(', '));
<<<<<<< HEAD
    console.log('\n� Add these to your backend/.env file:');
    console.log('SMTP_HOST=smtp.gmail.com');
    console.log('SMTP_PORT=587');
    console.log('SMTP_USER=your-email@gmail.com');
    console.log('SMTP_PASS=your-app-password');
    console.log('SUPABASE_URL=your-supabase-url');
    console.log('SUPABASE_ANON_KEY=your-supabase-anon-key');
    console.log('COMPANY_NAME=Fund8r');
=======
    console.log('\n📝 Add these to your .env file (in root directory):');
    console.log('SMTP_HOST=smtp.gmail.com');
    console.log('SMTP_PORT=587');
    console.log('SMTP_USER=your-email@gmail.com');
    console.log('SMTP_PASSWORD=your-app-password');
>>>>>>> email-verification
    console.log('\n📌 For Gmail, you need an App Password:');
    console.log('https://myaccount.google.com/apppasswords');
    return false;
  }
  
  console.log('✅ All SMTP variables configured\n');
  return true;
}

async function sendWelcomeEmail() {
  try {
    console.log('🚀 Starting email send process...');
    
    // Check environment first
    if (!checkEnvVars()) {
      throw new Error('Missing SMTP configuration');
    }
    
    console.log('📧 Target email:', 'giggletales18@gmail.com');
    
    const testEmail = 'giggletales18@gmail.com';
    const testName = 'Anchal Sharma';
    const testUserId = 'test-' + Date.now();
    
    console.log('\n📜 Generating PDF certificates...');
    
    // Generate certificate numbers
    const certNumber = 'CERT-' + Date.now();
    const challengeCertNumber = 'CERT-CLASSIC-' + Date.now();
    const invoiceNumber = 'INV-' + Date.now();
    
    // Ensure certificates directory exists
    const certsDir = path.join(process.cwd(), 'public', 'certificates');
    if (!fs.existsSync(certsDir)) {
      fs.mkdirSync(certsDir, { recursive: true });
    }
    
    // Generate Welcome Certificate PDF
    console.log('\n📜 Step 1: Generating Welcome Certificate PDF...');
    const welcomeCertPath = path.join(certsDir, `welcome_${certNumber}.pdf`);
    await generateWelcomeCertificate(welcomeCertPath, testName, certNumber);
    console.log('✅ Welcome Certificate generated:', welcomeCertPath);
    
    // Generate Challenge Certificate PDF
    console.log('\n📜 Step 2: Generating Challenge Certificate PDF...');
    const challengeCertPath = path.join(certsDir, `challenge_${challengeCertNumber}.pdf`);
    await generateChallengeCertificate(challengeCertPath, testName, challengeCertNumber);
    console.log('✅ Challenge Certificate generated:', challengeCertPath);
    
    // Generate Invoice PDF
    console.log('\n📜 Step 3: Generating Invoice PDF...');
    const invoicePath = path.join(certsDir, `invoice_${invoiceNumber}.pdf`);
    await generateInvoice(invoicePath, testName, testEmail, invoiceNumber);
    console.log('✅ Invoice generated:', invoicePath);
    
    console.log('\n📧 Step 4: Sending email with attachments...');
    // Send email with attachments
    const subject = '🎉 Welcome to Fund8r - Classic Challenge Activated!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center;">
          <h1>🦁 Welcome to Fund8r!</h1>
          <p>Your Classic 2-Step Challenge is Ready</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Hi ${testName},</h2>
          <p>Congratulations! 🎉 You've successfully purchased the <strong>Classic 2-Step Challenge</strong>.</p>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; margin: 20px 0;">
            <h3>🏆 Classic 2-Step Challenge</h3>
            <p><strong>Account Size:</strong> $10,000</p>
            <p><strong>Profit Split:</strong> 80%</p>
            <p><strong>Phase 1 Target:</strong> 8% | <strong>Phase 2 Target:</strong> 5%</p>
            <p><strong>Max Drawdown:</strong> 6%</p>
          </div>
          
          <h3>📄 Your Documents (Attached):</h3>
          <ul>
            <li>📎 <strong>Welcome Certificate</strong> - ${certNumber}.pdf</li>
            <li>📎 <strong>Challenge Certificate</strong> - ${challengeCertNumber}.pdf</li>
            <li>📎 <strong>Purchase Invoice</strong> - ${invoiceNumber}.pdf</li>
          </ul>
          
          <p style="background: #d4edda; padding: 15px; border-left: 4px solid #28a745; border-radius: 8px; margin: 20px 0;">
            <strong>📥 Attached:</strong> All certificates are attached to this email as PDF files. Download and save them for your records!
          </p>
          
          <p style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <strong>💡 Pro Tip:</strong> The Classic 2-Step has unlimited time. Focus on consistency!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173/dashboard" style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; display: inline-block;">
              🎯 Go to Dashboard
            </a>
          </div>
        </div>
        
        <div style="background: #1a1f3a; color: white; padding: 20px; text-align: center;">
          <p>© 2024 Fund8r. All rights reserved.</p>
        </div>
      </div>
    `;
    
    // Send email with PDF attachments
    await emailService.transporter.sendMail({
      from: `"Fund8r" <${process.env.SMTP_USER}>`,
      to: testEmail,
      subject: subject,
      html: html,
      attachments: [
        {
          filename: `Welcome_Certificate_${certNumber}.pdf`,
          path: welcomeCertPath,
          contentType: 'application/pdf'
        },
        {
          filename: `Challenge_Certificate_${challengeCertNumber}.pdf`,
          path: challengeCertPath,
          contentType: 'application/pdf'
        },
        {
          filename: `Invoice_${invoiceNumber}.pdf`,
          path: invoicePath,
          contentType: 'application/pdf'
        }
      ]
    });
    
    console.log('\n✅ Email sent successfully!');
    console.log('📧 Sent to:', testEmail);
    console.log('\n📜 Certificate Numbers Included:');
    console.log('  - Welcome Certificate:', certNumber);
    console.log('  - Invoice Number:', invoiceNumber);
    console.log('\n🎉 Check your email inbox at giggletales18@gmail.com!');
    
  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error('Error message:', error.message);
    
    // Show more detailed error info
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.details) {
      console.error('Error details:', error.details);
    }
    if (error.hint) {
      console.error('Hint:', error.hint);
    }
    
    console.error('\nFull error:', JSON.stringify(error, null, 2));
    throw error;
  }
}

// ========================================
// PDF GENERATION FUNCTIONS
// ========================================

function generateWelcomeCertificate(filePath, traderName, certNumber) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Deep space background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0a0e27');

    // Futuristic corner accents (top-left)
    doc.moveTo(0, 0).lineTo(100, 0).lineTo(0, 100).fill('#667eea');
    doc.moveTo(0, 0).lineTo(80, 0).lineTo(0, 80).fill('#8B5CF6');
    
    // Futuristic corner accents (bottom-right)
    doc.moveTo(doc.page.width, doc.page.height)
       .lineTo(doc.page.width - 100, doc.page.height)
       .lineTo(doc.page.width, doc.page.height - 100)
       .fill('#667eea');
    doc.moveTo(doc.page.width, doc.page.height)
       .lineTo(doc.page.width - 80, doc.page.height)
       .lineTo(doc.page.width, doc.page.height - 80)
       .fill('#8B5CF6');

    // Main border frame
    doc.rect(60, 60, doc.page.width - 120, doc.page.height - 120)
       .lineWidth(2)
       .strokeOpacity(0.3)
       .stroke('#667eea');
    
    doc.rect(70, 70, doc.page.width - 140, doc.page.height - 140)
       .lineWidth(1)
       .strokeOpacity(0.5)
       .stroke('#8B5CF6');

    // Top decorative line
    doc.moveTo(150, 120)
       .lineTo(doc.page.width - 150, 120)
       .lineWidth(1)
       .strokeOpacity(0.5)
       .stroke('#667eea');

    // Logo/Brand
    doc.fontSize(56)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text('FUND8R', 0, 90, { align: 'center' });

    // Subtitle
    doc.fontSize(14)
       .fillColor('#8B5CF6')
       .font('Helvetica')
       .text('CERTIFICATE OF WELCOME', 0, 155, { align: 'center', characterSpacing: 3 });

    // Decorative center line
    const centerY = 200;
    doc.moveTo(doc.page.width / 2 - 100, centerY)
       .lineTo(doc.page.width / 2 + 100, centerY)
       .lineWidth(1)
       .strokeOpacity(0.3)
       .stroke('#667eea');

    // Main content
    doc.fontSize(13)
       .fillColor('#FFFFFF')
       .fillOpacity(0.7)
       .text('This certifies that', 0, 230, { align: 'center' });

    doc.fontSize(42)
       .fillColor('#667eea')
       .fillOpacity(1)
       .font('Helvetica-Bold')
       .text(traderName, 0, 260, { align: 'center' });

    doc.fontSize(13)
       .fillColor('#FFFFFF')
       .fillOpacity(0.7)
       .font('Helvetica')
       .text('has joined the Fund8r elite trading community', 0, 320, { align: 'center' });

    // Quote with modern styling
    doc.fontSize(16)
       .fillColor('#8B5CF6')
       .fillOpacity(0.9)
       .font('Helvetica-Oblique')
       .text('"Trade Like a Lion, Lead Like a King"', 0, 370, { align: 'center' });

    // Bottom decorative line
    doc.moveTo(150, 430)
       .lineTo(doc.page.width - 150, 430)
       .lineWidth(1)
       .strokeOpacity(0.3)
       .stroke('#667eea');

    // Footer info
    doc.fontSize(10)
       .fillColor('#FFFFFF')
       .fillOpacity(0.5)
       .font('Helvetica')
       .text(`Certificate No: ${certNumber}`, 0, 460, { align: 'center' })
       .text(`Issued: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 0, 480, { align: 'center' });

    doc.end();

    writeStream.on('finish', () => resolve(filePath));
    writeStream.on('error', reject);
  });
}

function generateChallengeCertificate(filePath, traderName, certNumber) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Deep navy background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0f1729');

    // Geometric accent - top right
    doc.polygon([doc.page.width, 0], [doc.page.width - 150, 0], [doc.page.width, 150])
       .fill('#667eea')
       .fillOpacity(0.1);
    
    // Geometric accent - bottom left
    doc.polygon([0, doc.page.height], [150, doc.page.height], [0, doc.page.height - 150])
       .fill('#8B5CF6')
       .fillOpacity(0.1);

    // Main frame
    doc.rect(80, 80, doc.page.width - 160, doc.page.height - 160)
       .lineWidth(2)
       .strokeOpacity(0.6)
       .stroke('#667eea');

    // Inner accent lines
    doc.moveTo(100, 100).lineTo(doc.page.width - 100, 100)
       .lineWidth(1)
       .strokeOpacity(0.3)
       .stroke('#8B5CF6');
    
    doc.moveTo(100, doc.page.height - 100).lineTo(doc.page.width - 100, doc.page.height - 100)
       .lineWidth(1)
       .strokeOpacity(0.3)
       .stroke('#8B5CF6');

    // Title
    doc.fontSize(48)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text('CHALLENGE PURCHASED', 0, 110, { align: 'center' });

    // Decorative line under title
    doc.moveTo(doc.page.width / 2 - 150, 170)
       .lineTo(doc.page.width / 2 + 150, 170)
       .lineWidth(2)
       .strokeOpacity(0.5)
       .stroke('#667eea');

    // Trader label
    doc.fontSize(12)
       .fillColor('#8B5CF6')
       .font('Helvetica')
       .text('TRADER', 0, 200, { align: 'center', characterSpacing: 2 });

    // Trader name
    doc.fontSize(38)
       .fillColor('#667eea')
       .font('Helvetica-Bold')
       .text(traderName, 0, 225, { align: 'center' });

    // Details section with modern layout
    const detailsY = 290;
    const leftX = 200;
    const rightX = doc.page.width - 350;

    // Left column
    doc.fontSize(11)
       .fillColor('#8B5CF6')
       .fillOpacity(0.7)
       .font('Helvetica')
       .text('CHALLENGE TYPE', leftX, detailsY, { width: 200 });
    doc.fontSize(16)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text('CLASSIC 2-STEP', leftX, detailsY + 20, { width: 200 });

    doc.fontSize(11)
       .fillColor('#8B5CF6')
       .fillOpacity(0.7)
       .font('Helvetica')
       .text('ACCOUNT SIZE', leftX, detailsY + 60, { width: 200 });
    doc.fontSize(16)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text('$10,000', leftX, detailsY + 80, { width: 200 });

    // Right column
    doc.fontSize(11)
       .fillColor('#8B5CF6')
       .fillOpacity(0.7)
       .font('Helvetica')
       .text('PROFIT SPLIT', rightX, detailsY, { width: 200 });
    doc.fontSize(16)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text('80%', rightX, detailsY + 20, { width: 200 });

    doc.fontSize(11)
       .fillColor('#8B5CF6')
       .fillOpacity(0.7)
       .font('Helvetica')
       .text('PURCHASE DATE', rightX, detailsY + 60, { width: 200 });
    doc.fontSize(16)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text(new Date().toLocaleDateString(), rightX, detailsY + 80, { width: 200 });

    // Motivational message
    doc.fontSize(15)
       .fillColor('#667eea')
       .fillOpacity(0.9)
       .font('Helvetica-Oblique')
       .text('Your Journey to Funded Trading Begins Now!', 0, 440, { align: 'center' });

    // Certificate number at bottom
    doc.fontSize(9)
       .fillColor('#FFFFFF')
       .fillOpacity(0.4)
       .font('Helvetica')
       .text(`Certificate No: ${certNumber}`, 0, doc.page.height - 60, { align: 'center' });

    doc.end();

    writeStream.on('finish', () => resolve(filePath));
    writeStream.on('error', reject);
  });
}

function generateInvoice(filePath, customerName, customerEmail, invoiceNumber) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Modern gradient background
    doc.rect(0, 0, doc.page.width, 200).fill('#0f1729');
    doc.rect(0, 200, doc.page.width, doc.page.height - 200).fill('#FFFFFF');

    // Top accent line
    doc.rect(0, 0, doc.page.width, 5).fill('#667eea');

    // Header section
    doc.fontSize(42)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text('FUND8R', 60, 70);

    doc.fontSize(18)
       .fillColor('#8B5CF6')
       .font('Helvetica')
       .text('INVOICE', 60, 120);

    // Invoice number in header
    doc.fontSize(11)
       .fillColor('#FFFFFF')
       .fillOpacity(0.7)
       .text('INVOICE NUMBER', doc.page.width - 220, 70, { width: 150, align: 'right' });
    doc.fontSize(16)
       .fillColor('#FFFFFF')
       .fillOpacity(1)
       .font('Helvetica-Bold')
       .text(invoiceNumber, doc.page.width - 220, 90, { width: 150, align: 'right' });

    doc.fontSize(11)
       .fillColor('#FFFFFF')
       .fillOpacity(0.7)
       .font('Helvetica')
       .text('DATE', doc.page.width - 220, 130, { width: 150, align: 'right' });
    doc.fontSize(14)
       .fillColor('#FFFFFF')
       .fillOpacity(1)
       .text(new Date().toLocaleDateString(), doc.page.width - 220, 150, { width: 150, align: 'right' });

    // Bill to section
    doc.fontSize(11)
       .fillColor('#8B5CF6')
       .text('BILL TO', 60, 250);
    
    doc.fontSize(16)
       .fillColor('#0f1729')
       .font('Helvetica-Bold')
       .text(customerName, 60, 275);
    
    doc.fontSize(12)
       .fillColor('#666666')
       .font('Helvetica')
       .text(customerEmail, 60, 300);

    // Decorative line
    doc.moveTo(60, 340)
       .lineTo(doc.page.width - 60, 340)
       .lineWidth(1)
       .strokeOpacity(0.2)
       .stroke('#667eea');

    // Items section header
    doc.fontSize(11)
       .fillColor('#8B5CF6')
       .font('Helvetica-Bold')
       .text('DESCRIPTION', 60, 370)
       .text('AMOUNT', doc.page.width - 160, 370, { width: 100, align: 'right' });

    doc.moveTo(60, 390)
       .lineTo(doc.page.width - 60, 390)
       .lineWidth(1)
       .strokeOpacity(0.1)
       .stroke('#667eea');

    // Line items
    let yPos = 410;
    doc.fontSize(13)
       .fillColor('#0f1729')
       .font('Helvetica')
       .text('Classic 2-Step Challenge', 60, yPos)
       .text('$10,000 Account', 60, yPos + 18, { fillColor: '#666666', fontSize: 11 })
       .fillColor('#0f1729')
       .text('$98.00', doc.page.width - 160, yPos, { width: 100, align: 'right' });

    yPos += 60;
    doc.fontSize(13)
       .fillColor('#10B981')
       .text('Discount (50% OFF)', 60, yPos)
       .text('-$49.00', doc.page.width - 160, yPos, { width: 100, align: 'right' });

    // Subtotal and total section
    yPos += 80;
    doc.rect(doc.page.width - 280, yPos - 20, 220, 100)
       .fillOpacity(0.05)
       .fill('#667eea');

    doc.fontSize(12)
       .fillColor('#666666')
       .fillOpacity(1)
       .font('Helvetica')
       .text('Subtotal:', doc.page.width - 260, yPos)
       .text('$98.00', doc.page.width - 160, yPos, { width: 100, align: 'right' });

    yPos += 25;
    doc.text('Discount:', doc.page.width - 260, yPos)
       .text('-$49.00', doc.page.width - 160, yPos, { width: 100, align: 'right' });

    yPos += 30;
    doc.moveTo(doc.page.width - 260, yPos)
       .lineTo(doc.page.width - 60, yPos)
       .lineWidth(1)
       .strokeOpacity(0.3)
       .stroke('#667eea');

    yPos += 15;
    doc.fontSize(16)
       .fillColor('#0f1729')
       .font('Helvetica-Bold')
       .text('Total:', doc.page.width - 260, yPos)
       .fillColor('#667eea')
       .text('$49.00', doc.page.width - 160, yPos, { width: 100, align: 'right' });

    // Footer
    doc.fontSize(10)
       .fillColor('#666666')
       .font('Helvetica')
       .text('Thank you for choosing Fund8r!', 60, doc.page.height - 100, { align: 'center', width: doc.page.width - 120 });
    
    doc.fontSize(9)
       .fillColor('#999999')
       .text('Questions? Contact support@fund8r.com', 60, doc.page.height - 80, { align: 'center', width: doc.page.width - 120 });

    // Bottom accent
    doc.rect(0, doc.page.height - 5, doc.page.width, 5).fill('#667eea');

    doc.end();

    writeStream.on('finish', () => resolve(filePath));
    writeStream.on('error', reject);
  });
}

sendWelcomeEmail()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed with error:');
    console.error(error);
    process.exit(1);
  });