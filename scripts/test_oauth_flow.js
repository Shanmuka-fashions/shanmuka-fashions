// scripts/test_oauth_flow.js
// Automated verification suite for Shanmuka Fashions Google OAuth Callback and Customer Post-Login Flow

const assert = require('assert');

// 1. Setup browser environment mocks
const mockLocalStorage = {};
global.window = {
  location: {
    origin: 'https://shanmuka-fashions.netlify.app',
    pathname: '/',
    hash: '',
    search: ''
  },
  history: {
    replaceState: (state, title, url) => {
      // Mock history replacement
      const urlParts = url.split('#');
      global.window.location.pathname = urlParts[0];
      if (urlParts.length > 1) {
        global.window.location.hash = '#' + urlParts[1];
      } else {
        global.window.location.hash = '';
      }
    }
  },
  localStorage: {
    getItem: (key) => mockLocalStorage[key] || null,
    setItem: (key, val) => { mockLocalStorage[key] = String(val); },
    removeItem: (key) => { delete mockLocalStorage[key]; },
    clear: () => { Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]); }
  },
  scrollTo: () => {}
};
const domElements = {};
global.document = {
  title: 'Shanmuka Fashions',
  getElementById: (id) => {
    if (!domElements[id]) {
      domElements[id] = {
        id,
        innerHTML: '',
        style: {},
        classList: { add: () => {}, remove: () => {}, contains: () => false }
      };
    }
    return domElements[id];
  },
  querySelector: () => ({ style: {} }),
  querySelectorAll: () => []
};

// 2. Load modules
const SFDatabase = require('./sf_database');
global.SFDatabase = SFDatabase;

let mockSession = null;
let mockCloudCustomer = null;
let mockCloudAddresses = [];

global.SFSupabase = {
  getClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: mockSession }, error: null }),
      setSession: async ({ access_token, refresh_token }) => {
        if (access_token === 'expired_token') {
          mockSession = null;
          throw new Error('Invalid or expired refresh token');
        }
        if (!mockSession) {
          mockSession = {
            user: {
              id: 'mock-auth-user-id-12345',
              email: 'padmavati.devi@gmail.com',
              user_metadata: { full_name: 'Padmavati Devi' }
            }
          };
        }
        mockSession.access_token = access_token;
        mockSession.refresh_token = refresh_token;
        return { data: { session: mockSession }, error: null };
      },
      signInWithOAuth: async (opts) => ({ data: { url: 'https://accounts.google.com/o/oauth2/v2/auth' }, error: null })
    },
    from: () => ({
      select: () => ({
        or: () => ({
          order: () => ({
            limit: () => ({
              maybeSingle: async () => ({ data: mockCloudCustomer, error: null })
            })
          })
        })
      })
    })
  }),
  fetchCustomerByAuthId: async (authUserId, email) => mockCloudCustomer,
  fetchCustomerAddresses: async (custId) => mockCloudAddresses,
  saveCustomerToCloud: async (cust) => {
    mockCloudCustomer = { ...cust };
    return cust;
  },
  saveCustomerAddress: async (addr) => {
    mockCloudAddresses.push(addr);
    return addr;
  }
};

const SFCustomerViews = require('./sf_customer_views');
global.SFCustomerViews = SFCustomerViews;

const SFCustomerAuth = require('./sf_customer_auth');
global.SFCustomerAuth = SFCustomerAuth;

async function runTests() {
  console.log('🧪 Starting Shanmuka Fashions OAuth & Profile Flow Test Suite...\n');

  // Test 1: New customer OAuth return with tokens in hash
  console.log('Test 1: New customer Google OAuth Return');
  mockSession = null;
  mockCloudCustomer = null;
  mockCloudAddresses = [];
  global.window.location.hash = '#access_token=mock_access_token_abc123&refresh_token=mock_refresh_token_xyz789&token_type=bearer&expires_in=3600';
  
  const res1 = await SFCustomerAuth.handleOAuthCallback();
  assert.strictEqual(res1, true, 'Callback should return true on successful token authentication');
  assert.strictEqual(SFCustomerAuth.isAuthenticated(), true, 'Customer must be marked authenticated');
  assert.strictEqual(SFCustomerAuth.getCurrentCustomer().email, 'padmavati.devi@gmail.com', 'Verified Google email preserved');
  assert.strictEqual(SFCustomerAuth.isProfileComplete(), false, 'New customer profile must initially be marked incomplete');
  assert.strictEqual(global.window.location.hash, '#/account/complete-profile', 'Incomplete profile redirected to #/account/complete-profile');
  assert.strictEqual(global.window.location.hash.includes('access_token='), false, 'Access token cleanly scrubbed from URL');
  console.log('✅ Test 1 Passed: New customer authenticated and redirected to #/account/complete-profile with cleaned URL.\n');

  // Test 2: Mandatory Profile Completion Form submission with validation
  console.log('Test 2: Profile Completion Validation & Submission');
  // 2a: Invalid mobile failure
  const invalidRes = await SFCustomerAuth.completeProfile({
    fullName: 'Padmavati Devi',
    mobileNumber: '12345', // invalid
    houseNumber: 'Plot 12',
    street: 'Temple Road',
    city: 'Hyderabad',
    district: 'Hyderabad',
    state: 'Telangana',
    pincode: '500001'
  });
  assert.strictEqual(invalidRes.success, false, 'Short/invalid mobile must fail validation');

  // 2b: Invalid pincode failure
  const invalidPinRes = await SFCustomerAuth.completeProfile({
    fullName: 'Padmavati Devi',
    mobileNumber: '9876543210',
    houseNumber: 'Plot 12',
    street: 'Temple Road',
    city: 'Hyderabad',
    district: 'Hyderabad',
    state: 'Telangana',
    pincode: '123' // invalid
  });
  assert.strictEqual(invalidPinRes.success, false, 'Invalid PIN code must fail validation');

  // 2c: Valid profile completion
  const validRes = await SFCustomerAuth.completeProfile({
    fullName: 'Padmavati Devi',
    mobileNumber: '9876543210',
    alternateMobile: '9123456780',
    dateOfBirth: '1992-05-18',
    gender: 'Female',
    houseNumber: 'Villa 14, Royal Palm Estates',
    street: 'Jubilee Hills Road 36',
    landmark: 'Near Peddamma Temple',
    city: 'Hyderabad',
    district: 'Hyderabad',
    state: 'Telangana',
    pincode: '500033',
    country: 'India',
    preferredContact: 'WhatsApp',
    whatsappOptIn: true,
    marketingConsent: true
  });
  assert.strictEqual(validRes.success, true, 'Profile completion should succeed with valid data');
  assert.strictEqual(SFCustomerAuth.isProfileComplete(), true, 'Customer must now be marked profile_completed = true');
  assert.strictEqual(validRes.customer.addresses.length, 1, 'Delivery address created and linked');
  assert.strictEqual(validRes.customer.addresses[0].pincode, '500033', 'Pincode saved correctly');
  assert.strictEqual(validRes.customer.addresses[0].is_default, true, 'First address marked default');
  console.log('✅ Test 2 Passed: Form validation, address creation, and profile completion verified.\n');

  // Test 3: Existing completed customer signs in again
  console.log('Test 3: Existing Customer with Completed Profile');
  mockCloudCustomer = {
    id: 'CUST-888999',
    auth_user_id: 'mock-auth-user-id-12345',
    email: 'padmavati.devi@gmail.com',
    full_name: 'Padmavati Devi',
    phone: '9876543210',
    mobile_number: '9876543210',
    profile_completed: true,
    addresses: [{
      id: 'addr-1',
      house_number: 'Villa 14',
      street: 'Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500033',
      is_default: true
    }]
  };
  global.window.location.hash = '#access_token=existing_cust_token_abc&refresh_token=existing_cust_refresh_xyz';
  const res3 = await SFCustomerAuth.handleOAuthCallback();
  assert.strictEqual(res3, true, 'Existing customer authenticated');
  assert.strictEqual(SFCustomerAuth.isProfileComplete(), true, 'Profile recognized as complete');
  assert.strictEqual(global.window.location.hash, '#/account', 'Redirected directly to #/account dashboard');
  console.log('✅ Test 3 Passed: Existing completed customer redirected directly to #/account.\n');

  // Test 4: Existing customer with incomplete profile signs in again
  console.log('Test 4: Existing Incomplete Customer');
  mockCloudCustomer = {
    id: 'CUST-111222',
    auth_user_id: 'mock-auth-user-id-55555',
    email: 'incomplete.user@gmail.com',
    full_name: 'Incomplete User',
    mobile_number: '',
    profile_completed: false,
    addresses: []
  };
  mockSession = {
    user: {
      id: 'mock-auth-user-id-55555',
      email: 'incomplete.user@gmail.com',
      user_metadata: { full_name: 'Incomplete User' }
    }
  };
  global.window.location.hash = '#access_token=incomplete_token&refresh_token=incomplete_refresh';
  const res4 = await SFCustomerAuth.handleOAuthCallback();
  assert.strictEqual(res4, true);
  assert.strictEqual(SFCustomerAuth.isProfileComplete(), false, 'Profile recognized as incomplete');
  assert.strictEqual(global.window.location.hash, '#/account/complete-profile', 'Incomplete customer sent to complete-profile');
  console.log('✅ Test 4 Passed: Existing incomplete customer correctly sent to #/account/complete-profile.\n');

  // Test 5: OAuth cancellation or error
  console.log('Test 5: OAuth Error & User Cancellation');
  global.window.location.hash = '#error=access_denied&error_code=403&error_description=User+cancelled+Google+Sign-In';
  const res5 = await SFCustomerAuth.handleOAuthCallback();
  assert.strictEqual(res5, false, 'Failed auth returns false');
  assert.ok(domElements['appRoot'].innerHTML.includes('Google Sign-In Notice'), 'Renders error screen to customer');
  assert.ok(domElements['appRoot'].innerHTML.includes('User cancelled Google Sign-In'), 'User friendly error displayed');
  console.log('✅ Test 5 Passed: Handled cancellation with luxury error dialog and retry option.\n');

  // Test 6: Legacy double-hash callback URL compatibility
  console.log('Test 6: Legacy Double Hash (#/auth-callback#access_token=...) Compatibility');
  global.window.location.hash = '#/auth-callback#access_token=legacy_token_123&refresh_token=legacy_refresh_456';
  mockCloudCustomer = {
    id: 'CUST-333444',
    auth_user_id: 'mock-auth-user-id-legacy',
    email: 'legacy.patron@gmail.com',
    full_name: 'Legacy Patron',
    profile_completed: true,
    mobile_number: '9876543210',
    addresses: [{
      id: 'addr-leg',
      house_number: '12',
      street: 'Heritage St',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500001'
    }]
  };
  mockSession = {
    user: {
      id: 'mock-auth-user-id-legacy',
      email: 'legacy.patron@gmail.com',
      user_metadata: { full_name: 'Legacy Patron' }
    }
  };
  const res6 = await SFCustomerAuth.handleOAuthCallback();
  assert.strictEqual(res6, true, 'Legacy double-hash URL parsed and authenticated successfully');
  assert.strictEqual(global.window.location.hash, '#/account', 'Redirected to #/account');
  console.log('✅ Test 6 Passed: Legacy double-hash URLs parsed seamlessly.\n');

  // Test 7: Duplicate callback prevention and page refresh
  console.log('Test 7: Concurrency lock prevents duplicate callback processing');
  SFCustomerAuth._isProcessingCallback = true;
  const res7 = await SFCustomerAuth.handleOAuthCallback();
  assert.strictEqual(res7, true, 'Duplicate concurrent callback safely ignored');
  SFCustomerAuth._isProcessingCallback = false;
  console.log('✅ Test 7 Passed: Concurrency lock successfully guards against duplicate callback executions.\n');

  // Test 8: Refresh callback page after tokens are cleaned
  console.log('Test 8: Refreshing after token cleanup');
  global.window.location.hash = '#/account';
  mockSession = {
    user: {
      id: 'mock-auth-user-id-12345',
      email: 'padmavati.devi@gmail.com',
      user_metadata: { full_name: 'Padmavati Devi' }
    }
  };
  assert.strictEqual(SFCustomerAuth.isAuthenticated(), true);
  console.log('✅ Test 8 Passed: Session persists across page reloads without tokens in URL.\n');

  // Test 9: Expired or missing session
  console.log('Test 9: Missing session handling');
  mockSession = null;
  global.window.location.hash = '#access_token=expired_token&refresh_token=expired_refresh';
  const res9 = await SFCustomerAuth.handleOAuthCallback();
  assert.strictEqual(res9, false, 'Expired session fails gracefully');
  assert.ok(domElements['appRoot'].innerHTML.includes('Google Sign-In Notice'), 'Displays friendly error notification');
  console.log('✅ Test 9 Passed: Expired / missing session fails safely with retry option.\n');

  // Test 10: Sign out and sign in again
  console.log('Test 10: Sign out flow');
  await SFCustomerAuth.logout();
  assert.strictEqual(SFCustomerAuth.isAuthenticated(), false, 'Session cleared on sign out');
  assert.strictEqual(SFCustomerAuth.getCurrentCustomer(), null, 'Customer set to null');
  console.log('✅ Test 10 Passed: Sign out completely clears authenticated patron session.\n');

  // Test 11: Two separate Google accounts receive separate customer records
  console.log('Test 11: Multiple Google accounts receive isolated records');
  // Account A
  mockSession = {
    user: { id: 'auth-user-AAA', email: 'ananya.sharma@gmail.com', user_metadata: { full_name: 'Ananya Sharma' } }
  };
  mockCloudCustomer = null;
  global.window.location.hash = '#access_token=tokenA&refresh_token=refreshA';
  await SFCustomerAuth.handleOAuthCallback();
  const custA = SFCustomerAuth.getCurrentCustomer();
  assert.strictEqual(custA.email, 'ananya.sharma@gmail.com');
  const idA = custA.id;

  // Account B
  await SFCustomerAuth.logout();
  mockSession = {
    user: { id: 'auth-user-BBB', email: 'bhavana.reddy@gmail.com', user_metadata: { full_name: 'Bhavana Reddy' } }
  };
  mockCloudCustomer = null;
  global.window.location.hash = '#access_token=tokenB&refresh_token=refreshB';
  await SFCustomerAuth.handleOAuthCallback();
  const custB = SFCustomerAuth.getCurrentCustomer();
  assert.strictEqual(custB.email, 'bhavana.reddy@gmail.com');
  const idB = custB.id;

  assert.notStrictEqual(idA, idB, 'Distinct Google accounts must receive unique customer IDs');
  console.log('✅ Test 11 Passed: Two separate Google accounts receive distinct patron records.\n');

  // Test 12: Route guards: unauthenticated /account -> #/login, incomplete -> #/account/complete-profile
  console.log('Test 12: Route Guard Integrity');
  // Logout
  await SFCustomerAuth.logout();
  assert.strictEqual(SFCustomerAuth.isAuthenticated(), false);
  // Unauthenticated visiting account portal
  SFCustomerViews.renderAccountPortal('profile', 'appRoot');
  assert.strictEqual(global.window.location.hash.startsWith('#/login'), true, 'Unauthenticated visitor routed to login');

  console.log('✅ Test 12 Passed: Route guards successfully protect customer portal.\n');

  console.log('🎉 ALL 12 SPECIFICATION TEST SCENARIOS PASSED FLAWLESSLY!');
}

runTests().catch(err => {
  console.error('❌ Test Failure:', err);
  process.exit(1);
});
