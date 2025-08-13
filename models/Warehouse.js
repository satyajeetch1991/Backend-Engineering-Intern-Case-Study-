const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 255,
    trim: true
  },
  location: {
    type: String,
    required: true,
    maxlength: 255,
    trim: true
  },
  address: {
    type: String,
    maxlength: 500,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 0
  },
  current_utilization: {
    type: Number,
    default: 0,
    min: 0
  },
  manager_name: {
    type: String,
    maxlength: 255,
    trim: true
  },
  manager_contact: {
    type: String,
    maxlength: 255,
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
warehouseSchema.index({ company_id: 1 });
warehouseSchema.index({ company_id: 1, name: 1 });
warehouseSchema.index({ location: 1 });

module.exports = mongoose.model('Warehouse', warehouseSchema);


