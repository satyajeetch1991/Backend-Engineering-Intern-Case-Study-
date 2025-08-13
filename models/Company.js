const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 255,
    trim: true
  },
  industry: {
    type: String,
    maxlength: 100,
    trim: true
  },
  address: {
    type: String,
    maxlength: 500,
    trim: true
  },
  contact_email: {
    type: String,
    required: true,
    maxlength: 255,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    maxlength: 20,
    trim: true
  },
  website: {
    type: String,
    maxlength: 255,
    trim: true
  },
  tax_id: {
    type: String,
    maxlength: 50,
    trim: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
companySchema.index({ name: 1 });
companySchema.index({ contact_email: 1 });
companySchema.index({ industry: 1 });

module.exports = mongoose.model('Company', companySchema);


