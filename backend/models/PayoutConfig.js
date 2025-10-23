const mongoose = require('mongoose');

const payoutConfigSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  
  payoutCycle: {
    type: String,
    enum: ['BI_MONTHLY', 'MONTHLY', 'BI_WEEKLY', 'WEEKLY'],
    required: true
  },
  
  payoutPercentage: {
    type: Number,
    required: true,
  },
  
  cycleLocked: { type: Boolean, default: false },
  cycleLockedAt: Date,
  
  payoutMethod: {
    type: String,
    enum: ['CRYPTO', 'BANK_TRANSFER', 'PAYPAL', 'WISE'],
    required: true
  },
  
  paymentDetails: {
    cryptoAddress: String,
    cryptoNetwork: String,
    
    bankName: String,
    accountName: String,
    accountNumber: String,
    routingNumber: String,
    swiftCode: String,
    iban: String,
    
    paypalEmail: String,
    
    wiseEmail: String
  },
  
  scheduleSettings: {
    preferredDay: Number,
    timezone: { type: String, default: 'UTC' }
  },
  
  minimumPayout: { type: Number, default: 50 },
  
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending_verification'],
    default: 'pending_verification'
  },
  
  verified: { type: Boolean, default: false },
  verifiedAt: Date,
  verificationNotes: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

payoutConfigSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('PayoutConfig', payoutConfigSchema);
