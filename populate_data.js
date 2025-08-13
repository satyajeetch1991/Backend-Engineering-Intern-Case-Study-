const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Company = require('./models/Company');
const Warehouse = require('./models/Warehouse');
const Product = require('./models/Product');
const Inventory = require('./models/Inventory');
const InventoryLog = require('./models/InventoryLog');
const Supplier = require('./models/Supplier');
const ProductSupplier = require('./models/ProductSupplier');
const SalesActivity = require('./models/SalesActivity');

async function populateData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bynry_case_study');
    console.log('Connected to MongoDB');

    // Drop all collections and indexes to start fresh
    await Promise.all([
      Company.collection.drop(),
      Warehouse.collection.drop(),
      Product.collection.drop(),
      Inventory.collection.drop(),
      InventoryLog.collection.drop(),
      Supplier.collection.drop(),
      ProductSupplier.collection.drop(),
      SalesActivity.deleteMany({})
    ]);
    console.log('Dropped all collections and indexes');

    // Create Company
    const company = await Company.create({
      name: 'TechCorp Solutions',
      industry: 'Technology',
      address: '123 Tech Street, Silicon Valley, CA',
      contact_email: 'info@techcorp.com',
      phone: '+1-555-0123'
    });
    console.log('Created company:', company.name);

    // Create Warehouses
    const warehouse1 = await Warehouse.create({
      company_id: company._id,
      name: 'Main Distribution Center',
      location: 'San Francisco, CA',
      capacity: 10000,
      address: '456 Warehouse Ave, San Francisco, CA'
    });

    const warehouse2 = await Warehouse.create({
      company_id: company._id,
      name: 'East Coast Hub',
      location: 'New York, NY',
      capacity: 8000,
      address: '789 Storage Blvd, New York, NY'
    });
    console.log('Created warehouses');

    // Create Suppliers
    const supplier1 = await Supplier.create({
      name: 'Apple Inc.',
      contact_email: 'procurement@apple.com',
      phone: '+1-555-APPLE',
      address: '1 Infinite Loop, Cupertino, CA'
    });

    const supplier2 = await Supplier.create({
      name: 'Samsung Electronics',
      contact_email: 'sales@samsung.com',
      phone: '+1-555-SAMSUNG',
      address: '85 Challenger Rd, Ridgefield Park, NJ'
    });

    const supplier3 = await Supplier.create({
      name: 'Nike Inc.',
      contact_email: 'wholesale@nike.com',
      phone: '+1-555-NIKE',
      address: '1 Bowerman Dr, Beaverton, OR'
    });
    console.log('Created suppliers');

    // Create Products
    const product1 = await Product.create({
      name: 'iPhone 15 Pro Max',
      sku: 'IPH-15-PRO-MAX-256',
      description: 'Latest iPhone with 256GB storage',
      price: 1199.99,
      category: 'Electronics',
      weight: 0.221,
      dimensions: { length: 15.9, width: 7.7, height: 0.8 }
    });

    const product2 = await Product.create({
      name: 'Samsung Galaxy S24',
      sku: 'SAMSUNG-S24-128',
      description: 'Android flagship smartphone',
      price: 999.99,
      category: 'Electronics',
      weight: 0.196,
      dimensions: { length: 15.7, width: 7.4, height: 0.8 }
    });

    const product3 = await Product.create({
      name: 'Nike Air Max 270',
      sku: 'NIKE-AIRMAX-270-10',
      description: 'Comfortable running shoes',
      price: 150.00,
      category: 'Clothing',
      weight: 0.85,
      dimensions: { length: 30, width: 12, height: 8 }
    });

    const product4 = await Product.create({
      name: 'Organic Bananas',
      sku: 'FOOD-BANANAS-ORG',
      description: 'Fresh organic bananas per bunch',
      price: 4.99,
      category: 'Food',
      weight: 0.5,
      dimensions: { length: 20, width: 15, height: 5 }
    });
    console.log('Created products');

    // Create Product-Supplier relationships
    await ProductSupplier.create([
      { product_id: product1._id, supplier_id: supplier1._id, is_primary: true, lead_time_days: 7 },
      { product_id: product2._id, supplier_id: supplier2._id, is_primary: true, lead_time_days: 5 },
      { product_id: product3._id, supplier_id: supplier3._id, is_primary: true, lead_time_days: 3 },
      { product_id: product4._id, supplier_id: supplier3._id, is_primary: true, lead_time_days: 1 }
    ]);
    console.log('Created product-supplier relationships');

    // Create Inventory
    await Inventory.create([
      {
        product_id: product1._id,
        warehouse_id: warehouse1._id,
        quantity: 3, // Low stock - below threshold
        reserved_quantity: 0,
        reorder_point: 10,
        max_stock: 100
      },
      {
        product_id: product1._id,
        warehouse_id: warehouse2._id,
        quantity: 15,
        reserved_quantity: 2,
        reorder_point: 10,
        max_stock: 100
      },
      {
        product_id: product2._id,
        warehouse_id: warehouse1._id,
        quantity: 8, // Low stock - below threshold
        reserved_quantity: 1,
        reorder_point: 10,
        max_stock: 80
      },
      {
        product_id: product3._id,
        warehouse_id: warehouse1._id,
        quantity: 20, // Low stock - below threshold
        reserved_quantity: 0,
        reorder_point: 25,
        max_stock: 200
      },
      {
        product_id: product4._id,
        warehouse_id: warehouse1._id,
        quantity: 30, // Low stock - below threshold
        reserved_quantity: 5,
        reorder_point: 50,
        max_stock: 500
      }
    ]);
    console.log('Created inventory');

    // Create Sales Activity (for recent sales calculation)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // iPhone sales - high volume
    for (let i = 0; i < 20; i++) {
      const saleDate = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
      await SalesActivity.create({
        product_id: product1._id,
        warehouse_id: warehouse1._id,
        quantity_sold: Math.floor(Math.random() * 3) + 1,
        sale_date: saleDate,
        revenue: (Math.floor(Math.random() * 3) + 1) * product1.price
      });
    }

    // Samsung sales - medium volume
    for (let i = 0; i < 15; i++) {
      const saleDate = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
      await SalesActivity.create({
        product_id: product2._id,
        warehouse_id: warehouse1._id,
        quantity_sold: Math.floor(Math.random() * 2) + 1,
        sale_date: saleDate,
        revenue: (Math.floor(Math.random() * 2) + 1) * product2.price
      });
    }

    // Nike sales - medium volume
    for (let i = 0; i < 12; i++) {
      const saleDate = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
      await SalesActivity.create({
        product_id: product3._id,
        warehouse_id: warehouse1._id,
        quantity_sold: Math.floor(Math.random() * 2) + 1,
        sale_date: saleDate,
        revenue: (Math.floor(Math.random() * 2) + 1) * product3.price
      });
    }

    // Banana sales - high volume
    for (let i = 0; i < 25; i++) {
      const saleDate = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
      await SalesActivity.create({
        product_id: product4._id,
        warehouse_id: warehouse1._id,
        quantity_sold: Math.floor(Math.random() * 5) + 1,
        sale_date: saleDate,
        revenue: (Math.floor(Math.random() * 5) + 1) * product4.price
      });
    }
    console.log('Created sales activity data');

    console.log('\n✅ Database populated successfully!');
    console.log(`Company ID: ${company._id}`);
    console.log('You can now test the low-stock alerts API with this company ID');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error populating data:', error);
    process.exit(1);
  }
}

// Run the population script
if (require.main === module) {
  populateData();
}

module.exports = { populateData };
