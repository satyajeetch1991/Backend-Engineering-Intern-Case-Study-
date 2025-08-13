const mongoose = require('mongoose');

// Company Schema
const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 255,
    trim: true
  },
  legal_name: {
    type: String,
    maxlength: 255,
    trim: true
  },
  tax_id: {
    type: String,
    maxlength: 50,
    unique: true,
    sparse: true
  },
  address: {
    street: { type: String, required: true, maxlength: 255 },
    city: { type: String, required: true, maxlength: 100 },
    state: { type: String, required: true, maxlength: 100 },
    country: { type: String, required: true, maxlength: 100 },
    postal_code: { type: String, required: true, maxlength: 20 }
  },
  contact: {
    email: { type: String, required: true, maxlength: 255 },
    phone: { type: String, maxlength: 20 },
    website: { type: String, maxlength: 255 }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  settings: {
    low_stock_thresholds: {
      electronics: { type: Number, default: 10, min: 0 },
      clothing: { type: Number, default: 25, min: 0 },
      food: { type: Number, default: 50, min: 0 },
      default: { type: Number, default: 20, min: 0 }
    },
    alert_frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    }
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Warehouse Schema
const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 255,
    trim: true
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  code: {
    type: String,
    required: true,
    maxlength: 20,
    unique: true
  },
  type: {
    type: String,
    enum: ['primary', 'secondary', 'distribution', 'retail'],
    default: 'secondary'
  },
  address: {
    street: { type: String, required: true, maxlength: 255 },
    city: { type: String, required: true, maxlength: 100 },
    state: { type: String, required: true, maxlength: 100 },
    country: { type: String, required: true, maxlength: 100 },
    postal_code: { type: String, required: true, maxlength: 20 }
  },
  contact: {
    manager: { type: String, maxlength: 100 },
    email: { type: String, maxlength: 255 },
    phone: { type: String, maxlength: 20 }
  },
  capacity: {
    total_space: { type: Number, min: 0 }, // in cubic meters
    used_space: { type: Number, min: 0, default: 0 },
    total_pallets: { type: Number, min: 0 },
    used_pallets: { type: Number, min: 0, default: 0 }
  },
  operating_hours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Product Schema
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
  short_description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  price: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    min: 0,
    precision: 2
  },
  cost_price: {
    type: mongoose.Schema.Types.Decimal128,
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
    min: 0,
    precision: 2
  },
  dimensions: {
    length: { type: Number, min: 0, precision: 2 },
    width: { type: Number, min: 0, precision: 2 },
    height: { type: Number, min: 0, precision: 2 },
    unit: { type: String, enum: ['cm', 'inch'], default: 'cm' }
  },
  is_bundle: {
    type: Boolean,
    default: false
  },
  bundle_items: [{
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true, min: 1 }
  }],
  tags: [{
    type: String,
    maxlength: 50,
    trim: true
  }],
  images: [{
    url: { type: String, required: true, maxlength: 500 },
    alt_text: { type: String, maxlength: 100 },
    is_primary: { type: Boolean, default: false }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Inventory Schema
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
    min: 0,
    default: 0
  },
  allocated_quantity: {
    type: Number,
    min: 0,
    default: 0
  },
  safety_stock: {
    type: Number,
    min: 0,
    default: 0
  },
  reorder_point: {
    type: Number,
    min: 0,
    default: 0
  },
  reorder_quantity: {
    type: Number,
    min: 0,
    default: 0
  },
  last_restocked: { type: Date },
  last_updated: { type: Date, default: Date.now },
  expiry_date: { type: Date },
  batch_number: { type: String, maxlength: 100 },
  location_details: {
    aisle: { type: String, maxlength: 50 },
    shelf: { type: String, maxlength: 50 },
    bin: { type: String, maxlength: 50 }
  }
});

// Inventory Log Schema
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
  operation: {
    type: String,
    required: true,
    enum: ['add', 'subtract', 'set', 'reserve', 'allocate', 'adjust']
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
    maxlength: 200,
    trim: true
  },
  reference_type: {
    type: String,
    enum: ['order', 'purchase', 'return', 'adjustment', 'transfer', 'system'],
    default: 'system'
  },
  reference_id: {
    type: String,
    maxlength: 100
  },
  user_id: {
    type: String,
    maxlength: 100
  },
  notes: {
    type: String,
    maxlength: 500,
    trim: true
  },
  timestamp: { type: Date, default: Date.now }
});

// Supplier Schema
const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 255,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    maxlength: 20,
    uppercase: true,
    trim: true
  },
  company_name: {
    type: String,
    required: true,
    maxlength: 255,
    trim: true
  },
  tax_id: {
    type: String,
    maxlength: 50,
    unique: true,
    sparse: true
  },
  address: {
    street: { type: String, required: true, maxlength: 255 },
    city: { type: String, required: true, maxlength: 100 },
    state: { type: String, required: true, maxlength: 100 },
    country: { type: String, required: true, maxlength: 100 },
    postal_code: { type: String, required: true, maxlength: 20 }
  },
  contact: {
    primary: {
      name: { type: String, required: true, maxlength: 100 },
      email: { type: String, required: true, maxlength: 255 },
      phone: { type: String, maxlength: 20 },
      title: { type: String, maxlength: 100 }
    },
    billing: {
      name: { type: String, maxlength: 100 },
      email: { type: String, maxlength: 255 },
      phone: { type: String, maxlength: 20 }
    }
  },
  payment_terms: {
    type: String,
    enum: ['net_30', 'net_60', 'net_90', 'immediate'],
    default: 'net_30'
  },
  credit_limit: {
    type: mongoose.Schema.Types.Decimal128,
    min: 0,
    precision: 2
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  categories: [{
    type: String,
    maxlength: 100,
    trim: true
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Product Supplier Schema
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
  supplier_sku: {
    type: String,
    maxlength: 100,
    trim: true
  },
  is_primary: {
    type: Boolean,
    default: false
  },
  lead_time_days: {
    type: Number,
    min: 0,
    default: 7
  },
  minimum_order_quantity: {
    type: Number,
    min: 1,
    default: 1
  },
  unit_cost: {
    type: mongoose.Schema.Types.Decimal128,
    min: 0,
    precision: 2
  },
  bulk_pricing: [{
    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0, precision: 2 }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  last_order_date: { type: Date },
  last_order_quantity: { type: Number, min: 0 },
  notes: {
    type: String,
    maxlength: 500,
    trim: true
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Bundle Items Schema
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
  is_optional: {
    type: Boolean,
    default: false
  },
  can_substitute: {
    type: Boolean,
    default: false
  },
  substitute_products: [{
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    priority: { type: Number, min: 1, default: 1 }
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Sales Activity Schema (for tracking recent sales)
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
    required: true
  },
  order_id: {
    type: String,
    maxlength: 100
  },
  customer_id: {
    type: String,
    maxlength: 100
  },
  unit_price: {
    type: mongoose.Schema.Types.Decimal128,
    min: 0,
    precision: 2
  },
  total_amount: {
    type: mongoose.Schema.Types.Decimal128,
    min: 0,
    precision: 2
  },
  created_at: { type: Date, default: Date.now }
});

// Create indexes for performance
companySchema.index({ tax_id: 1 });
companySchema.index({ 'contact.email': 1 });
companySchema.index({ status: 1 });

warehouseSchema.index({ company_id: 1 });
warehouseSchema.index({ code: 1 });
warehouseSchema.index({ status: 1 });
warehouseSchema.index({ 'address.city': 1, 'address.state': 1 });

productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ status: 1 });
productSchema.index({ tags: 1 });

inventorySchema.index({ product_id: 1, warehouse_id: 1 }, { unique: true });
inventorySchema.index({ warehouse_id: 1 });
inventorySchema.index({ quantity: 1 });
inventorySchema.index({ 'location_details.aisle': 1, 'location_details.shelf': 1 });

inventoryLogSchema.index({ product_id: 1, timestamp: -1 });
inventoryLogSchema.index({ warehouse_id: 1, timestamp: -1 });
inventoryLogSchema.index({ operation: 1, timestamp: -1 });
inventoryLogSchema.index({ reference_type: 1, reference_id: 1 });

supplierSchema.index({ code: 1 });
supplierSchema.index({ tax_id: 1 });
supplierSchema.index({ status: 1 });
supplierSchema.index({ categories: 1 });

productSupplierSchema.index({ product_id: 1, supplier_id: 1 }, { unique: true });
productSupplierSchema.index({ supplier_id: 1 });
productSupplierSchema.index({ is_primary: 1 });

bundleItemSchema.index({ bundle_product_id: 1 });
bundleItemSchema.index({ component_product_id: 1 });

salesActivitySchema.index({ product_id: 1, sale_date: -1 });
salesActivitySchema.index({ warehouse_id: 1, sale_date: -1 });
salesActivitySchema.index({ sale_date: -1 });

// Create models
const Company = mongoose.model('Company', companySchema);
const Warehouse = mongoose.model('Warehouse', warehouseSchema);
const Product = mongoose.model('Product', productSchema);
const Inventory = mongoose.model('Inventory', inventorySchema);
const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);
const Supplier = mongoose.model('Supplier', supplierSchema);
const ProductSupplier = mongoose.model('ProductSupplier', productSupplierSchema);
const BundleItem = mongoose.model('BundleItem', bundleItemSchema);
const SalesActivity = mongoose.model('SalesActivity', salesActivitySchema);

module.exports = {
  Company,
  Warehouse,
  Product,
  Inventory,
  InventoryLog,
  Supplier,
  ProductSupplier,
  BundleItem,
  SalesActivity
};


