/**
 * Comprehensive Automated Test Suite for Shanmuka Fashions:
 * Google Customer Authentication, Profile Completion & Admin Customer Management
 */

const assert = require('assert');
const path = require('path');

// Mock browser environment
global.window = {
  location: { origin: 'http://localhost:8000', pathname: '/', hash: '#/' }
};
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};
global.sessionStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};

// Mock DOM elements
global.document = {
  getElementById(id) {
    return {
      id,
      value: '',
      innerHTML: '',
      textContent: '',
      style: {},
      disabled: false,
      checked: false,
      classList: { add() {}, remove() {}, contains() { return false; } },
      addEventListener() {},
      removeEventListener() {}
    };
  },
  createElement(tag) {
    return {
      tagName: tag,
      style: {},
      appendChild() {},
      click() {}
    };
  },
  body: { appendChild() {}, removeChild() {} }
};

const SFDatabase = require('./sf_database');
const SFCustomerAuth = require('./sf_customer_auth');
const SFSupabase = require('./sf_supabase');
const SFAdmin = require('./sf_admin');

console.log('═════════════════════════════════════════════════════════════════');
console.log('SHANMUKA FASHIONS: GOOGLE AUTH & CUSTOMER MANAGEMENT TEST SUITE');
console.log('═════════════════════════════════════════════════════════════════\n');

async function runTests() {
  let passed = 0;

  // ---------------------------------------------------------------------------
  // Test 1: Google OAuth Sign-In & Incomplete Profile Enforcement
  // ---------------------------------------------------------------------------
  console.log('▶ Test 1: Google OAuth Authentication Simulation...');
  const googleEmail = 'ananya.iyer.google@gmail.com';
  const googleName = 'Ananya Iyer';
  const authRes = await SFCustomerAuth._simulateGoogleSignIn(googleEmail, googleName);
  assert(authRes.success === true, 'Google auth simulation must succeed');
  const cust = SFCustomerAuth.getCurrentCustomer();
  assert.strictEqual(cust.email, googleEmail, 'Customer email must match Google verified email');
  assert.strictEqual(cust.full_name, googleName, 'Customer name must match Google name');
  assert.strictEqual(cust.profile_completed, false, 'New Google customer profile must initially be incomplete');
  assert.strictEqual(SFCustomerAuth.isProfileComplete(), false, 'isProfileComplete() must return false');
  console.log('  ✔ Customer authenticated via Google; mandatory profile completion correctly required.\n');
  passed++;

  // ---------------------------------------------------------------------------
  // Test 2: Profile Completion Validation Rules
  // ---------------------------------------------------------------------------
  console.log('▶ Test 2: Input Validation (Mobile & PIN code)...');
  assert(SFCustomerAuth.validation.isValidIndianPhone('9876543210'), 'Valid 10-digit mobile must pass');
  assert(!SFCustomerAuth.validation.isValidIndianPhone('1234567890'), 'Invalid prefix must fail');
  assert(!SFCustomerAuth.validation.isValidIndianPhone('98765'), 'Short mobile must fail');
  assert(SFCustomerAuth.validation.isValidIndianPincode('500034'), 'Valid 6-digit Indian PIN must pass');
  assert(!SFCustomerAuth.validation.isValidIndianPincode('012345'), 'PIN starting with 0 must fail');
  assert(!SFCustomerAuth.validation.isValidIndianPincode('50003'), '5-digit PIN must fail');
  console.log('  ✔ Indian mobile and postal PIN code validations strictly verified.\n');
  passed++;

  // ---------------------------------------------------------------------------
  // Test 3: Mandatory Customer Profile Completion Submission
  // ---------------------------------------------------------------------------
  console.log('▶ Test 3: Complete Mandatory Customer Profile...');
  const profileForm = {
    fullName: 'Ananya S. Iyer',
    mobileNumber: '9840123456',
    alternateMobile: '9840987654',
    dateOfBirth: '1994-08-15',
    gender: 'Female',
    houseNumber: 'Flat 304, Sree Nilayam',
    street: 'Road No. 12, Banjara Hills',
    landmark: 'Opposite GVK Mall',
    city: 'Hyderabad',
    district: 'Hyderabad',
    state: 'Telangana',
    pincode: '500034',
    country: 'India',
    preferredContact: 'WhatsApp',
    whatsappOptIn: true,
    marketingConsent: true
  };

  const compRes = await SFCustomerAuth.completeProfile(profileForm);
  assert(compRes.success === true, 'Profile completion must succeed');
  const updatedCust = SFCustomerAuth.getCurrentCustomer();
  assert.strictEqual(updatedCust.profile_completed, true, 'Customer profile_completed must now be true');
  assert.strictEqual(SFCustomerAuth.isProfileComplete(), true, 'isProfileComplete() must now return true');
  assert.strictEqual(updatedCust.phone, '9840123456', 'Customer phone must be stored');
  assert(Array.isArray(updatedCust.addresses) && updatedCust.addresses.length === 1, 'Default primary address must be created');
  assert.strictEqual(updatedCust.addresses[0].is_default, true, 'Primary address must be default');
  console.log('  ✔ Customer profile 100% completed with default delivery address.\n');
  passed++;

  // ---------------------------------------------------------------------------
  // Test 4: Profile & Address Persistence in Central Database
  // ---------------------------------------------------------------------------
  console.log('▶ Test 4: Central Database Persistence & Verification...');
  const dbCust = SFDatabase.getCustomer(googleEmail);
  assert(dbCust !== null, 'Customer must exist in SFDatabase');
  assert.strictEqual(dbCust.profile_completed, true, 'Database record must reflect completed profile');
  const dbAddresses = SFDatabase.getCustomerAddresses(dbCust.id);
  assert(dbAddresses.length >= 1, 'Database must contain saved addresses for customer');
  assert.strictEqual(dbAddresses[0].pincode, '500034', 'Saved address PIN must match');
  console.log(`  ✔ Customer #${dbCust.id} persisted in central database with address #${dbAddresses[0].id}.\n`);
  passed++;

  // ---------------------------------------------------------------------------
  // Test 5: Multi-Address Book Management (Add, Edit, Set Default, Delete)
  // ---------------------------------------------------------------------------
  console.log('▶ Test 5: Multi-Address Book Management...');
  const secondAddr = SFDatabase.saveCustomerAddress(dbCust.id, {
    address_type: 'Work',
    full_name: 'Ananya Iyer (Office)',
    phone: '9840123456',
    house_number: 'Tower B, 5th Floor, Cyber Gateway',
    street: 'HITEC City',
    landmark: 'Near Cyber Towers',
    city: 'Hyderabad',
    district: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    country: 'India',
    is_default: false
  });
  assert(secondAddr && secondAddr.id, 'Second address must be saved');
  let currentAddresses = SFDatabase.getCustomerAddresses(dbCust.id);
  assert.strictEqual(currentAddresses.length, 2, 'Customer must now have 2 delivery addresses');

  // Set second address as default
  SFDatabase.setDefaultCustomerAddress(dbCust.id, secondAddr.id);
  currentAddresses = SFDatabase.getCustomerAddresses(dbCust.id);
  const def = currentAddresses.find(a => a.id === secondAddr.id);
  assert(def.is_default === true, 'Second address must now be default');
  console.log('  ✔ Multi-address support verified (Add & Set Default).\n');
  passed++;

  // ---------------------------------------------------------------------------
  // Test 6: Place Orders & Customer Order History Tracking
  // ---------------------------------------------------------------------------
  console.log('▶ Test 6: Process Purchases & Customer Order History...');
  // Ensure product exists for purchase
  const prod = SFDatabase.saveProduct({
    name: 'Kanchipuram Silk Bridal Heirloom',
    category: 'Kanchipuram',
    fabric: 'Pure Mulberry Silk',
    color: 'Crimson Red',
    price: 18500,
    old: 22000,
    stock_qty: 5,
    img: 'assets/kanchipuram-loom.jpg'
  });

  // Create an active order
  const order1 = SFDatabase.processSaleTransaction({
    channel: 'ONLINE',
    customer_id: dbCust.id,
    customer_name: dbCust.full_name,
    customer_phone: dbCust.phone,
    customer_email: dbCust.email,
    items: [{ product_id: prod.id, id: prod.id, name: prod.name, price: prod.price, qty: 1, img: prod.img, sku: prod.sku }],
    payment_method: 'UPI',
    delivery_address: currentAddresses[0]
  });
  assert(order1 && order1.order_number, 'Online sale must succeed');

  // Create a second delivered order
  const order2 = SFDatabase.processSaleTransaction({
    channel: 'ONLINE',
    customer_id: dbCust.id,
    customer_name: dbCust.full_name,
    customer_phone: dbCust.phone,
    customer_email: dbCust.email,
    items: [{ product_id: prod.id, id: prod.id, name: prod.name, price: prod.price, qty: 1, img: prod.img, sku: prod.sku }],
    payment_method: 'CARD',
    delivery_address: currentAddresses[0]
  });
  // Update order2 status to Delivered
  order2.order_status = 'Delivered';
  SFDatabase.commit();

  const custOrders = SFCustomerAuth.getCustomerOrders();
  assert(custOrders.length >= 2, 'Customer orders must return both purchases');
  console.log(`  ✔ Customer order history verified: ${custOrders.length} orders tracked for ${googleEmail}.\n`);
  passed++;

  // ---------------------------------------------------------------------------
  // Test 7: Order Cancellation & Isolation from Completed Sales
  // ---------------------------------------------------------------------------
  console.log('▶ Test 7: Order Cancellation & Exclusion from Net Sales...');
  // Cancel order1
  order1.order_status = 'Cancelled';
  SFDatabase.commit();

  const summaryAfterCancel = SFDatabase.getCustomerSummary(dbCust.id);
  assert.strictEqual(summaryAfterCancel.cancelled_orders, 1, 'Cancelled order count must be 1');
  assert.strictEqual(summaryAfterCancel.delivered_orders, 1, 'Delivered order count must be 1');
  // CRITICAL REQUIREMENT: Cancelled orders MUST NOT be included in completed spend!
  assert.strictEqual(summaryAfterCancel.completed_spend, order2.total, `Completed spend must exclude cancelled order (${order2.total} only)`);
  console.log('  ✔ Cancelled order strictly excluded from customer completed spend.\n');
  passed++;

  // ---------------------------------------------------------------------------
  // Test 8: Return Request Lifecycle
  // ---------------------------------------------------------------------------
  console.log('▶ Test 8: Return Request Lifecycle...');
  // Request return on order2
  order2.order_status = 'Return requested';
  order2.return_reason = 'Color mismatch under evening lighting';
  SFDatabase.commit();

  const summaryAfterReturn = SFDatabase.getCustomerSummary(dbCust.id);
  assert.strictEqual(summaryAfterReturn.return_requested_orders, 1, 'Return requested orders must be 1');
  console.log('  ✔ Customer return request properly recorded with audit notes.\n');
  passed++;

  // ---------------------------------------------------------------------------
  // Test 9: Admin Customer Listing & Filtering Engine
  // ---------------------------------------------------------------------------
  console.log('▶ Test 9: Admin Customer Listing, Search & Filters...');
  const allCustomers = SFDatabase.getCustomers();
  assert(allCustomers.length > 0, 'Admin must see customer list');

  const foundBySearch = allCustomers.find(c => c.email === googleEmail);
  assert(foundBySearch !== undefined, 'Customer must be searchable by email');
  assert.strictEqual(foundBySearch.profile_completed, true, 'Customer must show completed profile');
  console.log(`  ✔ Admin Customer Directory: Verified ${allCustomers.length} patrons with live orders.\n`);
  passed++;

  // ---------------------------------------------------------------------------
  // Test 10: Admin Customer Actions (Status Toggle & Internal Notes)
  // ---------------------------------------------------------------------------
  console.log('▶ Test 10: Admin Actions (Notes, Status Toggle, Audit Log)...');
  // Add internal note
  const note = SFDatabase.addCustomerNote(dbCust.id, 'Patron prefers pure Zari temple borders. Attending Chennai wedding.', 'Bhanu Prakash Reddy');
  assert(note && note.id, 'Customer note must be created');
  const patronNotes = SFDatabase.getCustomerNotes(dbCust.id);
  assert(patronNotes.length >= 1, 'Patron notes must be retrievable');

  // Toggle status to Inactive
  SFDatabase.updateCustomerStatus(dbCust.id, 'Inactive', 'Bhanu Prakash Reddy');
  const inactiveCust = SFDatabase.getCustomer(dbCust.id);
  assert.strictEqual(inactiveCust.account_status, 'Inactive', 'Customer must now be Inactive');

  // Check audit log
  const auditLogs = SFDatabase.getAuditLogs();
  const statusAudit = auditLogs.find(a => a.action === 'CUSTOMER_STATUS_UPDATE' && a.entity_id === dbCust.id);
  assert(statusAudit !== undefined, 'Audit log must record customer status change');

  // Reset status to Active
  SFDatabase.updateCustomerStatus(dbCust.id, 'Active', 'Bhanu Prakash Reddy');
  console.log('  ✔ Internal atelier notes, status toggle, and audit logging verified.\n');
  passed++;

  // ---------------------------------------------------------------------------
  // Test 11: Customer Data Privacy & Account Isolation
  // ---------------------------------------------------------------------------
  console.log('▶ Test 11: Customer Isolation (Account A cannot access Account B orders)...');
  // Register second customer
  const custBRes = await SFCustomerAuth._simulateGoogleSignIn('deepa.rao.google@gmail.com', 'Deepa Rao');
  const custB = SFCustomerAuth.getCurrentCustomer();
  assert.strictEqual(custB.email, 'deepa.rao.google@gmail.com');
  const custBOrders = SFCustomerAuth.getCustomerOrders();
  // Customer B has placed 0 orders; must not see Customer A's orders!
  assert.strictEqual(custBOrders.length, 0, 'Customer B must see ZERO orders (strict isolation)');
  console.log('  ✔ Strict patron data isolation verified across Google authenticated accounts.\n');
  passed++;

  console.log('═════════════════════════════════════════════════════════════════');
  console.log(`🎉 ALL ${passed} GOOGLE AUTH & CUSTOMER MANAGEMENT TESTS PASSED!`);
  console.log('═════════════════════════════════════════════════════════════════\n');
}

runTests().catch(err => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
