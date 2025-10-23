import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { supabase } from '../config/supabase.js';

class CertificateService {
  constructor() {
    this.colors = {
      purple: '#8B5CF6',
      darkBlue: '#1E3A8A',
      blue: '#3B82F6',
      white: '#FFFFFF',
      gold: '#FCD34D',
      green: '#10B981',
      red: '#EF4444'
    };
    
    this.ensureDirectories();
  }

  ensureDirectories() {
    const dirs = [
      path.join(process.cwd(), 'public', 'certificates'),
      path.join(process.cwd(), 'public', 'invoices'),
      path.join(process.cwd(), 'public', 'receipts')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  generateDocumentNumber(type) {
    const prefix = {
      'certificate': 'CERT',
      'invoice': 'INV',
      'receipt': 'REC'
    }[type] || 'DOC';
    
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  }

  // ========================================
  // 1. WELCOME CERTIFICATE
  // ========================================
  async generateWelcomeCertificate(userId, userData) {
    try {
      const docNumber = this.generateDocumentNumber('certificate');
      const fileName = `welcome_${userId}_${Date.now()}.pdf`;
      const filePath = path.join(process.cwd(), 'public', 'certificates', fileName);

      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Background
      doc.rect(0, 0, doc.page.width, doc.page.height)
         .fill(this.colors.darkBlue);

      // Gold border
      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
         .lineWidth(5)
         .stroke(this.colors.gold);

      // Inner border
      doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80)
         .lineWidth(2)
         .stroke(this.colors.gold);

      // Lion emoji and branding
      doc.fontSize(60)
         .fillColor(this.colors.gold)
         .text('🦁', 0, 80, { align: 'center' });

      doc.fontSize(48)
         .fillColor(this.colors.white)
         .text('FUND8R', 0, 160, { align: 'center' });

      doc.fontSize(24)
         .fillColor(this.colors.gold)
         .text('CERTIFICATE OF WELCOME', 0, 220, { align: 'center' });

      // Main content
      doc.fontSize(16)
         .fillColor(this.colors.white)
         .text('This certifies that', 0, 280, { align: 'center' });

      doc.fontSize(36)
         .fillColor(this.colors.gold)
         .text(userData.full_name || userData.email, 0, 310, { align: 'center' });

      doc.fontSize(16)
         .fillColor(this.colors.white)
         .text('has joined the Fund8r trading community', 0, 360, { align: 'center' });

      // Quote
      doc.fontSize(18)
         .fillColor(this.colors.gold)
         .text('"Trade Like a Lion, Lead Like a King"', 0, 410, { align: 'center', oblique: true });

      // Footer
      doc.fontSize(12)
         .fillColor(this.colors.white)
         .text(`Certificate No: ${docNumber}`, 0, 500, { align: 'center' })
         .text(`Issued: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 0, 520, { align: 'center' });

      doc.end();

      return new Promise((resolve, reject) => {
        writeStream.on('finish', async () => {
          // Save to database
          const { data, error } = await supabase
            .from('downloads')
            .insert({
              user_id: userId,
              document_type: 'certificate',
              document_number: docNumber,
              title: 'Welcome Certificate',
              file_path: `/certificates/${fileName}`,
              file_name: fileName,
              file_size: fs.statSync(filePath).size,
              status: 'ready',
              certificate_data: {
                type: 'welcome',
                trader_name: userData.full_name || userData.email,
                issue_date: new Date().toISOString()
              }
            })
            .select()
            .single();

          if (error) throw error;
          resolve({ filePath, data });
        });

        writeStream.on('error', reject);
      });
    } catch (error) {
      console.error('Error generating welcome certificate:', error);
      throw error;
    }
  }

  // ========================================
  // 2. CHALLENGE STARTED CERTIFICATE
  // ========================================
  async generateChallengeStartedCertificate(userId, accountData) {
    try {
      const docNumber = this.generateDocumentNumber('certificate');
      const fileName = `challenge_${accountData.id}_${Date.now()}.pdf`;
      const filePath = path.join(process.cwd(), 'public', 'certificates', fileName);

      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Background gradient effect
      doc.rect(0, 0, doc.page.width, doc.page.height)
         .fill(this.colors.darkBlue);

      // Border
      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
         .lineWidth(4)
         .stroke(this.colors.blue);

      // Rocket emoji
      doc.fontSize(60)
         .fillColor(this.colors.blue)
         .text('🚀', 0, 80, { align: 'center' });

      doc.fontSize(42)
         .fillColor(this.colors.white)
         .text('CHALLENGE STARTED', 0, 160, { align: 'center' });

      doc.fontSize(18)
         .fillColor(this.colors.white)
         .text('Trader:', 0, 240, { align: 'center' });

      doc.fontSize(32)
         .fillColor(this.colors.blue)
         .text(accountData.trader_name, 0, 270, { align: 'center' });

      // Challenge details
      doc.fontSize(16)
         .fillColor(this.colors.white)
         .text(`Challenge Type: ${accountData.challenge_type}`, 0, 330, { align: 'center' })
         .text(`Account Size: $${accountData.account_size.toLocaleString()}`, 0, 360, { align: 'center' })
         .text(`Start Date: ${new Date(accountData.start_date).toLocaleDateString()}`, 0, 390, { align: 'center' });

      // Motivational message
      doc.fontSize(18)
         .fillColor(this.colors.blue)
         .text('Your Journey to Funded Trading Begins Now!', 0, 440, { align: 'center', oblique: true });

      // Footer
      doc.fontSize(12)
         .fillColor(this.colors.white)
         .text(`Certificate No: ${docNumber}`, 0, 500, { align: 'center' });

      doc.end();

      return new Promise((resolve, reject) => {
        writeStream.on('finish', async () => {
          const { data, error } = await supabase
            .from('downloads')
            .insert({
              user_id: userId,
              document_type: 'certificate',
              document_number: docNumber,
              title: 'Challenge Started Certificate',
              file_path: `/certificates/${fileName}`,
              file_name: fileName,
              file_size: fs.statSync(filePath).size,
              status: 'ready',
              certificate_data: {
                type: 'challenge_started',
                challenge_type: accountData.challenge_type,
                account_size: accountData.account_size,
                start_date: accountData.start_date
              }
            })
            .select()
            .single();

          if (error) throw error;
          resolve({ filePath, data });
        });

        writeStream.on('error', reject);
      });
    } catch (error) {
      console.error('Error generating challenge started certificate:', error);
      throw error;
    }
  }

  // ========================================
  // 3. PURCHASE INVOICE
  // ========================================
  async generatePurchaseInvoice(userId, transactionData) {
    try {
      const docNumber = this.generateDocumentNumber('invoice');
      const fileName = `invoice_${userId}_${Date.now()}.pdf`;
      const filePath = path.join(process.cwd(), 'public', 'invoices', fileName);

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Header
      doc.fontSize(32)
         .fillColor(this.colors.darkBlue)
         .text('FUND8R', 50, 50);

      doc.fontSize(48)
         .fillColor(this.colors.blue)
         .text('INVOICE', 400, 50);

      // Invoice details
      doc.fontSize(12)
         .fillColor('#000000')
         .text(`Invoice Number: ${docNumber}`, 50, 120)
         .text(`Date: ${new Date().toLocaleDateString()}`, 50, 140)
         .text(`Due Date: ${new Date().toLocaleDateString()}`, 50, 160);

      // Bill to
      doc.fontSize(14)
         .text('Bill To:', 50, 200)
         .fontSize(12)
         .text(transactionData.customer_name, 50, 220)
         .text(transactionData.customer_email, 50, 240);

      // Items table
      const tableTop = 300;
      doc.fontSize(12)
         .text('Description', 50, tableTop)
         .text('Amount', 450, tableTop);

      doc.moveTo(50, tableTop + 20)
         .lineTo(550, tableTop + 20)
         .stroke();

      let yPos = tableTop + 40;
      doc.text(transactionData.description, 50, yPos)
         .text(`$${transactionData.amount.toFixed(2)}`, 450, yPos);

      if (transactionData.discount > 0) {
        yPos += 30;
        doc.text('Discount', 50, yPos)
           .text(`-$${transactionData.discount.toFixed(2)}`, 450, yPos);
      }

      // Total
      yPos += 50;
      doc.fontSize(14)
         .text('Total:', 50, yPos)
         .text(`$${(transactionData.amount - (transactionData.discount || 0)).toFixed(2)}`, 450, yPos);

      // Footer
      doc.fontSize(10)
         .fillColor('#666666')
         .text('Thank you for your business!', 50, 700, { align: 'center' });

      doc.end();

      return new Promise((resolve, reject) => {
        writeStream.on('finish', async () => {
          const { data, error } = await supabase
            .from('downloads')
            .insert({
              user_id: userId,
              document_type: 'invoice',
              document_number: docNumber,
              title: 'Purchase Invoice',
              file_path: `/invoices/${fileName}`,
              file_name: fileName,
              file_size: fs.statSync(filePath).size,
              status: 'ready',
              invoice_data: {
                customer_name: transactionData.customer_name,
                customer_email: transactionData.customer_email,
                amount: transactionData.amount,
                discount: transactionData.discount || 0,
                total: transactionData.amount - (transactionData.discount || 0)
              }
            })
            .select()
            .single();

          if (error) throw error;
          resolve({ filePath, data });
        });

        writeStream.on('error', reject);
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  }

  // ========================================
  // LEGACY METHOD (for backward compatibility)
  // ========================================
  async generateCertificate(accountId) {
    try {
      const { data: account } = await supabase
        .from('mt5_accounts')
        .select('*, user_id')
        .eq('id', accountId)
        .single();

      if (!account) {
        throw new Error('Account not found');
      }

      const { data: user } = await supabase.auth.admin.getUserById(account.user_id);

      return await this.generateChallengeStartedCertificate(account.user_id, {
        id: accountId,
        trader_name: user?.user_metadata?.full_name || user?.email || 'Trader',
        challenge_type: 'Trading Challenge',
        account_size: account.account_size || 10000,
        start_date: account.created_at || new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating certificate:', error);
      throw error;
    }
  }

  async getCertificate(accountId) {
    const { data: certificate } = await supabase
      .from('downloads')
      .select('*')
      .eq('document_type', 'certificate')
      .contains('certificate_data', { account_id: accountId })
      .single();

    if (!certificate) {
      const result = await this.generateCertificate(accountId);
      return result.filePath;
    }

    return path.join(process.cwd(), 'public', certificate.file_path);
  }
}

export default new CertificateService();
