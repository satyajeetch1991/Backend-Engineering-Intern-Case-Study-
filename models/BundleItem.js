const mongoose = require('mongoose');

const bundleItemSchema = new mongoose.Schema({
  bundle_product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  component_product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  is_required: {
    type: Boolean,
    default: true
  },
  discount_percentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
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
bundleItemSchema.index({ bundle_product_id: 1, component_product_id: 1 }, { unique: true });
bundleItemSchema.index({ bundle_product_id: 1 });
bundleItemSchema.index({ component_product_id: 1 });

module.exports = mongoose.model('BundleItem', bundleItemSchema);


