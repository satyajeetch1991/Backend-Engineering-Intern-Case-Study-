const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const COMPANY_ID = '507f1f77bcf86cd799439010'; // Example company ID

// Test data for demonstration
const testData = {
  company: {
    name: 'TechFashion Retail Corp',
    legal_name: 'TechFashion Retail Corporation',
    tax_id: 'TAX123456789',
    address: {
      street: '123 Tech Street',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      postal_code: '94105'
    },
    contact: {
      email: 'info@techfashion.com',
      phone: '+1-555-0123',
      website: 'https://techfashion.com'
    },
    settings: {
      low_stock_thresholds: {
        electronics: 10,
        clothing: 25,
        food: 50,
        default: 20
      },
      alert_frequency: 'daily'
    }
  },
  warehouse: {
    name: 'Main Distribution Center',
    code: 'SFO-DC-01',
    type: 'primary',
    address: {
      street: '456 Warehouse Blvd',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      postal_code: '94105'
    },
    contact: {
      manager: 'John Warehouse',
      email: 'warehouse@techfashion.com',
      phone: '+1-555-0456'
    },
    capacity: {
      total_space: 10000,
      total_pallets: 5000
    }
  },
  product: {
    name: 'iPhone 15 Pro Max',
    sku: 'IPH-15-PRO-MAX-256',
    description: 'Latest iPhone with 256GB storage',
    price: 1199.99,
    category: 'Electronics',
    brand: 'Apple',
    weight: 0.221,
    dimensions: {
      length: 15.9,
      width: 7.7,
      height: 0.8,
      unit: 'cm'
    }
  },
  supplier: {
    name: 'Apple Inc.',
    code: 'APPLE001',
    company_name: 'Apple Inc.',
    tax_id: 'APPLE123456',
    address: {
      street: '1 Apple Park Way',
      city: 'Cupertino',
      state: 'CA',
      country: 'USA',
      postal_code: '95014'
    },
    contact: {
      primary: {
        name: 'Procurement Team',
        email: 'procurement@apple.com',
        phone: '+1-800-275-2273',
        title: 'Procurement Manager'
      }
    },
    categories: ['Electronics', 'Mobile Devices']
  }
};

/**
 * Test Suite for Bynry Backend Case Study API
 */
class APITester {
  constructor() {
    this.testResults = [];
    this.currentTest = '';
  }

  async runTests() {
    console.log('🚀 Starting Bynry Backend Case Study API Tests');
    console.log('='.repeat(60));

    try {
      // Test 1: Health Check
      await this.testHealthCheck();

      // Test 2: Root Endpoint
      await this.testRootEndpoint();

      // Test 3: Low Stock Alerts (Empty Response)
      await this.testLowStockAlertsEmpty();

      // Test 4: Low Stock Alerts Summary
      await this.testLowStockSummary();

      // Test 5: Error Handling
      await this.testErrorHandling();

      // Test 6: Rate Limiting
      await this.testRateLimiting();

      console.log('\n' + '='.repeat(60));
      console.log('📊 Test Results Summary');
      console.log('='.repeat(60));
      
      const passed = this.testResults.filter(r => r.status === 'PASS').length;
      const failed = this.testResults.filter(r => r.status === 'FAIL').length;
      
      console.log(`✅ Passed: ${passed}`);
      console.log(`❌ Failed: ${failed}`);
      console.log(`📈 Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);

      if (failed > 0) {
        console.log('\n❌ Failed Tests:');
        this.testResults.filter(r => r.status === 'FAIL').forEach(test => {
          console.log(`  - ${test.name}: ${test.error}`);
        });
      }

    } catch (error) {
      console.error('💥 Test suite failed:', error.message);
    }
  }

  async testHealthCheck() {
    this.currentTest = 'Health Check';
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      
      if (response.status === 200 && response.data.success) {
        this.recordResult('PASS', 'Health check endpoint working correctly');
        console.log('✅ Health Check: PASS');
      } else {
        this.recordResult('FAIL', 'Health check response format incorrect');
        console.log('❌ Health Check: FAIL');
      }
    } catch (error) {
      this.recordResult('FAIL', `Health check failed: ${error.message}`);
      console.log('❌ Health Check: FAIL');
    }
  }

  async testRootEndpoint() {
    this.currentTest = 'Root Endpoint';
    try {
      const response = await axios.get(`${BASE_URL}/`);
      
      if (response.status === 200 && response.data.success) {
        this.recordResult('PASS', 'Root endpoint working correctly');
        console.log('✅ Root Endpoint: PASS');
      } else {
        this.recordResult('FAIL', 'Root endpoint response format incorrect');
        console.log('❌ Root Endpoint: FAIL');
      }
    } catch (error) {
      this.recordResult('FAIL', `Root endpoint failed: ${error.message}`);
      console.log('❌ Root Endpoint: FAIL');
    }
  }

  async testLowStockAlertsEmpty() {
    this.currentTest = 'Low Stock Alerts (Empty)';
    try {
      const response = await axios.get(`${BASE_URL}/api/companies/${COMPANY_ID}/alerts/low-stock`);
      
      if (response.status === 200) {
        const data = response.data;
        if (data.alerts && Array.isArray(data.alerts) && data.total_alerts === 0) {
          this.recordResult('PASS', 'Low stock alerts endpoint working correctly (empty response)');
          console.log('✅ Low Stock Alerts (Empty): PASS');
        } else {
          this.recordResult('FAIL', 'Low stock alerts response format incorrect');
          console.log('❌ Low Stock Alerts (Empty): FAIL');
        }
      } else {
        this.recordResult('FAIL', `Low stock alerts returned status ${response.status}`);
        console.log('❌ Low Stock Alerts (Empty): FAIL');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Expected for non-existent company
        this.recordResult('PASS', 'Low stock alerts correctly returns 404 for non-existent company');
        console.log('✅ Low Stock Alerts (Empty): PASS');
      } else {
        this.recordResult('FAIL', `Low stock alerts failed: ${error.message}`);
        console.log('❌ Low Stock Alerts (Empty): FAIL');
      }
    }
  }

  async testLowStockSummary() {
    this.currentTest = 'Low Stock Summary';
    try {
      const response = await axios.get(`${BASE_URL}/api/companies/${COMPANY_ID}/alerts/low-stock/summary`);
      
      if (response.status === 200) {
        const data = response.data;
        if (data.success && data.data && typeof data.data.total_warehouses === 'number') {
          this.recordResult('PASS', 'Low stock summary endpoint working correctly');
          console.log('✅ Low Stock Summary: PASS');
        } else {
          this.recordResult('FAIL', 'Low stock summary response format incorrect');
          console.log('❌ Low Stock Summary: FAIL');
        }
      } else {
        this.recordResult('FAIL', `Low stock summary returned status ${response.status}`);
        console.log('❌ Low Stock Summary: FAIL');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Expected for non-existent company
        this.recordResult('PASS', 'Low stock summary correctly returns 404 for non-existent company');
        console.log('✅ Low Stock Summary: PASS');
      } else {
        this.recordResult('FAIL', `Low stock summary failed: ${error.message}`);
        console.log('❌ Low Stock Summary: FAIL');
      }
    }
  }

  async testErrorHandling() {
    this.currentTest = 'Error Handling';
    try {
      // Test invalid company ID format
      const response = await axios.get(`${BASE_URL}/api/companies/invalid-id/alerts/low-stock`);
      
      if (response.status === 400) {
        this.recordResult('PASS', 'Error handling working correctly for invalid company ID');
        console.log('✅ Error Handling: PASS');
      } else {
        this.recordResult('FAIL', 'Error handling not working for invalid company ID');
        console.log('❌ Error Handling: FAIL');
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        this.recordResult('PASS', 'Error handling working correctly for invalid company ID');
        console.log('✅ Error Handling: PASS');
      } else {
        this.recordResult('FAIL', `Error handling test failed: ${error.message}`);
        console.log('❌ Error Handling: FAIL');
      }
    }
  }

  async testRateLimiting() {
    this.currentTest = 'Rate Limiting';
    try {
      // Make multiple requests quickly to trigger rate limiting
      const promises = [];
      for (let i = 0; i < 105; i++) {
        promises.push(axios.get(`${BASE_URL}/health`));
      }
      
      const responses = await Promise.allSettled(promises);
      const rateLimited = responses.filter(r => 
        r.status === 'rejected' && 
        r.reason.response && 
        r.reason.response.status === 429
      );
      
      if (rateLimited.length > 0) {
        this.recordResult('PASS', 'Rate limiting working correctly');
        console.log('✅ Rate Limiting: PASS');
      } else {
        this.recordResult('FAIL', 'Rate limiting not working');
        console.log('❌ Rate Limiting: FAIL');
      }
    } catch (error) {
      this.recordResult('FAIL', `Rate limiting test failed: ${error.message}`);
      console.log('❌ Rate Limiting: FAIL');
    }
  }

  recordResult(status, message) {
    this.testResults.push({
      name: this.currentTest,
      status,
      message,
      error: status === 'FAIL' ? message : null
    });
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new APITester();
  tester.runTests().catch(console.error);
}

module.exports = APITester;


