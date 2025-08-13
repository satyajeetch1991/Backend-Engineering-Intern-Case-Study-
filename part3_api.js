const express = require('express');
const mongoose = require('mongoose');
const { 
  Company, 
  Warehouse, 
  Product, 
  Inventory, 
  InventoryLog, 
  Supplier, 
  ProductSupplier, 
  SalesActivity 
} = require('./part2_db_schema');

const router = express.Router();

/**
 * GET /api/companies/{company_id}/alerts/low-stock
 * 
 * Business Rules:
 * 1. Low stock threshold varies by product type (electronics: 10, clothing: 25, food: 50, default: 20)
 * 2. Only alert for products with recent sales activity (last 30 days)
 * 3. Handle multiple warehouses per company
 * 4. Include supplier information for reordering
 * 5. Calculate days until stockout based on average daily sales
 * 
 * Edge Cases Handled:
 * - Products with no sales activity (excluded)
 * - Products with zero or negative stock
 * - Missing supplier information
 * - Invalid company/warehouse IDs
 * - Products in multiple warehouses
 * - Bundle products
 * - Expired or discontinued products
 */
router.get('/companies/:company_id/alerts/low-stock', async (req, res) => {
  try {
    const { company_id } = req.params;
    const { 
      limit = 100, 
      include_inactive = false,
      threshold_override = null 
    } = req.query;

    // Validate company_id format
    if (!mongoose.Types.ObjectId.isValid(company_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid company ID format',
        details: 'Company ID must be a valid MongoDB ObjectId'
      });
    }

    // Validate limit parameter
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter',
        details: 'Limit must be a number between 1 and 1000'
      });
    }

    // Step 1: Validate company exists and get company settings
    const company = await Company.findById(company_id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
        details: `No company found with ID: ${company_id}`
      });
    }

    // Step 2: Get all active warehouses for the company
    const warehouses = await Warehouse.find({
      company_id,
      is_active: true
    }).select('_id name location address');

    if (warehouses.length === 0) {
      return res.json({
        alerts: [],
        total_alerts: 0,
        message: 'No active warehouses found for this company'
      });
    }

    const warehouseIds = warehouses.map(w => w._id);

    // Step 3: Get company-specific low stock thresholds
    const thresholds = company.settings?.low_stock_thresholds || {
      electronics: 10,
      clothing: 25,
      food: 50,
      default: 20
    };

    // Step 4: Find products with recent sales activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSalesProducts = await SalesActivity.aggregate([
      {
        $match: {
          warehouse_id: { $in: warehouseIds },
          sale_date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            product_id: '$product_id',
            warehouse_id: '$warehouse_id'
          },
          total_quantity_sold: { $sum: '$quantity_sold' },
          last_sale_date: { $max: '$sale_date' }
        }
      },
      {
        $project: {
          product_id: '$_id.product_id',
          warehouse_id: '$_id.warehouse_id',
          total_quantity_sold: 1,
          last_sale_date: 1
        }
      }
    ]);

    if (recentSalesProducts.length === 0) {
      return res.json({
        alerts: [],
        total_alerts: 0,
        message: 'No products with recent sales activity found'
      });
    }

    // Step 5: Get current inventory for products with recent sales
    const productWarehousePairs = recentSalesProducts.map(p => ({
      product_id: p.product_id,
      warehouse_id: p.warehouse_id
    }));

    const inventoryData = await Inventory.find({
      $or: productWarehousePairs
    }).populate('product_id', 'name sku category status is_active')
      .populate('warehouse_id', 'name location address');

    // Step 6: Calculate average daily sales for stockout prediction
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailySalesData = await SalesActivity.aggregate([
      {
        $match: {
          warehouse_id: { $in: warehouseIds },
          sale_date: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            product_id: '$product_id',
            warehouse_id: '$warehouse_id'
          },
          total_quantity_sold: { $sum: '$quantity_sold' },
          days_with_sales: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$sale_date' } } }
        }
      },
      {
        $project: {
          product_id: '$_id.product_id',
          warehouse_id: '$_id.warehouse_id',
          total_quantity_sold: 1,
          avg_daily_sales: {
            $divide: [
              '$total_quantity_sold',
              { $size: '$days_with_sales' }
            ]
          }
        }
      }
    ]);

    // Create lookup map for daily sales
    const dailySalesMap = new Map();
    dailySalesData.forEach(item => {
      const key = `${item.product_id}_${item.warehouse_id}`;
      dailySalesMap.set(key, item.avg_daily_sales);
    });

    // Step 7: Get supplier information for reordering
    const productIds = [...new Set(recentSalesProducts.map(p => p.product_id))];
    const supplierData = await ProductSupplier.find({
      product_id: { $in: productIds },
      is_primary: true
    }).populate('supplier_id', 'name contact_email phone');

    // Create lookup map for suppliers
    const supplierMap = new Map();
    supplierData.forEach(item => {
      supplierMap.set(item.product_id.toString(), {
        id: item.supplier_id._id,
        name: item.supplier_id.name,
        contact_email: item.supplier_id.contact_email || 'N/A',
        contact_phone: item.supplier_id.phone || 'N/A'
      });
    });

    // Step 8: Process inventory and generate alerts
    const alerts = [];
    const processedProducts = new Set();

    for (const inventory of inventoryData) {
      // Skip if product is inactive or discontinued (unless explicitly requested)
      if (!include_inactive) {
        const isActive =
          (typeof inventory.product_id.is_active === 'boolean')
            ? inventory.product_id.is_active
            : (inventory.product_id.status === 'active');
        if (!isActive) {
          continue;
        }
      }

      // Skip bundle products for now (could be enhanced to check component availability)
      if (inventory.product_id.is_bundle) {
        continue;
      }

      const productKey = `${inventory.product_id._id}_${inventory.warehouse_id._id}`;
      
      // Skip if already processed (multiple sales records for same product-warehouse)
      if (processedProducts.has(productKey)) {
        continue;
      }

      processedProducts.add(productKey);

      // Determine threshold based on product category
      let threshold = thresholds.default;
      const category = inventory.product_id.category.toLowerCase();
      
      if (category.includes('electronic') || category.includes('tech')) {
        threshold = thresholds.electronics;
      } else if (category.includes('clothing') || category.includes('apparel') || category.includes('fashion')) {
        threshold = thresholds.clothing;
      } else if (category.includes('food') || category.includes('grocery') || category.includes('beverage')) {
        threshold = thresholds.food;
      }

      // Apply threshold override if provided
      if (threshold_override && !isNaN(parseInt(threshold_override))) {
        threshold = parseInt(threshold_override);
      }

      // Check if current stock is below threshold
      const availableStock = inventory.quantity - inventory.reserved_quantity;
      
      if (availableStock <= threshold) {
        // Calculate days until stockout
        const salesKey = `${inventory.product_id._id}_${inventory.warehouse_id._id}`;
        const avgDailySales = dailySalesMap.get(salesKey) || 0;
        
        let daysUntilStockout = null;
        if (avgDailySales > 0) {
          daysUntilStockout = Math.ceil(availableStock / avgDailySales);
        }

        // Get supplier information
        const supplier = supplierMap.get(inventory.product_id._id.toString()) || {
          id: null,
          name: 'No supplier assigned',
          contact_email: 'N/A',
          contact_phone: 'N/A'
        };

        // Create alert object
        const alert = {
          product_id: inventory.product_id._id.toString(),
          product_name: inventory.product_id.name,
          sku: inventory.product_id.sku,
          warehouse_id: inventory.warehouse_id._id.toString(),
          warehouse_name: inventory.warehouse_id.name,
          current_stock: availableStock,
          threshold: threshold,
          days_until_stockout: daysUntilStockout,
          supplier: {
            id: supplier.id?.toString() || null,
            name: supplier.name,
            contact_email: supplier.contact_email,
            contact_phone: supplier.contact_phone
          },
          // Additional useful information
          category: inventory.product_id.category,
          reserved_quantity: inventory.reserved_quantity,
          total_quantity: inventory.quantity,
          last_updated: inventory.last_updated,
                  warehouse_location: inventory.warehouse_id.location,
        warehouse_address: inventory.warehouse_id.address
        };

        alerts.push(alert);
      }
    }

    // Step 9: Sort alerts by priority (most critical first)
    alerts.sort((a, b) => {
      // First by days until stockout (null values last)
      if (a.days_until_stockout === null && b.days_until_stockout === null) return 0;
      if (a.days_until_stockout === null) return 1;
      if (b.days_until_stockout === null) return -1;
      
      // Then by current stock vs threshold ratio
      const ratioA = a.current_stock / a.threshold;
      const ratioB = b.current_stock / b.threshold;
      
      return ratioA - ratioB;
    });

    // Step 10: Apply limit and return response
    const limitedAlerts = alerts.slice(0, parsedLimit);

    res.json({
      alerts: limitedAlerts,
      total_alerts: alerts.length,
      limited_alerts: limitedAlerts.length,
      company_name: company.name,
      thresholds_used: thresholds,
      filters_applied: {
        company_id,
        limit: parsedLimit,
        include_inactive: include_inactive === 'true',
        threshold_override: threshold_override || 'none'
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating low stock alerts:', error);
    
    // Handle specific error types
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameter format',
        details: 'One or more parameters have invalid formats'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.message
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while processing the request'
    });
  }
});

/**
 * GET /api/companies/{company_id}/alerts/low-stock/summary
 * 
 * Provides a summary of low stock alerts by warehouse and category
 */
router.get('/companies/:company_id/alerts/low-stock/summary', async (req, res) => {
  try {
    const { company_id } = req.params;

    // Validate company_id format
    if (!mongoose.Types.ObjectId.isValid(company_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid company ID format'
      });
    }

    // Get company and basic alert data
    const company = await Company.findById(company_id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // Get warehouses
    const warehouses = await Warehouse.find({
      company_id,
      is_active: true
    });

    const warehouseIds = warehouses.map(w => w._id);

    // Get thresholds
    const thresholds = company.settings?.low_stock_thresholds || {
      electronics: 10,
      clothing: 25,
      food: 50,
      default: 20
    };

    // Get recent sales products
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSalesProducts = await SalesActivity.aggregate([
      {
        $match: {
          warehouse_id: { $in: warehouseIds },
          sale_date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            product_id: '$product_id',
            warehouse_id: '$warehouse_id'
          }
        }
      }
    ]);

    if (recentSalesProducts.length === 0) {
      return res.json({
        summary: {
          total_warehouses: warehouses.length,
          total_products_monitored: 0,
          low_stock_alerts: 0,
          critical_alerts: 0,
          by_warehouse: [],
          by_category: []
        }
      });
    }

    // Get inventory data
    const productWarehousePairs = recentSalesProducts.map(p => ({
      product_id: p._id.product_id,
      warehouse_id: p._id.warehouse_id
    }));

    const inventoryData = await Inventory.find({
      $or: productWarehousePairs
    }).populate('product_id', 'category')
      .populate('warehouse_id', 'name');

    // Process summary
    const summary = {
      total_warehouses: warehouses.length,
      total_products_monitored: recentSalesProducts.length,
      low_stock_alerts: 0,
      critical_alerts: 0,
      by_warehouse: [],
      by_category: []
    };

    // Count by warehouse
    const warehouseCounts = {};
    const categoryCounts = {};

    for (const inventory of inventoryData) {
      const category = inventory.product_id.category.toLowerCase();
      const warehouseName = inventory.warehouse_id.name;
      
      // Determine threshold
      let threshold = thresholds.default;
      if (category.includes('electronic') || category.includes('tech')) {
        threshold = thresholds.electronics;
      } else if (category.includes('clothing') || category.includes('apparel')) {
        threshold = thresholds.clothing;
      } else if (category.includes('food') || category.includes('grocery')) {
        threshold = thresholds.food;
      }

      const availableStock = inventory.quantity - inventory.reserved_quantity;
      
      if (availableStock <= threshold) {
        summary.low_stock_alerts++;
        
        // Critical if stock is 0 or below safety threshold
        if (availableStock === 0 || availableStock <= Math.ceil(threshold * 0.2)) {
          summary.critical_alerts++;
        }

        // Count by warehouse
        warehouseCounts[warehouseName] = (warehouseCounts[warehouseName] || 0) + 1;
        
        // Count by category
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    }

    // Format warehouse summary
    for (const [warehouseName, count] of Object.entries(warehouseCounts)) {
      summary.by_warehouse.push({
        warehouse_name: warehouseName,
        alert_count: count
      });
    }

    // Format category summary
    for (const [category, count] of Object.entries(categoryCounts)) {
      summary.by_category.push({
        category: category,
        alert_count: count
      });
    }

    // Sort by alert count
    summary.by_warehouse.sort((a, b) => b.alert_count - a.alert_count);
    summary.by_category.sort((a, b) => b.alert_count - a.alert_count);

    res.json({
      success: true,
      data: summary,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
    });
  }
});

module.exports = router;
