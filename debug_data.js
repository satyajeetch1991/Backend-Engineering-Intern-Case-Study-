const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Company = require('./models/Company');
const Warehouse = require('./models/Warehouse');
const Product = require('./models/Product');
const Inventory = require('./models/Inventory');
const SalesActivity = require('./models/SalesActivity');

async function debugData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bynry_case_study');
    console.log('Connected to MongoDB');

    // Check company
    const company = await Company.findOne();
    console.log('\n📊 COMPANY:');
    console.log(company ? `Found: ${company.name} (ID: ${company._id})` : 'No company found');

    // Check warehouses
    const warehouses = await Warehouse.find();
    console.log('\n🏭 WAREHOUSES:');
    console.log(`Total: ${warehouses.length}`);
    warehouses.forEach(w => {
      console.log(`- ${w.name} (ID: ${w._id}) - Company: ${w.company_id} - Active: ${w.is_active}`);
    });

    // Check products
    const products = await Product.find();
    console.log('\n📦 PRODUCTS:');
    console.log(`Total: ${products.length}`);
    products.forEach(p => {
      console.log(`- ${p.name} (SKU: ${p.sku}) - Category: ${p.category} - Active: ${p.is_active}`);
    });

    // Check inventory
    const inventory = await Inventory.find();
    console.log('\n📋 INVENTORY:');
    console.log(`Total: ${inventory.length}`);
    inventory.forEach(inv => {
      console.log(`- Product: ${inv.product_id} - Warehouse: ${inv.warehouse_id} - Qty: ${inv.quantity} - Reserved: ${inv.reserved_quantity}`);
    });

    // Check sales activity
    const salesActivity = await SalesActivity.find();
    console.log('\n💰 SALES ACTIVITY:');
    console.log(`Total: ${salesActivity.length}`);
    
    if (salesActivity.length > 0) {
      // Show first few sales records
      const recentSales = salesActivity.slice(0, 5);
      recentSales.forEach(sale => {
        console.log(`- Product: ${sale.product_id} - Warehouse: ${sale.warehouse_id} - Qty: ${sale.quantity_sold} - Date: ${sale.sale_date}`);
      });
      
      // Check date range
      const dates = salesActivity.map(s => s.sale_date).sort();
      console.log(`\n📅 Date Range: ${dates[0]} to ${dates[dates.length - 1]}`);
      
      // Check if any sales are within last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentSalesCount = salesActivity.filter(s => s.sale_date >= thirtyDaysAgo).length;
      console.log(`📊 Sales in last 30 days: ${recentSalesCount}`);
    }

    // Check if there are any ObjectId mismatches
    console.log('\n🔍 CHECKING OBJECT ID RELATIONSHIPS:');
    
    if (warehouses.length > 0 && company) {
      const companyWarehouses = warehouses.filter(w => w.company_id.toString() === company._id.toString());
      console.log(`Warehouses belonging to company: ${companyWarehouses.length}`);
    }

    if (inventory.length > 0 && products.length > 0) {
      const productIds = products.map(p => p._id.toString());
      const inventoryProductIds = inventory.map(inv => inv.product_id.toString());
      const validProductIds = inventoryProductIds.filter(id => productIds.includes(id));
      console.log(`Valid product IDs in inventory: ${validProductIds.length}/${inventoryProductIds.length}`);
    }

    if (inventory.length > 0 && warehouses.length > 0) {
      const warehouseIds = warehouses.map(w => w._id.toString());
      const inventoryWarehouseIds = inventory.map(inv => inv.warehouse_id.toString());
      const validWarehouseIds = inventoryWarehouseIds.filter(id => warehouseIds.includes(id));
      console.log(`Valid warehouse IDs in inventory: ${validWarehouseIds.length}/${inventoryWarehouseIds.length}`);
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');

  } catch (error) {
    console.error('Error debugging data:', error);
    process.exit(1);
  }
}

// Run the debug script
if (require.main === module) {
  debugData();
}

module.exports = { debugData };


