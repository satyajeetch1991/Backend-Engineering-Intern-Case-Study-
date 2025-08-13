const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
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
  change_type: {
    type: String,
    required: true,
    enum: ['restock', 'sale', 'adjustment', 'damage', 'return', 'transfer_in', 'transfer_out']
  },
  quantity_change: {
    type: Number,
    required: true
  },
  previous_quantity: {
    type: Number,
    required: true
  },
  new_quantity: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    maxlength: 500,
    trim: true
  },
  reference_id: {
    type: String,
    maxlength: 100,
    trim: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

// Indexes
inventoryLogSchema.index({ product_id: 1, warehouse_id: 1 });
inventoryLogSchema.index({ change_type: 1 });
inventoryLogSchema.index({ created_at: -1 });
inventoryLogSchema.index({ reference_id: 1 });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);


