// scripts/test_shiprocket.js
// Verification suite for Shanmuka Fashions Shiprocket Logistics Integration

const assert = require('assert');

// 1. Mock LocalStorage and DOM
const mockStorage = {};
global.window = {
  localStorage: {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; }
  }
};
global.document = {
  getElementById: (id) => ({
    id,
    value: '',
    type: 'text',
    disabled: false,
    textContent: ''
  })
};

// 2. Load modules
const SFDatabase = require('./sf_database');
global.SFDatabase = SFDatabase;

const SFShiprocket = require('./sf_shiprocket');
global.SFShiprocket = SFShiprocket;

async function runShiprocketTests() {
  console.log('🧪 Starting Shiprocket Logistics Integration Test Suite...\n');

  // Test 1: Configuration & API Key verification
  console.log('Test 1: Configuration & API Key');
  const cfg = SFShiprocket.getConfig();
  assert.strictEqual(cfg.apiKey, '4Be!Q7$#QPz3%XM5czxHgbpo*ed0MnB4', 'API Key must match the user-provided key');
  assert.strictEqual(SFShiprocket.isConfigured(), true, 'Shiprocket must report as configured');
  assert.strictEqual(cfg.pickupPincode, '500033', 'Showroom pickup pincode matches Jubilee Hills');
  console.log('✅ Test 1 Passed: Shiprocket API Key properly wired and verified.\n');

  // Test 2: Pincode Serviceability Engine
  console.log('Test 2: Pincode Serviceability');
  const metroRes = SFShiprocket.checkServiceability('500034'); // Hyderabad Banjara Hills
  assert.strictEqual(metroRes.serviceable, true);
  assert.ok(metroRes.courier.includes('Blue Dart'));
  assert.strictEqual(metroRes.estimated_delivery, '1 - 2 Business Days');

  const invalidPinRes = SFShiprocket.checkServiceability('123');
  assert.strictEqual(invalidPinRes.serviceable, false);
  console.log('✅ Test 2 Passed: Postal PIN code serviceability checked successfully.\n');

  // Test 3: Tracking URL Generator
  console.log('Test 3: Official Tracking URL');
  const trackingUrl = SFShiprocket.getTrackingUrl('SRK918237462IN');
  assert.strictEqual(trackingUrl, 'https://shiprocket.co//tracking/SRK918237462IN');
  console.log('✅ Test 3 Passed: Real-time Shiprocket tracking URL generated.\n');

  // Test 4: Push Order to Shiprocket & Generate AWB
  console.log('Test 4: Order Dispatch & AWB Generation');
  const testOrder = {
    id: 'ORD-TEST-SRK-001',
    order_number: 'ORD-TEST-SRK-001',
    customer_name: 'Ananya Sharma',
    customer_phone: '9876543210',
    customer_email: 'ananya.sharma@gmail.com',
    delivery_address: {
      house_number: 'Flat 402',
      street: 'Jubilee Hills Road 10',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500033'
    },
    items: [
      { name: 'Kanchipuram Silk Saree', sku: 'SF-KAN-001', qty: 1, price: 24500 }
    ],
    total: 24500,
    payment_method: 'Prepaid',
    status: 'Confirmed'
  };

  // Save to DB first
  SFDatabase.state.orders = SFDatabase.state.orders || [];
  SFDatabase.state.orders.push(testOrder);

  const dispatchRes = await SFShiprocket.pushOrderToShiprocket(testOrder);
  assert.strictEqual(dispatchRes.success, true);
  assert.ok(dispatchRes.awb.startsWith('SRK'));
  assert.ok(dispatchRes.trackingUrl.includes(dispatchRes.awb));

  // Check updated order in SFDatabase
  const updatedOrder = SFDatabase.getOrder('ORD-TEST-SRK-001');
  assert.strictEqual(updatedOrder.status, 'Shipped');
  assert.strictEqual(updatedOrder.tracking_number, dispatchRes.awb);
  assert.ok(updatedOrder.courier.length > 0);
  assert.strictEqual(updatedOrder.shipping_status, 'Dispatched via Shiprocket');
  console.log(`✅ Test 4 Passed: Order dispatched! AWB: ${dispatchRes.awb}, Carrier: ${dispatchRes.courier}\n`);

  console.log('🎉 ALL SHIPROCKET LOGISTICS TESTS PASSED FLAWLESSLY!');
}

runShiprocketTests().catch(err => {
  console.error('❌ Test Failure:', err);
  process.exit(1);
});
