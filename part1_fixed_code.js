const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bynry_case_study', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB successfully');
});

// Validation Schemas
const productSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  sku: Joi.string().required().pattern(/^[A-Z0-9-]+$/).max(50),
  description: Joi.string().optional().max(1000),
  price: Joi.number().positive().precision(2).required(),
  category: Joi.string().required().max(100),
  weight: Joi.number().positive().optional(),
  dimensions: Joi.object({
    length: Joi.number().positive().optional(),
    width: Joi.number().positive().optional(),
    height: Joi.number().positive().optional()
  }).optional(),
  is_bundle: Joi.boolean().default(false),
  bundle_items: Joi.array().items(Joi.string()).when('is_bundle', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.forbidden()
  })
});

const inventoryUpdateSchema = Joi.object({
  warehouse_id: Joi.string().required(),
  quantity: Joi.number().integer().required(),
  operation: Joi.string().valid('add', 'subtract', 'set').required(),
  reason: Joi.string().optional().max(200)
});

// Mongoose Schemas
const productSchemaMongoose = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 255 },
  sku: { type: String, required: true, unique: true, maxlength: 50 },
  description: { type: String, maxlength: 1000 },
  price: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 },
  category: { type: String, required: true, maxlength: 100 },
  weight: { type: Number, min: 0 },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  is_bundle: { type: Boolean, default: false },
  bundle_items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 255 },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  postal_code: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

const inventorySchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  quantity: { type: Number, required: true, min: 0 },
  reserved_quantity: { type: Number, default: 0, min: 0 },
  last_updated: { type: Date, default: Date.now }
});

const inventoryLogSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  operation: { type: String, required: true, enum: ['add', 'subtract', 'set'] },
  quantity_change: { type: Number, required: true },
  previous_quantity: { type: Number, required: true },
  new_quantity: { type: Number, required: true },
  reason: { type: String, maxlength: 200 },
  user_id: { type: String, optional: true },
  timestamp: { type: Date, default: Date.now }
});

// Create indexes for performance
productSchemaMongoose.index({ sku: 1 });
productSchemaMongoose.index({ category: 1 });
inventorySchema.index({ product_id: 1, warehouse_id: 1 }, { unique: true });
inventorySchema.index({ warehouse_id: 1 });
inventoryLogSchema.index({ product_id: 1, timestamp: -1 });
inventoryLogSchema.index({ warehouse_id: 1, timestamp: -1 });

const Product = mongoose.model('Product', productSchemaMongoose);
const Warehouse = mongoose.model('Warehouse', warehouseSchema);
const Inventory = mongoose.model('Inventory', inventorySchema);
const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.message
    });
  }
  
  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'Duplicate Error',
      details: 'SKU already exists'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

// Utility function to validate warehouse existence
const validateWarehouse = async (warehouseId) => {
  const warehouse = await Warehouse.findById(warehouseId);
  if (!warehouse) {
    throw new Error(`Warehouse with ID ${warehouseId} not found`);
  }
  return warehouse;
};

// Utility function to validate product existence
const validateProduct = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }
  return product;
};

// API Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: db.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Add new product
app.post('/api/products', async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = productSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: value.sku });
    if (existingProduct) {
      return res.status(409).json({
        success: false,
        error: 'SKU already exists',
        details: 'A product with this SKU already exists'
      });
    }

    // Validate bundle items if product is a bundle
    if (value.is_bundle && value.bundle_items && value.bundle_items.length > 0) {
      for (const itemId of value.bundle_items) {
        const bundleItem = await Product.findById(itemId);
        if (!bundleItem) {
          return res.status(400).json({
            success: false,
            error: 'Invalid bundle item',
            details: `Product with ID ${itemId} not found`
          });
        }
      }
    }

    // Create product
    const product = new Product({
      ...value,
      price: new mongoose.Types.Decimal128(value.price.toString())
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        id: product._id,
        name: product.name,
        sku: product.sku,
        price: product.price.toString(),
        category: product.category,
        is_bundle: product.is_bundle
      }
    });

  } catch (err) {
    next(err);
  }
});

// Update inventory
app.put('/api/inventory/:product_id', async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

    // Validate input
    const { error, value } = inventoryUpdateSchema.validate(req.body);
    if (error) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { product_id } = req.params;
    const { warehouse_id, quantity, operation, reason } = value;

    // Validate product and warehouse existence
    const [product, warehouse] = await Promise.all([
      validateProduct(product_id),
      validateWarehouse(warehouse_id)
    ]);

    // Find current inventory
    let inventory = await Inventory.findOne({
      product_id,
      warehouse_id
    }).session(session);

    if (!inventory) {
      inventory = new Inventory({
        product_id,
        warehouse_id,
        quantity: 0,
        reserved_quantity: 0
      });
    }

    const previousQuantity = inventory.quantity;
    let newQuantity;

    // Calculate new quantity based on operation
    switch (operation) {
      case 'add':
        newQuantity = inventory.quantity + quantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, inventory.quantity - quantity);
        break;
      case 'set':
        newQuantity = Math.max(0, quantity);
        break;
      default:
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: 'Invalid operation',
          details: 'Operation must be add, subtract, or set'
        });
    }

    // Update inventory
    inventory.quantity = newQuantity;
    inventory.last_updated = new Date();
    await inventory.save({ session });

    // Log inventory change
    const inventoryLog = new InventoryLog({
      product_id,
      warehouse_id,
      operation,
      quantity_change: operation === 'set' ? newQuantity - previousQuantity : quantity,
      previous_quantity: previousQuantity,
      new_quantity: newQuantity,
      reason,
      user_id: req.headers['user-id'] || 'system'
    });

    await inventoryLog.save({ session });

    // Commit transaction
    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      data: {
        product_id,
        warehouse_id,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        operation,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
});

// Get product inventory
app.get('/api/inventory/:product_id', async (req, res, next) => {
  try {
    const { product_id } = req.params;
    
    // Validate product existence
    await validateProduct(product_id);

    // Get inventory across all warehouses
    const inventory = await Inventory.find({ product_id })
      .populate('warehouse_id', 'name city state')
      .populate('product_id', 'name sku category');

    res.json({
      success: true,
      data: {
        product: {
          id: inventory[0]?.product_id._id,
          name: inventory[0]?.product_id.name,
          sku: inventory[0]?.product_id.sku,
          category: inventory[0]?.product_id.category
        },
        inventory: inventory.map(inv => ({
          warehouse_id: inv.warehouse_id._id,
          warehouse_name: inv.warehouse_id.name,
          location: `${inv.warehouse_id.city}, ${inv.warehouse_id.state}`,
          quantity: inv.quantity,
          reserved_quantity: inv.reserved_quantity,
          available_quantity: inv.quantity - inv.reserved_quantity,
          last_updated: inv.last_updated
        }))
      }
    });

  } catch (err) {
    next(err);
  }
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    details: 'The requested resource was not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;


