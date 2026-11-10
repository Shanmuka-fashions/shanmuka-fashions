const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Read sf_database.js, sf_admin.js, and main script
const dbScript = fs.readFileSync('scripts/sf_database.js', 'utf8');
const adminScript = fs.readFileSync('scripts/sf_admin.js', 'utf8');

// Find the inline script in index.html (the one without src)
const inlineMatches = html.match(/<script(?![^>]*src=)[\s\S]*?>([\s\S]*?)<\/script>/i);
const scriptContent = inlineMatches ? inlineMatches[1] : '';

const dom = {};
const mockElement = (id) => ({
  id,
  innerHTML: '',
  innerText: '',
  style: {},
  classList: {
    add: () => {},
    remove: () => {},
    toggle: () => {},
    contains: () => false
  },
  value: '',
  setAttribute: () => {},
  getAttribute: () => '',
  appendChild: () => {},
  addEventListener: () => {},
  querySelectorAll: () => [],
  querySelector: () => mockElement('child'),
  scrollIntoView: () => {},
  play: () => Promise.resolve(),
  pause: () => {},
  focus: () => {},
  blur: () => {}
});

const elements = [
  'appRoot', 'searchDrawer', 'searchInput', 'searchResults',
  'cartDrawer', 'cartDrawerItems', 'cartSubtotal', 'cartCount',
  'wishlistDrawer', 'wishlistDrawerItems', 'wishlistCount',
  'quickViewModal', 'quickViewBody', 'toastContainer', 'mobileNav',
  'adminProdImg', 'heroVideo', 'checkoutModal', 'checkoutForm',
  'coName', 'coPhone', 'coEmail', 'coAddress', 'coCity', 'coPin', 'coPayment',
  'coOrderTotal', 'globalSearchInput', 'menuToggleBtn', 'mobileNavDrawer',
  'closeMobileNav', 'cartBtn', 'closeCartDrawer', 'cartDrawerBackdrop',
  'wishlistBtn', 'closeWishlistDrawer', 'wishlistDrawerBackdrop',
  'closeQuickView', 'closeCheckoutModal', 'accountBtn', 'closeAccountModal',
  'accountModal', 'checkoutWaBtn', 'checkoutStandardBtn', 'currentYear',
  'activeFilterPillsBar', 'displayedCount', 'totalCatalogueCount',
  'catalogueSortSelect', 'catalogueProductsGrid', 'filterSidebar',
  'breadcrumbCurrent', 'catalogueHeading', 'posBarcodeInput'
];

elements.forEach(id => {
  dom[id] = mockElement(id);
});

const sandbox = {
  window: {
    location: { hash: '#/' },
    addEventListener: () => {},
    scrollTo: () => {},
    innerWidth: 1440
  },
  document: {
    getElementById: (id) => dom[id] || mockElement(id),
    querySelector: (sel) => mockElement(sel),
    querySelectorAll: () => [],
    body: mockElement('body'),
    addEventListener: () => {},
    title: ''
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = v; },
    removeItem(k) { delete this._data[k]; }
  },
  sessionStorage: {
    _data: { sf_admin_session: 'ACTIVE', sf_admin_user: 'Bhanu (Owner)' },
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = v; },
    removeItem(k) { delete this._data[k]; }
  },
  URLSearchParams: global.URLSearchParams,
  console: console,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {}
};

sandbox.window.document = sandbox.document;
sandbox.window.sessionStorage = sandbox.sessionStorage;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.global = sandbox;

vm.createContext(sandbox);

try {
  // 1. Run Database Engine
  vm.runInContext(dbScript, sandbox);
  console.log('SFDatabase loaded in sandbox:', typeof sandbox.SFDatabase);

  // 2. Run Admin System
  vm.runInContext(adminScript, sandbox);
  console.log('SFAdmin loaded in sandbox:', typeof sandbox.SFAdmin);

  // 3. Run Storefront App
  vm.runInContext(scriptContent, sandbox);
  console.log('Storefront application initialized successfully!');

  // Test Storefront Views
  sandbox.renderHomeView();
  console.log('renderHomeView: OK, length =', dom.appRoot.innerHTML.length);

  sandbox.renderCatalogueView();
  console.log('renderCatalogueView: OK, length =', dom.appRoot.innerHTML.length);

  sandbox.renderPDPView(1);
  console.log('renderPDPView(1): OK, length =', dom.appRoot.innerHTML.length);

  sandbox.renderCollectionLandingView('kanchipuram');
  console.log('renderCollectionLandingView(kanchipuram): OK, length =', dom.appRoot.innerHTML.length);

  sandbox.renderStoryView();
  console.log('renderStoryView: OK, length =', dom.appRoot.innerHTML.length);

  sandbox.renderContactView();
  console.log('renderContactView: OK, length =', dom.appRoot.innerHTML.length);

  // Test Unified Admin Views
  sandbox.renderAdminView('dashboard');
  console.log('renderAdminView(dashboard): OK, length =', dom.appRoot.innerHTML.length);

  sandbox.renderAdminView('pos');
  console.log('renderAdminView(pos): OK, length =', dom.appRoot.innerHTML.length);

  sandbox.renderAdminView('products');
  console.log('renderAdminView(products): OK, length =', dom.appRoot.innerHTML.length);

  sandbox.renderAdminView('inventory');
  console.log('renderAdminView(inventory): OK, length =', dom.appRoot.innerHTML.length);

  sandbox.renderAdminView('orders');
  console.log('renderAdminView(orders): OK, length =', dom.appRoot.innerHTML.length);

  sandbox.renderAdminView('suppliers');
  console.log('renderAdminView(suppliers): OK, length =', dom.appRoot.innerHTML.length);

  sandbox.renderAdminView('reports');
  console.log('renderAdminView(reports): OK, length =', dom.appRoot.innerHTML.length);

  sandbox.renderAdminView('cms');
  console.log('renderAdminView(cms): OK, length =', dom.appRoot.innerHTML.length);

  console.log('\n🎉 ALL STOREFRONT AND ADMIN VIEW TESTS PASSED PERFECTLY!');
} catch (err) {
  console.error('Test view harness error:', err);
  process.exit(1);
}
