const mongoose = require('mongoose');

const salesActivitySchema = new mongoose.Schema({
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
  quantity_sold: {
    type: Number,
    required: true,
    min: 1
  },
  sale_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  revenue: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    min: 0,
    precision: 2
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  order_id: {
    type: String,
    maxlength: 100,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

// Indexes
salesActivitySchema.index({ product_id: 1, warehouse_id: 1 });
salesActivitySchema.index({ sale_date: -1 });
salesActivitySchema.index({ product_id: 1, sale_date: -1 });
salesActivitySchema.index({ warehouse_id: 1, sale_date: -1 });

module.exports = mongoose.model('SalesActivity', salesActivitySchema);


