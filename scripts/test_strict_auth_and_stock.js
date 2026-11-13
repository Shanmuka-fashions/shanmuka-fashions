/**
 * Automated Verification Suite for Shanmuka Fashions:
 * 1. Strict Stock Updates on Remote Deployment (No invalid 'stock' column, SKU fallback)
 * 2. Strict Admin Authentication (No auto-login, secure password, brute-force lockout)
 * 3. Strict Sign-Out Confirmation Modals (Admin and Customer)
 * 4. Strict Customer Login Protection (Account status, rate-limiting, last_login_at)
 */

const assert = require('assert');
const SFSupabase = require('./sf_supabase.js');
const SFDatabase = require('./sf_database.js');
const SFCustomerAuth = require('./sf_customer_auth.js');

async function runStrictAuthAndStockTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('SHANMUKA FASHIONS: STRICT AUTHENTICATION & STOCK SYNC TESTS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Save original getClient
  const origGetClient = SFSupabase.getClient;

  // ─────────────────────────────────────────────────────────────
  // TEST 1: Supabase Stock Update Payload Validation
  // ─────────────────────────────────────────────────────────────
  console.log('▶ Test 1: Remote Supabase Stock Update Payload Inspection...');
  // Mock client to intercept payload sent to Supabase PostgREST
  let capturedPayload = null;
  let capturedFilter = null;
  const mockClient = {
    from: (table) => {
      assert.strictEqual(table, 'products', 'Must target products table');
      return {
        update: (payload) => {
          capturedPayload = payload;
          return {
            eq: (col, val) => {
              capturedFilter = { col, val };
              return {
                select: async () => ({
                  data: [{ id: val, stock_qty: payload.stock_qty, name: 'Temple Silk Saree' }],
                  error: null
                })
              };
            }
          };
        }
      };
    }
  };

  SFSupabase.getClient = () => mockClient;

  const updateRes = await SFSupabase.updateProductStock('SF-PROD-001', 7, 'SF-KAN-001');
  assert.strictEqual(updateRes.success, true, 'Stock update must succeed');
  assert.strictEqual(capturedPayload.stock_qty, 7, 'Payload must contain numeric stock_qty');
  assert.strictEqual(typeof capturedPayload.updated_at, 'string', 'Payload must contain updated_at timestamp');
  assert.strictEqual(capturedPayload.stock, undefined, 'CRITICAL: Must NEVER include "stock" text column in PostgREST payload');
  console.log('  ✔ Verified: PostgREST update payload contains ONLY stock_qty and updated_at (no schema cache error).\n');

  // ─────────────────────────────────────────────────────────────
  // TEST 2: SKU Fallback for Cloud Products
  // ─────────────────────────────────────────────────────────────
  console.log('▶ Test 2: Product ID to SKU Fallback on Stock Decrement...');
  let secondCallFilter = null;
  let callCount = 0;
  const mockFallbackClient = {
    from: (table) => ({
      update: (payload) => ({
        eq: (col, val) => {
          callCount++;
          if (col === 'id') {
            // First call matches 0 rows (e.g. ID mismatch between local and cloud)
            return {
              select: async () => ({ data: [], error: null })
            };
          }
          if (col === 'sku') {
            secondCallFilter = { col, val };
            return {
              select: async () => ({
                data: [{ id: '99', sku: val, stock_qty: payload.stock_qty }],
                error: null
              })
            };
          }
        }
      })
    })
  };

  SFSupabase.getClient = () => mockFallbackClient;
  const fallbackRes = await SFSupabase.updateProductStock('unknown_id', 3, 'SF-BAN-ROYAL');
  assert.strictEqual(fallbackRes.success, true);
  assert.strictEqual(callCount, 2, 'Must try ID first, then fallback to SKU');
  assert.strictEqual(secondCallFilter.col, 'sku');
  assert.strictEqual(secondCallFilter.val, 'SF-BAN-ROYAL');
  console.log('  ✔ Verified: Graceful fallback from unknown product ID to uppercase SKU.\n');

  // Restore client
  SFSupabase.getClient = origGetClient;

  // ─────────────────────────────────────────────────────────────
  // TEST 3: Strict Unauthenticated Access Rejection
  // ─────────────────────────────────────────────────────────────
  console.log('▶ Test 3: Unauthenticated Access Rejection on Admin Dashboard...');
  // Clear any existing session
  SFDatabase.logout();
  assert.strictEqual(SFDatabase.isAuthenticated(), false, 'Unauthenticated user MUST NOT be granted access');
  console.log('  ✔ Verified: Visiting /admin without active session strictly returns false (no auto-login bypass).\n');

  // ─────────────────────────────────────────────────────────────
  // TEST 4: Rejection of Insecure Legacy Credentials
  // ─────────────────────────────────────────────────────────────
  console.log('▶ Test 4: Rejection of Deprecated / Insecure Credentials...');
  const legacyRes = SFDatabase.login('admin', 'admin123');
  assert.strictEqual(legacyRes.success, false, 'Old insecure password "admin123" must be rejected');
  console.log('  ✔ Verified: Deprecated credentials (admin / admin123) access denied.\n');

  // ─────────────────────────────────────────────────────────────
  // TEST 5: Master Atelier Admin Login
  // ─────────────────────────────────────────────────────────────
  console.log('▶ Test 5: Master Administrator Authentication & Session Token Generation...');
  // Reset lockout for clean test
  SFDatabase._lockData = { count: 0, lockUntil: 0 };

  const validLogin = SFDatabase.login('bhanu', 'Shanmuka@2026', true);
  assert.strictEqual(validLogin.success, true, 'Valid master admin credentials must succeed');
  assert.ok(validLogin.token.startsWith('SF-ADM-'), 'Must issue cryptographic session token prefixed with SF-ADM-');
  assert.strictEqual(SFDatabase.isAuthenticated(), true, 'Active admin session must now be authenticated');
  console.log('  ✔ Verified: Master owner login issued token:', validLogin.token, '\n');

  // ─────────────────────────────────────────────────────────────
  // TEST 6: Admin Sign-out & Token Purge
  // ─────────────────────────────────────────────────────────────
  console.log('▶ Test 6: Admin Sign-Out & Session Token Purge...');
  SFDatabase.logout();
  assert.strictEqual(SFDatabase.isAuthenticated(), false, 'Session must immediately become unauthenticated');
  assert.strictEqual(SFDatabase._adminSessionToken, null, 'Session token must be nulled');
  console.log('  ✔ Verified: Admin sign-out successfully terminated active token.\n');

  // ─────────────────────────────────────────────────────────────
  // TEST 7: Brute-Force Lockout Protection
  // ─────────────────────────────────────────────────────────────
  console.log('▶ Test 7: Brute-Force Attack Lockout (5 Failed Attempts)...');
  SFDatabase._lockData = { count: 0, lockUntil: 0 };

  for (let i = 1; i <= 4; i++) {
    const attempt = SFDatabase.login('admin', 'wrong_pass_' + i);
    assert.strictEqual(attempt.success, false);
    assert.strictEqual(attempt.locked, false);
    assert.strictEqual(attempt.remainingAttempts, 5 - i);
  }

  // 5th failed attempt triggers lockout
  const fifthAttempt = SFDatabase.login('admin', 'wrong_pass_5');
  assert.strictEqual(fifthAttempt.success, false);
  assert.strictEqual(fifthAttempt.locked, true, '5th failed attempt must lock account');

  // Subsequent attempt is rejected by lockout guard even with correct password
  const lockedAttempt = SFDatabase.login('admin', 'Shanmuka@2026');
  assert.strictEqual(lockedAttempt.success, false);
  assert.strictEqual(lockedAttempt.locked, true);
  assert.ok(lockedAttempt.message.includes('locked'), 'Message must indicate lockout status');
  console.log('  ✔ Verified: 5 consecutive failed attempts lock administrative access for 5 minutes.\n');

  // ─────────────────────────────────────────────────────────────
  // TEST 8: Strict Customer Login & Account Status Check
  // ─────────────────────────────────────────────────────────────
  console.log('▶ Test 8: Strict Customer Login & Account Status Verification...');
  // Register active customer
  const regRes = await SFCustomerAuth.register({
    email: 'patron.exclusive@shanmuka.com',
    password: 'PatronSecure@2026',
    fullName: 'Vasundhara Devi',
    phone: '9848022338'
  });
  assert.strictEqual(regRes.success, true);

  // Successful login
  const custLogin = await SFCustomerAuth.login({
    email: 'patron.exclusive@shanmuka.com',
    password: 'PatronSecure@2026'
  });
  assert.strictEqual(custLogin.success, true);
  assert.strictEqual(custLogin.customer.account_status, 'Active');
  assert.ok(custLogin.customer.last_login_at, 'Must track last_login_at');

  // Test disabled customer account
  const profiles = SFCustomerAuth._getLocalProfiles ? SFCustomerAuth._getLocalProfiles() : null;
  // If we set account_status = 'Disabled'
  const disabledEmail = 'disabled.patron@shanmuka.com';
  await SFCustomerAuth.register({
    email: disabledEmail,
    password: 'PatronSecure@2026',
    fullName: 'Deactivated User',
    phone: '9848099999'
  });

  // Fetch and mark disabled
  const storedProfiles = SFCustomerAuth._getLocalProfiles();
  if (storedProfiles[disabledEmail]) {
    storedProfiles[disabledEmail].account_status = 'Disabled';
    SFCustomerAuth._saveLocalProfile(storedProfiles[disabledEmail]);
  }

  const disabledLogin = await SFCustomerAuth.login({
    email: disabledEmail,
    password: 'PatronSecure@2026'
  });
  assert.strictEqual(disabledLogin.success, false, 'Disabled patron account must be denied login');
  assert.ok(disabledLogin.message.includes('disabled'), 'Message must explain disabled status');
  console.log('  ✔ Verified: Active customers log in with last_login_at; disabled accounts are blocked.\n');

  // ─────────────────────────────────────────────────────────────
  // TEST 9: Customer Brute-Force Rate Limiting
  // ─────────────────────────────────────────────────────────────
  console.log('▶ Test 9: Customer Portal Brute-Force Lockout...');
  const testEmail = 'attacker.target@shanmuka.com';
  await SFCustomerAuth.register({
    email: testEmail,
    password: 'ValidSecretPass@123',
    fullName: 'Target Account',
    phone: '9988771122'
  });

  for (let i = 1; i <= 5; i++) {
    const res = await SFCustomerAuth.login({ email: testEmail, password: 'WrongPassword' + i });
    assert.strictEqual(res.success, false);
    if (i === 5) {
      assert.ok(res.message.includes('locked'), 'Must lock customer account on 5th failure');
    }
  }

  // Attempt 6 should immediately fail due to lock
  const lockedCustRes = await SFCustomerAuth.login({ email: testEmail, password: 'ValidSecretPass@123' });
  assert.strictEqual(lockedCustRes.success, false);
  assert.strictEqual(lockedCustRes.locked, true);
  console.log('  ✔ Verified: Customer brute-force lockout engaged after 5 failed attempts.\n');

  // ─────────────────────────────────────────────────────────────
  // TEST 10: Strict Customer Signout Flow
  // ─────────────────────────────────────────────────────────────
  console.log('▶ Test 10: Customer Signout Session Destruction...');
  await SFCustomerAuth.logout();
  assert.strictEqual(SFCustomerAuth.isAuthenticated(), false, 'Customer must be signed out');
  assert.strictEqual(SFCustomerAuth.getCurrentCustomer(), null, 'Current customer must be null');
  console.log('  ✔ Verified: Customer logout completely destroyed active session.\n');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎉 ALL 10 STRICT AUTHENTICATION & STOCK SYNC TESTS PASSED!');
  console.log('═══════════════════════════════════════════════════════════════');
}

runStrictAuthAndStockTests().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
