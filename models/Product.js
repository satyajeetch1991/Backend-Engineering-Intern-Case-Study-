const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 255,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    maxlength: 50,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 2000,
    trim: true
  },
  price: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    min: 0,
    precision: 2
  },
  category: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  subcategory: {
    type: String,
    maxlength: 100,
    trim: true
  },
  brand: {
    type: String,
    maxlength: 100,
    trim: true
  },
  weight: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
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
productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);


