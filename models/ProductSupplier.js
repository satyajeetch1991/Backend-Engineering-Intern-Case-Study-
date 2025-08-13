const mongoose = require('mongoose');

const productSupplierSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  is_primary: {
    type: Boolean,
    default: false
  },
  lead_time_days: {
    type: Number,
    required: true,
    min: 0
  },
  unit_cost: {
    type: mongoose.Schema.Types.Decimal128,
    min: 0,
    precision: 2
  },
  minimum_order_quantity: {
    type: Number,
    min: 1,
    default: 1
  },
  supplier_sku: {
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
productSupplierSchema.index({ product_id: 1, supplier_id: 1 }, { unique: true });
productSupplierSchema.index({ product_id: 1, is_primary: 1 });
productSupplierSchema.index({ supplier_id: 1 });

module.exports = mongoose.model('ProductSupplier', productSupplierSchema);


