const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 255,
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
  address: {
    type: String,
    maxlength: 500,
    trim: true
  },
  city: {
    type: String,
    maxlength: 100,
    trim: true
  },
  state: {
    type: String,
    maxlength: 100,
    trim: true
  },
  country: {
    type: String,
    maxlength: 100,
    trim: true
  },
  postal_code: {
    type: String,
    maxlength: 20,
    trim: true
  },
  tax_id: {
    type: String,
    maxlength: 50,
    trim: true
  },
  payment_terms: {
    type: String,
    maxlength: 100,
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
supplierSchema.index({ name: 1 });
supplierSchema.index({ contact_email: 1 });
supplierSchema.index({ is_active: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);


