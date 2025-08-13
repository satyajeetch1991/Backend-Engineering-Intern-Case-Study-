const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  warehouse_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reserved_quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  // available_quantity is calculated as a virtual field
  reorder_point: {
    type: Number,
    required: true,
    min: 0
  },
  max_stock: {
    type: Number,
    min: 0
  },
  last_restocked: {
    type: Date
  },
  next_restock_date: {
    type: Date
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

// Virtual for available quantity
inventorySchema.virtual('available_quantity').get(function() {
  return Math.max(0, this.quantity - this.reserved_quantity);
});

// Pre-save middleware to update available quantity
inventorySchema.pre('save', function(next) {
  this.available_quantity = Math.max(0, this.quantity - this.reserved_quantity);
  next();
});

// Indexes
inventorySchema.index({ product_id: 1, warehouse_id: 1 }, { unique: true });
inventorySchema.index({ warehouse_id: 1 });
inventorySchema.index({ quantity: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
