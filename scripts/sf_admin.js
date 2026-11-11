/**
 * Shanmuka Fashions — Unified Administration & Retail Management System
 * Powers POS billing, inventory ledger, catalog, orders, CMS, and analytics.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SFAdmin = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  let activeTab = 'dashboard';
  let posCart = [];
  let posCustomer = { name: 'Walk-in Customer', phone: '', city: 'Hyderabad' };
  let posDiscount = 0;
  let posPaymentMethod = 'CASH';
  let posCashTendered = 0;
  let selectedReportFilter = 'all';

  // ── BARCODE & THERMAL PRINTING STATE ──
  const selectedProductIds = new Set();
  let activeDesignerTarget = null;
  let activeDesignerConfig = {
    width: 50,
    height: 30,
    gap: 3,
    includeBranding: true,
    includePrice: true,
    includeMRP: true,
    includeSKU: true,
    includeCategory: true,
    barcodeHeight: 28,
    fontSize: 'normal',
    zoom: 1.5,
    qtyMode: 'one',
    customQty: 1,
    isReprint: false,
    reason: 'Inventory Tagging'
  };
  let lastPOSScanInfo = null;

  function formatMoney(amount) {
    return '₹' + (amount || 0).toLocaleString('en-IN');
  }

  function formatDate(isoStr) {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return String(isoStr);
    }
  }

  // ── RENDER ROOT ADMIN APPLICATION ──
  function render(containerId = 'appRoot', initialTab = null) {
    if (initialTab) activeTab = initialTab;
    const container = typeof document !== 'undefined' ? document.getElementById(containerId) : null;
    if (!container) return;

    // Check Authentication
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : (typeof require !== 'undefined' ? require('./sf_database') : null);
    if (!db) {
      container.innerHTML = '<div style="padding: 40px; text-align: center;">Error loading central database engine.</div>';
      return;
    }

    // Auto-update admin portal whenever central database changes
    if (db && !db._adminSubscribed && typeof db.subscribe === 'function') {
      db._adminSubscribed = true;
      db.subscribe(() => {
        const hash = (typeof window !== 'undefined' && window.location.hash) || '';
        if (hash.startsWith('#/admin')) {
          render(containerId);
        }
      });
    }

    if (!db.isAuthenticated()) {
      container.innerHTML = renderLoginScreen();
      attachLoginEvents();
      return;
    }

    const settings = db.getSettings();
    const reports = db.getFinancialReports(selectedReportFilter);
    const lowStockCount = db.getProducts().filter(p => (p.stock_qty || 0) <= (p.low_stock_threshold || 2)).length;

    container.innerHTML = `
      <div class="sf-admin-wrapper">
        <!-- Top Executive Management Header -->
        <header class="sf-admin-topbar">
          <div class="sf-topbar-left">
            <a href="#/admin" class="sf-topbar-brand">
              <img src="logo.png" alt="Shanmuka Logo" class="sf-topbar-logo">
              <div>
                <span class="sf-topbar-title">SHANMUKA FASHIONS</span>
                <span class="sf-topbar-subtitle">Retail Management & Atelier ERP</span>
              </div>
            </a>
          </div>

          <div class="sf-topbar-center">
            <span class="sf-register-status">
              <span class="status-pulse-dot"></span> Flagship Boutique Register: <b>Jubilee Hills, Hyderabad</b>
            </span>
          </div>

          <div class="sf-topbar-right">
            <a href="#/" class="sf-btn-storefront" title="Open Storefront in New Tab" target="_blank">View Live Boutique ↗</a>
            <div class="sf-user-badge">
              <span class="sf-user-avatar">BP</span>
              <span class="sf-user-name">Bhanu (Owner)</span>
            </div>
            <button class="sf-btn-logout" onclick="SFAdmin.handleLogout()" title="Sign Out">Sign Out</button>
          </div>
        </header>

        <!-- Navigation Tabs Bar -->
        <nav class="sf-admin-nav">
          <div class="sf-nav-scroll">
            <button class="sf-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}" onclick="SFAdmin.switchTab('dashboard')">
              <span class="nav-icon">📊</span> Dashboard
            </button>
            <button class="sf-nav-btn pos-highlight ${activeTab === 'pos' ? 'active' : ''}" onclick="SFAdmin.switchTab('pos')">
              <span class="nav-icon">🧾</span> POS Billing
            </button>
            <button class="sf-nav-btn ${activeTab === 'products' ? 'active' : ''}" onclick="SFAdmin.switchTab('products')">
              <span class="nav-icon">🥻</span> Products (${db.getProducts().length})
            </button>
            <button class="sf-nav-btn ${activeTab === 'inventory' ? 'active' : ''}" onclick="SFAdmin.switchTab('inventory')">
              <span class="nav-icon">📦</span> Inventory Ledger ${lowStockCount > 0 ? `<span class="nav-pill-alert">${lowStockCount}</span>` : ''}
            </button>
            <button class="sf-nav-btn ${activeTab === 'orders' ? 'active' : ''}" onclick="SFAdmin.switchTab('orders')">
              <span class="nav-icon">🛍️</span> Orders (${db.getOrders().length})
            </button>
            <button class="sf-nav-btn ${activeTab === 'customers' ? 'active' : ''}" onclick="SFAdmin.switchTab('customers')">
              <span class="nav-icon">👥</span> Customers (${db.getCustomers().length})
            </button>
            <button class="sf-nav-btn ${activeTab === 'suppliers' ? 'active' : ''}" onclick="SFAdmin.switchTab('suppliers')">
              <span class="nav-icon">🧵</span> Suppliers (${db.getSuppliers().length})
            </button>
            <button class="sf-nav-btn ${activeTab === 'expenses' ? 'active' : ''}" onclick="SFAdmin.switchTab('expenses')">
              <span class="nav-icon">💸</span> Expenses (${db.getExpenses().length})
            </button>
            <button class="sf-nav-btn ${activeTab === 'reports' ? 'active' : ''}" onclick="SFAdmin.switchTab('reports')">
              <span class="nav-icon">📈</span> Reports
            </button>
            <button class="sf-nav-btn ${activeTab === 'coupons' ? 'active' : ''}" onclick="SFAdmin.switchTab('coupons')">
              <span class="nav-icon">🏷️</span> Coupons
            </button>
            <button class="sf-nav-btn ${activeTab === 'cms' ? 'active' : ''}" onclick="SFAdmin.switchTab('cms')">
              <span class="nav-icon">🌐</span> CMS
            </button>
            <button class="sf-nav-btn ${activeTab === 'enquiries' ? 'active' : ''}" onclick="SFAdmin.switchTab('enquiries')">
              <span class="nav-icon">💬</span> Enquiries
            </button>
            <button class="sf-nav-btn ${activeTab === 'settings' ? 'active' : ''}" onclick="SFAdmin.switchTab('settings')">
              <span class="nav-icon">⚙️</span> Settings
            </button>
          </div>
        </nav>

        <!-- Main Workspace Area -->
        <main class="sf-admin-main" id="sfAdminContent">
          ${renderTabContent(activeTab, db)}
        </main>

        <!-- Global Modals Container -->
        <div id="sfModalContainer"></div>
      </div>
    `;

    attachTabEvents(activeTab, db);
  }

  // ── LOGIN SCREEN ──
  function renderLoginScreen() {
    return `
      <div class="sf-login-page">
        <div class="sf-login-card">
          <div class="sf-login-header">
            <img src="logo.png" alt="Shanmuka Logo" class="sf-login-logo">
            <h2>Shanmuka Atelier Portal</h2>
            <p>Unified Administration, Physical POS & Inventory Management</p>
          </div>

          <form id="sfLoginForm" onsubmit="event.preventDefault(); SFAdmin.handleLogin();">
            <div class="sf-form-group">
              <label>Administrator Username</label>
              <input type="text" id="sfAdminUser" value="admin" required autocomplete="username" placeholder="Enter username">
            </div>

            <div class="sf-form-group">
              <label>Master Password</label>
              <input type="password" id="sfAdminPass" value="admin123" required autocomplete="current-password" placeholder="Enter password">
            </div>

            <div id="sfLoginError" class="sf-form-error" style="display: none;"></div>

            <button type="submit" class="sf-btn-login">ACCESS ATELIER MANAGEMENT &rarr;</button>

            <div class="sf-login-hint">
              <small>Demo Master Credentials Pre-filled: <b>admin</b> / <b>admin123</b></small>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function attachLoginEvents() {
    // Form already has onsubmit
  }

  function handleLogin() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const u = document.getElementById('sfAdminUser').value;
    const p = document.getElementById('sfAdminPass').value;
    const res = db.login(u, p);
    if (res.success) {
      render();
    } else {
      const err = document.getElementById('sfLoginError');
      if (err) {
        err.textContent = res.message;
        err.style.display = 'block';
      }
    }
  }

  function handleLogout() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    db.logout();
    render();
  }

  function switchTab(tab) {
    activeTab = tab;
    render();
  }

  // ── TAB CONTENT DISPATCHER ──
  function renderTabContent(tab, db) {
    switch (tab) {
      case 'dashboard': return renderDashboardTab(db);
      case 'pos': return renderPOSTab(db);
      case 'products': return renderProductsTab(db);
      case 'inventory': return renderInventoryTab(db);
      case 'orders': return renderOrdersTab(db);
      case 'customers': return renderCustomersTab(db);
      case 'suppliers': return renderSuppliersTab(db);
      case 'expenses': return renderExpensesTab(db);
      case 'reports': return renderReportsTab(db);
      case 'coupons': return renderCouponsTab(db);
      case 'cms': return renderCMSTab(db);
      case 'enquiries': return renderEnquiriesTab(db);
      case 'settings': return renderSettingsTab(db);
      default: return renderDashboardTab(db);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. EXECUTIVE DASHBOARD TAB
  // ═══════════════════════════════════════════════════════════════════════════
  function renderDashboardTab(db) {
    const reports = db.getFinancialReports(selectedReportFilter);
    const products = db.getProducts();
    const orders = db.getOrders();
    const lowStock = products.filter(p => (p.stock_qty || 0) <= (p.low_stock_threshold || 2));
    const outOfStock = products.filter(p => (p.stock_qty || 0) === 0);

    return `
      <div class="sf-view-container">
        <!-- View Header with Date Filter -->
        <div class="sf-view-header">
          <div>
            <h1>Executive Retail Dashboard</h1>
            <p>Unified real-time metrics across online store and physical Jubilee Hills showroom.</p>
          </div>
          <div class="sf-filter-group">
            <span class="sf-filter-label">Period:</span>
            <select class="sf-select-period" onchange="SFAdmin.handleReportFilterChange(this.value)">
              <option value="all" ${selectedReportFilter === 'all' ? 'selected' : ''}>All Time</option>
              <option value="month" ${selectedReportFilter === 'month' ? 'selected' : ''}>This Month (Nov 2026)</option>
              <option value="week" ${selectedReportFilter === 'week' ? 'selected' : ''}>Past 7 Days</option>
              <option value="today" ${selectedReportFilter === 'today' ? 'selected' : ''}>Today</option>
            </select>
          </div>
        </div>

        <!-- KPI Cards Grid -->
        <div class="sf-kpis-grid">
          <div class="sf-kpi-card" onclick="SFAdmin.switchTab('reports')">
            <div class="kpi-icon-wrap" style="background: rgba(167, 121, 80, 0.15); color: var(--antique-bronze);">💰</div>
            <div class="kpi-value">${formatMoney(reports.totalRevenue)}</div>
            <div class="kpi-label">Total Realized Revenue</div>
            <div class="kpi-micro">Online: ${formatMoney(reports.onlineRevenue)} • POS: ${formatMoney(reports.posRevenue)}</div>
          </div>

          <div class="sf-kpi-card" onclick="SFAdmin.switchTab('orders')">
            <div class="kpi-icon-wrap" style="background: rgba(59, 43, 37, 0.1); color: var(--espresso-brown);">📦</div>
            <div class="kpi-value">${reports.totalOrders}</div>
            <div class="kpi-label">Total Orders Placed</div>
            <div class="kpi-micro">${reports.onlineOrdersCount} Online Drapes • ${reports.posOrdersCount} Showroom Bills</div>
          </div>

          <div class="sf-kpi-card" onclick="SFAdmin.switchTab('inventory')">
            <div class="kpi-icon-wrap" style="background: ${lowStock.length > 0 ? 'rgba(198, 40, 40, 0.15)' : 'rgba(46, 125, 50, 0.15)'}; color: ${lowStock.length > 0 ? '#C62828' : '#2E7D32'};">⚠️</div>
            <div class="kpi-value">${lowStock.length}</div>
            <div class="kpi-label">Low Stock Alerts (≤2)</div>
            <div class="kpi-micro">${outOfStock.length} Out of stock • ${reports.inventoryUnits} Total units in store</div>
          </div>

          <div class="sf-kpi-card" onclick="SFAdmin.switchTab('reports')">
            <div class="kpi-icon-wrap" style="background: rgba(46, 125, 50, 0.15); color: #2E7D32;">📊</div>
            <div class="kpi-value">${reports.grossMarginPercent}%</div>
            <div class="kpi-label">Gross Profit Margin</div>
            <div class="kpi-micro">Gross: ${formatMoney(reports.grossProfit)} • COGS: ${formatMoney(reports.totalCogs)}</div>
          </div>
        </div>

        <!-- Split Grid: Sales Channels & Inventory Asset Valuation -->
        <div class="sf-grid-2col" style="margin-bottom: 28px;">
          <!-- Sales Channel Velocity -->
          <div class="sf-card">
            <div class="sf-card-header">
              <h3>Sales Channel Distribution</h3>
              <span class="sf-card-badge">Central Synced</span>
            </div>
            <div class="channel-distribution-bars">
              <div class="channel-bar-item">
                <div class="channel-meta">
                  <span>Showroom POS Sales</span>
                  <b>${formatMoney(reports.posRevenue)} (${reports.totalRevenue > 0 ? Math.round((reports.posRevenue / reports.totalRevenue) * 100) : 0}%)</b>
                </div>
                <div class="progress-track">
                  <div class="progress-fill pos-fill" style="width: ${reports.totalRevenue > 0 ? Math.round((reports.posRevenue / reports.totalRevenue) * 100) : 0}%;"></div>
                </div>
              </div>

              <div class="channel-bar-item">
                <div class="channel-meta">
                  <span>Online Storefront Sales</span>
                  <b>${formatMoney(reports.onlineRevenue)} (${reports.totalRevenue > 0 ? Math.round((reports.onlineRevenue / reports.totalRevenue) * 100) : 0}%)</b>
                </div>
                <div class="progress-track">
                  <div class="progress-fill online-fill" style="width: ${reports.totalRevenue > 0 ? Math.round((reports.onlineRevenue / reports.totalRevenue) * 100) : 0}%;"></div>
                </div>
              </div>
            </div>

            <div class="channel-stats-row">
              <div class="sub-stat">
                <small>Average Order Value</small>
                <b>${formatMoney(reports.totalOrders > 0 ? Math.round(reports.totalRevenue / reports.totalOrders) : 0)}</b>
              </div>
              <div class="sub-stat">
                <small>GST Collected (5%)</small>
                <b>${formatMoney(reports.totalTaxCollected)}</b>
              </div>
              <div class="sub-stat">
                <small>Operating Expenses</small>
                <b>${formatMoney(reports.totalOperatingExpenses)}</b>
              </div>
            </div>
          </div>

          <!-- Inventory Asset Valuation -->
          <div class="sf-card">
            <div class="sf-card-header">
              <h3>Central Inventory Valuation</h3>
              <button class="sf-link-btn" onclick="SFAdmin.switchTab('inventory')">View Ledger &rarr;</button>
            </div>
            <div class="inventory-valuation-grid">
              <div class="val-box">
                <span class="val-num">${reports.inventoryUnits}</span>
                <span class="val-label">Handloom Drapes in Stock</span>
              </div>
              <div class="val-box">
                <span class="val-num">${formatMoney(reports.inventoryCostValuation)}</span>
                <span class="val-label">Inventory at Purchase Cost</span>
              </div>
              <div class="val-box highlight">
                <span class="val-num">${formatMoney(reports.inventoryRetailValuation)}</span>
                <span class="val-label">Potential Retail Value</span>
              </div>
            </div>
            <div class="inventory-note">
              <span>Silk Mark certified handlooms sourced directly from Kanchipuram, Varanasi, Dharmavaram & Chanderi master weavers.</span>
            </div>
          </div>
        </div>

        <!-- Recent Orders & Fast Actions -->
        <div class="sf-card">
          <div class="sf-card-header">
            <h3>Recent Sales (Online & Physical Shop)</h3>
            <button class="sf-btn-action" onclick="SFAdmin.switchTab('pos')">+ New POS Sale</button>
          </div>
          <div class="sf-table-responsive">
            <table class="sf-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Channel</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Drapes</th>
                  <th>Total</th>
                  <th>Payment Mode</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${!orders.length ? `
                  <tr>
                    <td colspan="8" style="text-align: center; padding: 36px 16px; color: var(--secondary-text);">
                      <div style="font-size: 24px; margin-bottom: 6px;">🛍️</div>
                      No sales transactions recorded yet. New showroom POS sales and online customer orders will appear here immediately.
                    </td>
                  </tr>
                ` : orders.slice(0, 6).map(o => `
                  <tr>
                    <td><b>${o.order_number}</b></td>
                    <td>
                      <span class="sf-badge ${o.channel === 'POS' ? 'badge-pos' : 'badge-online'}">
                        ${o.channel === 'POS' ? '🛍️ Shop POS' : '🌐 Online'}
                      </span>
                    </td>
                    <td>${formatDate(o.created_at)}</td>
                    <td>
                      <strong>${o.customer_name}</strong>
                      <small style="display:block; color: var(--secondary-text);">${o.customer_phone || ''}</small>
                    </td>
                    <td>${(o.items || []).map(i => `${i.qty}x ${i.name}`).join(', ')}</td>
                    <td><b>${formatMoney(o.total)}</b></td>
                    <td><span class="sf-badge badge-payment">${o.payment_method}</span></td>
                    <td><span class="sf-badge badge-status-${o.order_status.toLowerCase()}">${o.order_status}</span></td>
                    <td>
                      <button class="sf-btn-sm" onclick="SFAdmin.openOrderModal('${o.id}')">Details / Invoice</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function handleReportFilterChange(val) {
    selectedReportFilter = val;
    render();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. PHYSICAL SHOP POS BILLING TAB
  // ═══════════════════════════════════════════════════════════════════════════
  function renderPOSTab(db) {
    const products = db.getProducts().filter(p => p.status !== 'Archived');
    const customers = db.getCustomers();

    // Calculate Cart Totals
    let subtotal = 0;
    for (const item of posCart) {
      subtotal += item.price * item.qty;
    }
    const discountVal = parseInt(posDiscount || 0, 10);
    const taxable = Math.max(0, subtotal - discountVal);
    const taxRate = 5;
    const taxAmount = Math.round(taxable * (taxRate / 100));
    const netTotal = taxable + taxAmount;
    const changeDue = Math.max(0, (parseInt(posCashTendered || 0, 10) || 0) - netTotal);

    return `
      <div class="sf-pos-layout">
        <!-- Left Panel: Fast Product Search & Visual Catalog -->
        <div class="sf-pos-catalog-panel">
          <div class="pos-search-bar-wrap">
            <div class="pos-search-input-group">
              <span class="barcode-icon">📷</span>
              <input type="text" id="posBarcodeInput" placeholder="Scan Barcode or Type SKU / Saree Name [ENTER to Add]..." onkeydown="SFAdmin.handlePOSBarcodeKeyDown(event)" autofocus>
            </div>
          </div>

          <div class="pos-category-pills">
            <button class="pos-cat-pill active" onclick="SFAdmin.filterPOSCategory('ALL', this)">All Weaves</button>
            <button class="pos-cat-pill" onclick="SFAdmin.filterPOSCategory('Kanchipuram', this)">Kanchipuram</button>
            <button class="pos-cat-pill" onclick="SFAdmin.filterPOSCategory('Banarasi', this)">Banarasi</button>
            <button class="pos-cat-pill" onclick="SFAdmin.filterPOSCategory('Organza', this)">Organza</button>
            <button class="pos-cat-pill" onclick="SFAdmin.filterPOSCategory('Silk', this)">Festive Silk</button>
            <button class="pos-cat-pill" onclick="SFAdmin.filterPOSCategory('Cotton', this)">Cotton Handloom</button>
            <button class="pos-cat-pill" onclick="SFAdmin.filterPOSCategory('Designer', this)">Designer</button>
          </div>

          <div id="posScanFeedbackWrap"></div>
          <div class="pos-products-grid" id="posProductsGrid">
            ${renderPOSProductsGrid(products)}
          </div>
        </div>

        <!-- Right Panel: Billing Cart & Checkout -->
        <div class="sf-pos-billing-panel">
          <div class="pos-panel-header">
            <h3>Showroom Bill</h3>
            <button class="sf-link-btn" onclick="SFAdmin.clearPOSCart()">Clear All</button>
          </div>

          <!-- Customer Selection Row -->
          <div class="pos-customer-selector">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label>Patron Information:</label>
              <button class="sf-link-btn" onclick="SFAdmin.openAddCustomerModal(true)">+ New Patron</button>
            </div>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="posCustName" placeholder="Patron Name" value="${posCustomer.name}" oninput="SFAdmin.updatePOSCustomer('name', this.value)" style="flex: 1;">
              <input type="tel" id="posCustPhone" placeholder="Mobile / WhatsApp" value="${posCustomer.phone}" oninput="SFAdmin.updatePOSCustomer('phone', this.value)" style="width: 140px;">
            </div>
          </div>

          <!-- Itemized Cart Table -->
          <div class="pos-cart-items-wrap">
            ${posCart.length === 0 ? `
              <div class="pos-cart-empty">
                <div style="font-size: 32px; margin-bottom: 8px;">🛍️</div>
                <b>Register Ticket is Empty</b>
                <p>Click any saree from catalogue or scan barcode to add to current bill.</p>
              </div>
            ` : `
              <table class="pos-cart-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style="width: 70px;">Rate</th>
                    <th style="width: 80px; text-align: center;">Qty</th>
                    <th style="width: 70px; text-align: right;">Total</th>
                    <th style="width: 25px;"></th>
                  </tr>
                </thead>
                <tbody>
                  ${posCart.map((item, idx) => `
                    <tr>
                      <td>
                        <strong>${item.name}</strong>
                        <small style="display: block; color: var(--secondary-text);">${item.sku}</small>
                      </td>
                      <td>${formatMoney(item.price)}</td>
                      <td>
                        <div class="pos-qty-control">
                          <button onclick="SFAdmin.changePOSQty(${idx}, -1)">−</button>
                          <span>${item.qty}</span>
                          <button onclick="SFAdmin.changePOSQty(${idx}, 1)">+</button>
                        </div>
                      </td>
                      <td style="text-align: right;"><b>${formatMoney(item.price * item.qty)}</b></td>
                      <td>
                        <button class="pos-remove-btn" onclick="SFAdmin.removePOSItem(${idx})">×</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>

          <!-- Calculations Summary -->
          <div class="pos-calculations">
            <div class="calc-row">
              <span>Gross Subtotal:</span>
              <b>${formatMoney(subtotal)}</b>
            </div>

            <div class="calc-row">
              <span>Special In-Store Discount:</span>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span>₹</span>
                <input type="number" min="0" value="${posDiscount}" oninput="SFAdmin.updatePOSDiscount(this.value)" class="pos-discount-input" style="width: 80px; text-align: right;">
              </div>
            </div>

            <div class="calc-row">
              <span>GST (5% Handloom):</span>
              <b>${formatMoney(taxAmount)}</b>
            </div>

            <div class="calc-row total-row">
              <span>Net Payable Amount:</span>
              <span class="pos-total-amount">${formatMoney(netTotal)}</span>
            </div>
          </div>

          <!-- Payment Mode Selection -->
          <div class="pos-payment-modes">
            <label class="pos-mode-btn ${posPaymentMethod === 'CASH' ? 'active' : ''}">
              <input type="radio" name="posPay" value="CASH" ${posPaymentMethod === 'CASH' ? 'checked' : ''} onchange="SFAdmin.setPOSPaymentMethod('CASH')">
              💵 Cash
            </label>
            <label class="pos-mode-btn ${posPaymentMethod === 'UPI' ? 'active' : ''}">
              <input type="radio" name="posPay" value="UPI" ${posPaymentMethod === 'UPI' ? 'checked' : ''} onchange="SFAdmin.setPOSPaymentMethod('UPI')">
              📱 UPI QR
            </label>
            <label class="pos-mode-btn ${posPaymentMethod === 'CARD' ? 'active' : ''}">
              <input type="radio" name="posPay" value="CARD" ${posPaymentMethod === 'CARD' ? 'checked' : ''} onchange="SFAdmin.setPOSPaymentMethod('CARD')">
              💳 Card Swipe
            </label>
          </div>

          <!-- Cash Tendered Helper -->
          ${posPaymentMethod === 'CASH' && netTotal > 0 ? `
            <div class="pos-cash-helper">
              <div style="display: flex; gap: 10px; align-items: center;">
                <label style="font-size: 12px;">Cash Received:</label>
                <input type="number" value="${posCashTendered || ''}" placeholder="₹ Amount" oninput="SFAdmin.updatePOSCashTendered(this.value)" class="pos-tendered-input">
              </div>
              ${posCashTendered > 0 ? `
                <div style="font-size: 13px; color: ${changeDue >= 0 ? '#2E7D32' : '#C62828'};">
                  ${changeDue >= 0 ? `Return Change: <b>${formatMoney(changeDue)}</b>` : `Short by <b>${formatMoney(Math.abs(changeDue))}</b>`}
                </div>
              ` : ''}
            </div>
          ` : ''}

          <!-- Complete Sale Action -->
          <div class="pos-action-buttons">
            <button class="sf-btn-complete-sale" onclick="SFAdmin.completePOSSale()" ${posCart.length === 0 ? 'disabled' : ''}>
              COMPLETE SALE & PRINT INVOICE &rarr;
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderPOSProductsGrid(list) {
    return list.map(p => {
      const isOut = (p.stock_qty || 0) <= 0;
      return `
        <div class="pos-item-card ${isOut ? 'out-of-stock' : ''}" onclick="SFAdmin.addPOStoCart(${p.id})">
          <img src="${p.img}" alt="${p.name}" class="pos-item-img" loading="lazy">
          <div class="pos-item-body">
            <span class="pos-item-cat">${p.category} • ${p.sku}</span>
            <div class="pos-item-name">${p.name}</div>
            <div class="pos-item-footer">
              <span class="pos-item-price">${formatMoney(p.price)}</span>
              <span class="pos-item-stock ${isOut ? 'stock-zero' : (p.stock_qty <= 2 ? 'stock-low' : 'stock-ok')}">
                ${isOut ? 'Sold Out' : `${p.stock_qty} left`}
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function filterPOSCategory(cat, btn) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    document.querySelectorAll('.pos-cat-pill').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    let prods = db.getProducts().filter(p => p.status !== 'Archived');
    if (cat !== 'ALL') {
      prods = prods.filter(p => p.category.toLowerCase() === cat.toLowerCase());
    }
    const grid = document.getElementById('posProductsGrid');
    if (grid) grid.innerHTML = renderPOSProductsGrid(prods);
  }


  // Audio Synthesis for Hardware Barcode Scanners (Web Audio API)
  function playScanSound(type = 'success') {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {}
  }

  function renderPOSFeedback() {
    const el = document.getElementById('posScanFeedbackWrap');
    if (!el || !lastPOSScanInfo) return;
    if (lastPOSScanInfo.error) {
      el.innerHTML = `<div class="pos-scanned-error"><span>⚠️ ${lastPOSScanInfo.message}</span><button onclick="this.parentElement.remove()" style="background:none; border:none; cursor:pointer;">✕</button></div>`;
    } else {
      el.innerHTML = `<div class="pos-scanned-feedback"><span>✅ ${lastPOSScanInfo.message}</span><small style="color: #2E7D32;">Available: ${lastPOSScanInfo.stock} pcs</small></div>`;
    }
  }

  function handlePOSBarcodeKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.target.value.trim();
      if (!val) return;
      const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
      const prod = db.getProductBySkuOrBarcode(val);

      if (prod) {
        if ((prod.stock_qty || 0) <= 0) {
          playScanSound('error');
          lastPOSScanInfo = { error: true, message: `"${prod.name}" (${prod.sku}) is SOLD OUT (0 in stock).` };
          renderPOSFeedback();
          e.target.select();
          return;
        }

        playScanSound('success');
        addPOStoCart(prod.id);
        lastPOSScanInfo = {
          success: true,
          message: `Scanned: ${prod.name} (${prod.sku}) — ₹${Number(prod.price).toLocaleString('en-IN')}`,
          stock: prod.stock_qty
        };
        renderPOSFeedback();
        e.target.value = '';
      } else {
        playScanSound('error');
        lastPOSScanInfo = { error: true, message: `No saree found matching barcode/SKU "${val}".` };
        renderPOSFeedback();
        e.target.select();
      }
    }
  }

  function addPOStoCart(productId) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const prod = db.getProduct(productId);
    if (!prod) return;

    if ((prod.stock_qty || 0) <= 0) {
      alert(`"${prod.name}" is currently SOLD OUT. Central inventory is 0.`);
      return;
    }

    const existing = posCart.find(i => i.product_id === prod.id);
    if (existing) {
      if (existing.qty + 1 > prod.stock_qty) {
        alert(`Cannot add more. Available central stock for "${prod.name}" is ${prod.stock_qty}.`);
        return;
      }
      existing.qty++;
    } else {
      posCart.push({
        product_id: prod.id,
        sku: prod.sku,
        name: prod.name,
        price: prod.price,
        qty: 1
      });
    }
    render();
  }

  function changePOSQty(idx, delta) {
    const item = posCart[idx];
    if (!item) return;
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const prod = db.getProduct(item.product_id);

    const newQty = item.qty + delta;
    if (newQty <= 0) {
      posCart.splice(idx, 1);
    } else {
      if (prod && newQty > prod.stock_qty) {
        alert(`Cannot exceed available inventory (${prod.stock_qty} pieces).`);
        return;
      }
      item.qty = newQty;
    }
    render();
  }

  function removePOSItem(idx) {
    posCart.splice(idx, 1);
    render();
  }

  function clearPOSCart() {
    posCart = [];
    posDiscount = 0;
    render();
  }

  function updatePOSCustomer(field, val) {
    posCustomer[field] = val;
  }

  function updatePOSDiscount(val) {
    posDiscount = Math.max(0, parseInt(val, 10) || 0);
    render();
  }

  function setPOSPaymentMethod(mode) {
    posPaymentMethod = mode;
    render();
  }

  function updatePOSCashTendered(val) {
    posCashTendered = parseInt(val, 10) || 0;
    const changeBox = document.querySelector('.pos-cash-helper div:last-child');
    // Fast re-render of helper
    render();
  }

  function completePOSSale() {
    if (posCart.length === 0) return;
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');

    try {
      const order = db.processSaleTransaction({
        channel: 'POS',
        customer_name: posCustomer.name || 'Walk-in Patron',
        customer_phone: posCustomer.phone || '',
        items: posCart,
        discount: posDiscount,
        payment_method: posPaymentMethod,
        payment_status: 'PAID',
        admin_user: 'Bhanu (Owner)'
      });

      // Clear Cart
      const completedCart = [...posCart];
      posCart = [];
      posDiscount = 0;
      posCashTendered = 0;

      // Show Invoice Modal
      openInvoicePrintModal(order.id);
    } catch (err) {
      alert('Sale Transaction Aborted: ' + err.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. PRODUCT CATALOGUE MANAGEMENT TAB
  // ═══════════════════════════════════════════════════════════════════════════
  function renderProductsTab(db) {
    const products = db.getProducts();

    return `
      <div class="sf-view-container">
        <div class="sf-view-header">
          <div>
            <h1>Saree Product Catalogue</h1>
            <p>Master handloom repository with real-time central inventory, purchase costs, and SKUs.</p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="sf-btn-outline" onclick="SFAdmin.openBulkBarcodeModal()">🏷️ Bulk Print Stickers</button>
            <button class="sf-btn-outline" onclick="SFAdmin.openPrintHistoryModal()">📜 Print History</button>
            <button class="sf-btn-outline" onclick="SFAdmin.exportProductsCSV()">Export CSV</button>
            <button class="sf-btn-primary" onclick="SFAdmin.openAddProductModal()">+ Add New Saree</button>
          </div>
        </div>

        <div class="sf-card" style="margin-bottom: 24px;">
          <div class="sf-filters-bar">
            <input type="text" id="prodSearchInput" placeholder="Search by name, SKU, barcode, color, fabric..." oninput="SFAdmin.filterProductsTable()" class="sf-search-input">
            <select id="prodCatFilter" onchange="SFAdmin.filterProductsTable()" class="sf-select">
              <option value="ALL">All Categories</option>
              <option value="Kanchipuram">Kanchipuram</option>
              <option value="Banarasi">Banarasi</option>
              <option value="Organza">Organza</option>
              <option value="Silk">Pure Silk</option>
              <option value="Cotton">Handloom Cotton</option>
              <option value="Designer">Designer Couture</option>
            </select>
            <select id="prodStockFilter" onchange="SFAdmin.filterProductsTable()" class="sf-select">
              <option value="ALL">All Stock Levels</option>
              <option value="INSTOCK">In Stock (>2)</option>
              <option value="LOWSTOCK">Low Stock (≤2)</option>
              <option value="SOLDOUT">Sold Out (0)</option>
            </select>
          </div>

          <div class="sf-table-responsive">
            <table class="sf-table" id="sfProductsTable">
              <thead>
                <tr>
                  <th style="width: 36px; text-align: center;">
                    <input type="checkbox" id="sfSelectAllProds" onchange="SFAdmin.toggleSelectAllProducts(this)" title="Select all sarees for bulk printing">
                  </th>
                  <th style="width: 50px;">Image</th>
                  <th>SKU / Barcode</th>
                  <th>Saree Name & Details</th>
                  <th>Category</th>
                  <th>Fabric & Color</th>
                  <th>Purchase Cost</th>
                  <th>Selling Price / MRP</th>
                  <th>Central Stock</th>
                  <th>Status</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody id="sfProductsTableBody">
                ${renderProductsTableRows(products)}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sticky Bulk Selection Actions Bar -->
        ${selectedProductIds.size > 0 ? `
          <div class="sf-bulk-actions-bar">
            <div>
              <b>${selectedProductIds.size}</b> saree(s) selected for batch printing.
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button class="sf-btn-outline" style="border-color: #F5EBDD; color: #F5EBDD; padding: 6px 12px; font-size: 12px;" onclick="SFAdmin.clearProductSelection()">Deselect All</button>
              <button class="sf-btn-primary" style="background: var(--antique-gold); color: #FFF; padding: 8px 16px; font-size: 13px;" onclick="SFAdmin.printSelectedProductLabels()">
                🏷️ Print Stickers for Selected (${selectedProductIds.size}) &rarr;
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderProductsTableRows(list) {
    if (!list.length) {
      return `
        <tr>
          <td colspan="10" style="text-align: center; padding: 48px 16px; color: var(--secondary-text);">
            <div style="font-size: 32px; margin-bottom: 8px;">🥻</div>
            <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 16px; color: #3B2B25; font-weight: 500; margin-bottom: 4px;">
              No Sarees Found
            </div>
            <div style="font-size: 12.5px; color: #7A695E; margin-bottom: 12px;">
              No handcrafted drapes currently in this view. Add a new saree to begin inventory management.
            </div>
            <button type="button" class="sf-btn-primary" style="font-size: 12px; padding: 6px 14px;" onclick="SFAdmin.openAddProductModal()">
              + Add New Saree
            </button>
          </td>
        </tr>
      `;
    }
    return list.map(p => {
      const isOut = (p.stock_qty || 0) <= 0;
      const isLow = (p.stock_qty || 0) <= (p.low_stock_threshold || 2) && !isOut;
      return `
        <tr data-product-id="${p.id}">
          <td style="text-align: center;">
            <input type="checkbox" class="sf-prod-chk" value="${p.id}" ${selectedProductIds.has(p.id) ? 'checked' : ''} onchange="SFAdmin.handleProductSelectionChange(${p.id}, this.checked)">
          </td>
          <td>
            <img src="${p.img}" alt="${p.name}" class="sf-table-thumb" loading="lazy">
          </td>
          <td>
            <b>${p.sku}</b>
            <div style="display: flex; align-items: center; gap: 4px; margin-top: 2px;">
              <span style="font-family: monospace; font-size: 11px; color: var(--secondary-text);">${p.barcode || '—'}</span>
              <button class="sf-btn-icon" style="padding: 1px 4px; font-size: 10px;" title="Print Sticker" onclick="SFAdmin.openBarcodePrinterModal(${p.id})">🏷️</button>
            </div>
            ${p.price_outdated ? `<span class="sf-badge-price-outdated" title="Price has been modified. Printed label may show older price.">⚠️ Price Changed</span>` : ''}
          </td>
          <td>
            <strong style="color: var(--espresso-brown);">${p.name}</strong>
            <small style="display: block; color: var(--secondary-text);">${p.collection || ''}</small>
          </td>
          <td>${p.category}</td>
          <td>${p.fabric} • ${p.color}</td>
          <td><span style="color: #666;">${formatMoney(p.purchase_cost)}</span></td>
          <td>
            <b>${formatMoney(p.price)}</b>
            ${p.old ? `<small style="display: block; text-decoration: line-through; color: var(--secondary-text);">${formatMoney(p.old)}</small>` : ''}
          </td>
          <td>
            <span class="sf-stock-badge ${isOut ? 'stock-zero' : (isLow ? 'stock-low' : 'stock-ok')}">
              ${p.stock_qty} pcs
            </span>
          </td>
          <td>
            <span class="sf-badge badge-status-${p.status.toLowerCase()}">${p.status}</span>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="sf-btn-icon" title="Print Barcode Sticker" onclick="SFAdmin.openBarcodePrinterModal(${p.id})">🏷️</button>
            <button class="sf-btn-icon" title="Edit Saree" onclick="SFAdmin.openEditProductModal(${p.id})">✏️</button>
            <button class="sf-btn-icon" title="Duplicate Drape" onclick="SFAdmin.handleDuplicateProduct(${p.id})">📋</button>
            <button class="sf-btn-icon" title="Stock History" onclick="SFAdmin.openProductStockHistoryModal(${p.id})">📦</button>
            <button class="sf-btn-icon delete-btn" title="Delete Drape" onclick="SFAdmin.handleDeleteProduct(${p.id})">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function filterProductsTable() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const q = (document.getElementById('prodSearchInput')?.value || '').toLowerCase().trim();
    const cat = document.getElementById('prodCatFilter')?.value || 'ALL';
    const stock = document.getElementById('prodStockFilter')?.value || 'ALL';

    let prods = db.getProducts();

    if (q) {
      prods = prods.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.fabric && p.fabric.toLowerCase().includes(q)) ||
        (p.color && p.color.toLowerCase().includes(q))
      );
    }

    if (cat !== 'ALL') {
      prods = prods.filter(p => p.category.toLowerCase() === cat.toLowerCase());
    }

    if (stock === 'INSTOCK') {
      prods = prods.filter(p => (p.stock_qty || 0) > 2);
    } else if (stock === 'LOWSTOCK') {
      prods = prods.filter(p => (p.stock_qty || 0) <= 2 && (p.stock_qty || 0) > 0);
    } else if (stock === 'SOLDOUT') {
      prods = prods.filter(p => (p.stock_qty || 0) === 0);
    }

    const tbody = document.getElementById('sfProductsTableBody');
    if (tbody) tbody.innerHTML = renderProductsTableRows(prods);
  }

  // ── Multi-Image Gallery State & Handlers ──
  let modalProductImages = [];

  function renderModalProductImagesHTML() {
    if (!modalProductImages || !modalProductImages.length) {
      return `
        <div style="grid-column: 1 / -1; padding: 20px; text-align: center; color: var(--secondary-text); font-size: 13px; background: #FFF; border: 1px dashed #D8C3A5; border-radius: 4px;">
          No photographs uploaded yet. Drag & drop files above or click to browse.
        </div>
      `;
    }

    return modalProductImages.map((url, idx) => {
      const isCover = idx === 0;
      return `
        <div class="sf-image-preview-card ${isCover ? 'is-cover' : ''}" data-idx="${idx}">
          <div class="sf-image-thumb-wrap">
            <img src="${url}" alt="Saree Image ${idx + 1}" onerror="this.src='assets/kanchipuram-loom.jpg'">
            ${isCover ? '<span class="sf-image-cover-badge">★ Cover</span>' : ''}
          </div>
          <div class="sf-image-card-actions">
            ${!isCover ? `
              <button type="button" class="sf-img-action-btn" onclick="SFAdmin.setCoverImage(${idx})" title="Set as primary cover">★ Cover</button>
            ` : '<span style="font-size:10px; color:#A77950; font-weight:700; padding:2px 4px;">Primary</span>'}
            <div style="display:flex; gap:2px;">
              <button type="button" class="sf-img-action-btn" onclick="SFAdmin.moveProductImage(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} title="Move left">←</button>
              <button type="button" class="sf-img-action-btn" onclick="SFAdmin.moveProductImage(${idx}, 1)" ${idx === modalProductImages.length - 1 ? 'disabled' : ''} title="Move right">→</button>
              <button type="button" class="sf-img-action-btn sf-img-action-del" onclick="SFAdmin.removeProductImage(${idx})" title="Remove photograph">✕</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function updateModalProductImagesUI() {
    const grid = document.getElementById('modalProductImagesGrid');
    if (grid) grid.innerHTML = renderModalProductImagesHTML();
  }

  function setCoverImage(idx) {
    if (idx > 0 && idx < modalProductImages.length) {
      const [item] = modalProductImages.splice(idx, 1);
      modalProductImages.unshift(item);
      updateModalProductImagesUI();
    }
  }

  function moveProductImage(idx, dir) {
    const targetIdx = idx + dir;
    if (targetIdx >= 0 && targetIdx < modalProductImages.length) {
      const temp = modalProductImages[idx];
      modalProductImages[idx] = modalProductImages[targetIdx];
      modalProductImages[targetIdx] = temp;
      updateModalProductImagesUI();
    }
  }

  function removeProductImage(idx) {
    if (idx >= 0 && idx < modalProductImages.length) {
      modalProductImages.splice(idx, 1);
      updateModalProductImagesUI();
    }
  }

  function handleAddImageUrl() {
    const input = document.getElementById('fDirectImageUrl');
    if (!input) return;
    const url = input.value.trim();
    if (!url) return;
    modalProductImages.push(url);
    input.value = '';
    updateModalProductImagesUI();
  }

  async function handleFileInputChange(fileList) {
    if (!fileList || !fileList.length) return;
    const pBar = document.getElementById('modalImageProgressBar');
    const pFill = document.getElementById('modalImageProgressFill');
    const alertBox = document.getElementById('modalImageUploadAlert');
    if (alertBox) { alertBox.style.display = 'none'; alertBox.textContent = ''; }

    const files = Array.from(fileList);
    const sb = (typeof SFSupabase !== 'undefined') ? SFSupabase : (typeof window !== 'undefined' && window.SFSupabase ? window.SFSupabase : null);

    if (pBar) pBar.style.display = 'block';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Format validation
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowed.includes(file.type.toLowerCase())) {
        if (alertBox) {
          alertBox.textContent = `Unsupported format for "${file.name}". Please upload JPG, PNG, or WebP.`;
          alertBox.style.display = 'block';
        }
        continue;
      }

      // Max size validation (5MB)
      if (file.size > 5 * 1024 * 1024) {
        if (alertBox) {
          alertBox.textContent = `File "${file.name}" exceeds 5MB size limit. Please upload an optimized image.`;
          alertBox.style.display = 'block';
        }
        continue;
      }

      if (pFill) pFill.style.width = Math.round(((i + 0.3) / files.length) * 100) + '%';

      try {
        if (sb && typeof sb.uploadProductImage === 'function') {
          const res = await sb.uploadProductImage(file, (pct) => {
            if (pFill) {
              const overall = Math.round(((i + (pct / 100)) / files.length) * 100);
              pFill.style.width = overall + '%';
            }
          });
          if (res && res.success && res.publicUrl) {
            modalProductImages.push(res.publicUrl);
          } else {
            const dataUrl = await readFileAsDataURL(file);
            modalProductImages.push(dataUrl);
          }
        } else {
          const dataUrl = await readFileAsDataURL(file);
          modalProductImages.push(dataUrl);
        }
      } catch (err) {
        console.warn('Image upload fallback:', err);
        const dataUrl = await readFileAsDataURL(file);
        modalProductImages.push(dataUrl);
      }
    }

    if (pFill) pFill.style.width = '100%';
    setTimeout(() => {
      if (pBar) pBar.style.display = 'none';
      if (pFill) pFill.style.width = '0%';
    }, 400);

    updateModalProductImagesUI();
    const fileInput = document.getElementById('fProdFileInput');
    if (fileInput) fileInput.value = '';
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve('assets/kanchipuram-loom.jpg');
      reader.readAsDataURL(file);
    });
  }

  function openAddProductModal() {
    openProductFormModal(null);
  }

  function openEditProductModal(id) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const prod = db.getProduct(id);
    if (prod) openProductFormModal(prod);
  }

  function openProductFormModal(prod = null) {
    const isEdit = !!prod;
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const container = document.getElementById('sfModalContainer');
    if (!container) return;

    // Initialize multi-image gallery state
    if (prod) {
      if (Array.isArray(prod.images) && prod.images.length > 0) {
        modalProductImages = [...prod.images];
      } else if (prod.img) {
        modalProductImages = [prod.img];
      } else {
        modalProductImages = [];
      }
    } else {
      modalProductImages = [];
    }

    const initialCategory = prod ? prod.category : 'Kanchipuram';
    const autoSku = prod ? prod.sku : db.generateNextSku(initialCategory);
    const autoBarcode = prod ? (prod.barcode || '') : db.generateNextBarcode(initialCategory);

    container.innerHTML = `
      <div class="sf-modal-backdrop" onclick="if(event.target===this) SFAdmin.closeModal()">
        <div class="sf-modal-card sf-modal-lg">
          <div class="sf-modal-header">
            <div>
              <h3>${isEdit ? `Edit Saree: ${prod.name}` : '+ Add Handcrafted Saree to Catalogue'}</h3>
              <p style="margin: 0; font-size: 11.5px; color: var(--secondary-text);">
                Automatic Code 128 barcode generation, unique SKU assignment, and central image storage.
              </p>
            </div>
            <button class="sf-modal-close" onclick="SFAdmin.closeModal()">×</button>
          </div>

          <form id="sfProductForm" onsubmit="event.preventDefault(); SFAdmin.handleSaveProduct(${isEdit ? prod.id : 'null'});">
            <!-- Live Barcode Banner -->
            <div style="background: #FDFBF7; border: 1px solid var(--border); border-radius: 4px; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
              <div>
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--secondary-text); font-weight: 700;">
                  Code 128 Barcode Preview
                </div>
                <div id="modalBarcodePreviewBox" style="margin-top: 4px;"></div>
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                ${isEdit ? `
                  <button type="button" class="sf-btn-outline" onclick="SFAdmin.openBarcodePrinterModal(${prod.id})" style="font-size: 12px; display: inline-flex; align-items: center; gap: 5px;">
                    🏷️ Print Barcode Stickers
                  </button>
                ` : `
                  <span class="sf-badge badge-status-published" style="font-size: 11px;">Status: Auto-Generated Code 128</span>
                `}
              </div>
            </div>

            <div class="sf-form-grid-3">
              <div class="sf-form-group col-span-2">
                <label>Saree Title / Product Name *</label>
                <input type="text" id="fProdName" required value="${prod ? prod.name : ''}" placeholder="e.g. Royal Kanchipuram Pure Silk Saree" oninput="SFAdmin.updateModalBarcodePreview()">
              </div>

              <div class="sf-form-group">
                <label>Unique SKU *</label>
                <div style="display: flex; gap: 4px;">
                  <input type="text" id="fProdSku" required value="${autoSku}" placeholder="e.g. SF-KAN-015" oninput="SFAdmin.updateModalBarcodePreview()">
                  ${!isEdit ? `<button type="button" class="sf-btn-outline" style="padding: 4px 8px;" title="Regenerate SKU" onclick="SFAdmin.refreshModalSku()">⚡</button>` : ''}
                </div>
              </div>
            </div>

            <div class="sf-form-grid-3">
              <div class="sf-form-group">
                <label>Barcode (Code 128) *</label>
                <div style="display: flex; gap: 4px;">
                  <input type="text" id="fProdBarcode" required value="${autoBarcode}" placeholder="e.g. SF26010015" oninput="SFAdmin.updateModalBarcodePreview()">
                  ${!isEdit ? `<button type="button" class="sf-btn-outline" style="padding: 4px 8px;" title="Regenerate Barcode" onclick="SFAdmin.refreshModalBarcode()">⚡</button>` : ''}
                </div>
                <small style="font-size: 11px; color: var(--secondary-text);">
                  ${isEdit ? 'Permanent barcode retained across price updates' : 'Unique internal inventory identifier'}
                </small>
              </div>

              <div class="sf-form-group">
                <label>Weave Category *</label>
                <select id="fProdCategory" required onchange="SFAdmin.handleModalCategoryChange(this.value, ${isEdit})">
                  ${['Kanchipuram', 'Banarasi', 'Organza', 'Silk', 'Cotton', 'Designer'].map(c => `
                    <option value="${c}" ${prod && prod.category === c ? 'selected' : ''}>${c}</option>
                  `).join('')}
                </select>
              </div>

              <div class="sf-form-group">
                <label>Collection Edit</label>
                <input type="text" id="fProdCollection" value="${prod ? (prod.collection || '') : 'Temple Heritage'}" placeholder="e.g. Royal Muhurtham">
              </div>
            </div>

            <div class="sf-form-grid-3">
              <div class="sf-form-group">
                <label>Selling Price (₹) *</label>
                <input type="number" id="fProdPrice" required min="1" value="${prod ? prod.price : ''}" placeholder="e.g. 6499">
              </div>

              <div class="sf-form-group">
                <label>Original MRP (₹)</label>
                <input type="number" id="fProdOld" min="1" value="${prod ? (prod.old || '') : ''}" placeholder="e.g. 7999">
              </div>

              <div class="sf-form-group">
                <label>Purchase Cost (₹) *</label>
                <input type="number" id="fProdCost" required min="1" value="${prod ? prod.purchase_cost : ''}" placeholder="e.g. 3800" title="Used for real gross/net profit accounting">
              </div>
            </div>

            <div class="sf-form-grid-3">
              <div class="sf-form-group">
                <label>Available Central Stock (Units) *</label>
                <input type="number" id="fProdStock" required min="0" value="${prod ? prod.stock_qty : 5}">
              </div>

              <div class="sf-form-group">
                <label>Low Stock Alert Threshold</label>
                <input type="number" id="fProdLowThreshold" min="1" value="${prod ? (prod.low_stock_threshold || 2) : 2}">
              </div>

              <div class="sf-form-group">
                <label>Publication Status</label>
                <select id="fProdStatus">
                  <option value="Published" ${prod && prod.status === 'Published' ? 'selected' : ''}>Published (Active)</option>
                  <option value="Draft" ${prod && prod.status === 'Draft' ? 'selected' : ''}>Draft</option>
                  <option value="Archived" ${prod && prod.status === 'Archived' ? 'selected' : ''}>Archived</option>
                </select>
              </div>
            </div>

            <div class="sf-form-grid-3">
              <div class="sf-form-group">
                <label>Fabric / Composition</label>
                <input type="text" id="fProdFabric" value="${prod ? prod.fabric : 'Pure Silk'}" placeholder="e.g. Pure Mulberry Silk">
              </div>

              <div class="sf-form-group">
                <label>Color Palette</label>
                <input type="text" id="fProdColor" value="${prod ? prod.color : 'Burgundy & Gold'}" placeholder="e.g. Crimson & Gold">
              </div>

              <div class="sf-form-group">
                <label>Occasion</label>
                <select id="fProdOccasion">
                  ${['Bridal & Wedding', 'Festive Celebration', 'Party Wear', 'Everyday Grace'].map(o => `
                    <option value="${o}" ${prod && prod.occasion === o ? 'selected' : ''}>${o}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div class="sf-form-grid-2">
              <div class="sf-form-group">
                <label>Promotional Badge</label>
                <input type="text" id="fProdBadge" value="${prod ? (prod.badge || '') : 'New Arrival'}" placeholder="e.g. Bestseller, Heirloom">
              </div>

              <div class="sf-form-group">
                <label>Material & Zari Certification</label>
                <input type="text" id="fProdMaterial" value="${prod ? (prod.material || '') : 'Pure Mulberry Silk (Silk Mark Certified)'}" placeholder="e.g. Silk Mark Certified">
              </div>
            </div>

            <!-- Saree Multi-Image Uploader Section -->
            <div class="sf-image-uploader-section">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <label style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #3B2B25;">
                  Product Photographs (Multi-Image Gallery & Storage) *
                </label>
                <small style="font-size: 11px; color: var(--secondary-text);">First photograph is primary cover</small>
              </div>

              <!-- Drag & Drop Zone -->
              <div class="sf-image-dropzone" id="modalImageDropzone"
                   onclick="document.getElementById('fProdFileInput').click()"
                   ondragover="event.preventDefault(); this.classList.add('dragover');"
                   ondragleave="this.classList.remove('dragover');"
                   ondrop="event.preventDefault(); this.classList.remove('dragover'); SFAdmin.handleFileInputChange(event.dataTransfer.files);">
                <span class="sf-image-dropzone-icon">📷</span>
                <div class="sf-image-dropzone-text">Click to browse or drag & drop high-resolution saree photographs</div>
                <div class="sf-image-dropzone-sub">Supported formats: JPG, PNG, WebP • Max 5MB per file • Direct central cloud storage integration</div>
                <input type="file" id="fProdFileInput" multiple accept="image/jpeg,image/png,image/webp" style="display: none;" onchange="SFAdmin.handleFileInputChange(this.files)">
              </div>

              <!-- Upload Progress & Error -->
              <div class="sf-upload-progress-bar" id="modalImageProgressBar">
                <div class="sf-upload-progress-fill" id="modalImageProgressFill"></div>
              </div>
              <div class="sf-upload-alert" id="modalImageUploadAlert"></div>

              <!-- Direct URL Addition -->
              <div style="display: flex; gap: 8px; margin-top: 10px;">
                <input type="text" id="fDirectImageUrl" placeholder="Or enter image URL / asset path..." style="font-size: 12px; padding: 6px 10px;">
                <button type="button" class="sf-btn-outline" style="white-space: nowrap; font-size: 12px; padding: 6px 12px;" onclick="SFAdmin.handleAddImageUrl()">+ Add URL</button>
              </div>

              <!-- Live Image Gallery Grid -->
              <div class="sf-image-gallery-grid" id="modalProductImagesGrid">
                ${renderModalProductImagesHTML()}
              </div>
            </div>

            <div class="sf-form-group">
              <label>Detailed Handloom Story & Drape Description</label>
              <textarea id="fProdDesc" rows="3" placeholder="Describe the weave, zari quality, motifs, and provenance...">${prod ? (prod.desc || '') : ''}</textarea>
            </div>

            <div class="sf-modal-actions">
              <button type="button" class="sf-btn-outline" onclick="SFAdmin.closeModal()">Cancel</button>
              <button type="submit" class="sf-btn-primary">${isEdit ? 'Save Changes' : 'Create & Publish Saree'}</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function handleSaveProduct(existingId) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');

    const primaryImg = modalProductImages.length > 0 ? modalProductImages[0] : 'assets/kanchipuram-loom.jpg';
    const allImages = modalProductImages.length > 0 ? modalProductImages : [primaryImg];

    const data = {
      id: existingId,
      name: document.getElementById('fProdName').value,
      sku: document.getElementById('fProdSku').value,
      barcode: document.getElementById('fProdBarcode').value,
      category: document.getElementById('fProdCategory').value,
      collection: document.getElementById('fProdCollection').value,
      price: document.getElementById('fProdPrice').value,
      old: document.getElementById('fProdOld').value,
      purchase_cost: document.getElementById('fProdCost').value,
      stock_qty: document.getElementById('fProdStock').value,
      low_stock_threshold: document.getElementById('fProdLowThreshold').value,
      status: document.getElementById('fProdStatus').value,
      fabric: document.getElementById('fProdFabric').value,
      color: document.getElementById('fProdColor').value,
      occasion: document.getElementById('fProdOccasion').value,
      material: document.getElementById('fProdMaterial') ? document.getElementById('fProdMaterial').value : 'Pure Mulberry Silk',
      img: primaryImg,
      images: allImages,
      badge: document.getElementById('fProdBadge').value,
      desc: document.getElementById('fProdDesc').value
    };

    try {
      const saved = db.saveProduct(data);
      closeModal();
      render();
      toast(`Saved saree "${saved.name}" (${saved.sku}) to central catalogue.`);
    } catch (e) {
      alert('Error saving saree: ' + e.message);
    }
  }

  function handleDuplicateProduct(id) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    if (confirm('Duplicate this saree drape into a new draft item?')) {
      db.duplicateProduct(id);
      render();
    }
  }

  function handleDeleteProduct(id) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const p = db.getProduct(id);
    if (!p) return;
    if (confirm(`Are you sure you want to permanently delete "${p.name}" (${p.sku})? This action cannot be undone.`)) {
      db.deleteProduct(id);
      render();
    }
  }

  function exportProductsCSV() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const prods = db.getProducts();
    const headers = ['ID', 'SKU', 'Barcode', 'Name', 'Category', 'Fabric', 'Color', 'PurchaseCost', 'SellingPrice', 'StockQty', 'Status'];
    const rows = prods.map(p => [
      p.id,
      `"${p.sku}"`,
      `"${p.barcode || ''}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      `"${p.fabric}"`,
      `"${p.color}"`,
      p.purchase_cost,
      p.price,
      p.stock_qty,
      p.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Shanmuka_Saree_Catalogue_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. INVENTORY LEDGER TAB
  // ═══════════════════════════════════════════════════════════════════════════
  function renderInventoryTab(db) {
    const ledger = db.getInventoryLedger();
    const products = db.getProducts();
    const lowStock = products.filter(p => (p.stock_qty || 0) <= (p.low_stock_threshold || 2));

    return `
      <div class="sf-view-container">
        <div class="sf-view-header">
          <div>
            <h1>Central Inventory Ledger & Stock Movement</h1>
            <p>Every intake, online sale, POS billing, and adjustment recorded with audit traceability.</p>
          </div>
          <button class="sf-btn-primary" onclick="SFAdmin.openStockAdjustmentModal()">+ Record Stock Adjustment</button>
        </div>

        <!-- Low Stock Alerts Box if any -->
        ${lowStock.length > 0 ? `
          <div class="sf-alert-banner">
            <div>
              <strong>⚠️ ${lowStock.length} Saree Collections Need Reorder Attention</strong>
              <p>The following items have reached or breached their minimum safety stock threshold:</p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px;">
                ${lowStock.map(p => `
                  <span class="sf-pill-warn" onclick="SFAdmin.openStockAdjustmentModal(${p.id})">
                    ${p.name} (${p.sku}): <b>${p.stock_qty} left</b>
                  </span>
                `).join('')}
              </div>
            </div>
            <button class="sf-btn-outline" onclick="SFAdmin.switchTab('suppliers')">Create Purchase Order &rarr;</button>
          </div>
        ` : ''}

        <!-- Movement Ledger Table -->
        <div class="sf-card">
          <div class="sf-card-header">
            <h3>Chronological Stock Movement Log</h3>
            <span class="sf-card-badge">${ledger.length} Audit Entries</span>
          </div>
          <div class="sf-table-responsive">
            <table class="sf-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Saree / SKU</th>
                  <th>Movement Type</th>
                  <th>Prev Qty</th>
                  <th>Change</th>
                  <th>New Qty</th>
                  <th>Channel</th>
                  <th>Reason / Reference</th>
                  <th>Logged By</th>
                </tr>
              </thead>
              <tbody>
                ${ledger.map(entry => `
                  <tr>
                    <td>${formatDate(entry.timestamp)}</td>
                    <td>
                      <strong>${entry.product_name}</strong>
                      <small style="display:block; color: var(--secondary-text);">${entry.sku}</small>
                    </td>
                    <td>
                      <span class="sf-badge badge-ledger-${entry.type.toLowerCase()}">${entry.type}</span>
                    </td>
                    <td>${entry.prev_qty}</td>
                    <td>
                      <b style="color: ${entry.change_qty > 0 ? '#2E7D32' : '#C62828'};">
                        ${entry.change_qty > 0 ? '+' : ''}${entry.change_qty}
                      </b>
                    </td>
                    <td><b>${entry.new_qty}</b></td>
                    <td><span class="sf-badge ${entry.channel === 'POS' ? 'badge-pos' : (entry.channel === 'ONLINE' ? 'badge-online' : 'badge-admin')}">${entry.channel}</span></td>
                    <td style="max-width: 280px;">${entry.reason}</td>
                    <td><small>${entry.admin_user}</small></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sticky Bulk Selection Actions Bar -->
        ${selectedProductIds.size > 0 ? `
          <div class="sf-bulk-actions-bar">
            <div>
              <b>${selectedProductIds.size}</b> saree(s) selected for batch printing.
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button class="sf-btn-outline" style="border-color: #F5EBDD; color: #F5EBDD; padding: 6px 12px; font-size: 12px;" onclick="SFAdmin.clearProductSelection()">Deselect All</button>
              <button class="sf-btn-primary" style="background: var(--antique-gold); color: #FFF; padding: 8px 16px; font-size: 13px;" onclick="SFAdmin.printSelectedProductLabels()">
                🏷️ Print Stickers for Selected (${selectedProductIds.size}) &rarr;
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function openStockAdjustmentModal(defaultProdId = null) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const products = db.getProducts();
    const container = document.getElementById('sfModalContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="sf-modal-backdrop" onclick="if(event.target===this) SFAdmin.closeModal()">
        <div class="sf-modal-card">
          <div class="sf-modal-header">
            <h3>Record Stock Adjustment</h3>
            <button class="sf-modal-close" onclick="SFAdmin.closeModal()">×</button>
          </div>

          <form id="sfStockAdjForm" onsubmit="event.preventDefault(); SFAdmin.handleSaveStockAdjustment();">
            <div class="sf-form-group">
              <label>Select Saree Drape *</label>
              <select id="adjProdId" required>
                ${products.map(p => `
                  <option value="${p.id}" ${defaultProdId && p.id === parseInt(defaultProdId, 10) ? 'selected' : ''}>
                    ${p.name} (${p.sku}) — Current Stock: ${p.stock_qty} pcs
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="sf-form-grid-2">
              <div class="sf-form-group">
                <label>Adjustment Type *</label>
                <select id="adjType" required>
                  <option value="STOCK_IN">Stock Addition (Inward Delivery)</option>
                  <option value="ADJUSTMENT">Physical Inventory Audit Adjustment</option>
                  <option value="DAMAGE">Damaged / Flawed Goods Write-off</option>
                  <option value="RETURN">Customer Return Restock</option>
                </select>
              </div>

              <div class="sf-form-group">
                <label>Quantity Delta (+ or −) *</label>
                <input type="number" id="adjQty" required placeholder="e.g. +5 or -1">
              </div>
            </div>

            <div class="sf-form-group">
              <label>Reason / Audit Note *</label>
              <input type="text" id="adjReason" required placeholder="e.g. Received 5 pcs from Kanchipuram loom or damaged zari edge">
            </div>

            <div class="sf-form-group" style="margin-top: 8px; background: #FDFBF7; padding: 10px; border: 1px solid var(--border); border-radius: 4px;">
              <label style="display: flex; align-items: center; gap: 8px; font-weight: normal; cursor: pointer; font-size: 13px; margin: 0;">
                <input type="checkbox" id="adjPrintLabels" checked>
                <span>🏷️ <b>Print thermal barcode stickers</b> for newly received units</span>
              </label>
            </div>

            <div class="sf-modal-actions">
              <button type="button" class="sf-btn-outline" onclick="SFAdmin.closeModal()">Cancel</button>
              <button type="submit" class="sf-btn-primary">Update Central Stock & Ledger</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function handleSaveStockAdjustment() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const prodId = document.getElementById('adjProdId').value;
    const type = document.getElementById('adjType').value;
    const qty = document.getElementById('adjQty').value;
    const reason = document.getElementById('adjReason').value;

    try {
      db.adjustStock(prodId, qty, reason, 'Bhanu (Owner)', type);
      closeModal();
      render();
    } catch (e) {
      alert('Adjustment Error: ' + e.message);
    }
  }

  function openProductStockHistoryModal(productId) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const prod = db.getProduct(productId);
    if (!prod) return;
    const history = db.getInventoryLedger(productId);
    const container = document.getElementById('sfModalContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="sf-modal-backdrop" onclick="if(event.target===this) SFAdmin.closeModal()">
        <div class="sf-modal-card sf-modal-lg">
          <div class="sf-modal-header">
            <h3>Stock Ledger History: ${prod.name} (${prod.sku})</h3>
            <button class="sf-modal-close" onclick="SFAdmin.closeModal()">×</button>
          </div>
          <div style="margin-bottom: 16px; padding: 12px; background: var(--champagne-ivory); border-radius: 4px; display: flex; justify-content: space-between;">
            <div>Current Stock: <b>${prod.stock_qty} pieces</b></div>
            <div>Purchase Cost: <b>${formatMoney(prod.purchase_cost)}</b></div>
            <div>Selling Price: <b>${formatMoney(prod.price)}</b></div>
          </div>
          <div class="sf-table-responsive">
            <table class="sf-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Type</th>
                  <th>Prev</th>
                  <th>Change</th>
                  <th>New</th>
                  <th>Channel</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                ${history.map(h => `
                  <tr>
                    <td>${formatDate(h.timestamp)}</td>
                    <td><span class="sf-badge badge-ledger-${h.type.toLowerCase()}">${h.type}</span></td>
                    <td>${h.prev_qty}</td>
                    <td style="color: ${h.change_qty > 0 ? '#2E7D32' : '#C62828'}; font-weight: bold;">
                      ${h.change_qty > 0 ? '+' : ''}${h.change_qty}
                    </td>
                    <td><b>${h.new_qty}</b></td>
                    <td>${h.channel}</td>
                    <td>${h.reason}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sticky Bulk Selection Actions Bar -->
        ${selectedProductIds.size > 0 ? `
          <div class="sf-bulk-actions-bar">
            <div>
              <b>${selectedProductIds.size}</b> saree(s) selected for batch printing.
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button class="sf-btn-outline" style="border-color: #F5EBDD; color: #F5EBDD; padding: 6px 12px; font-size: 12px;" onclick="SFAdmin.clearProductSelection()">Deselect All</button>
              <button class="sf-btn-primary" style="background: var(--antique-gold); color: #FFF; padding: 8px 16px; font-size: 13px;" onclick="SFAdmin.printSelectedProductLabels()">
                🏷️ Print Stickers for Selected (${selectedProductIds.size}) &rarr;
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. CUSTOMER ORDERS TAB (ONLINE & POS)
  // ═══════════════════════════════════════════════════════════════════════════
  function renderOrdersTab(db) {
    const orders = db.getOrders();

    return `
      <div class="sf-view-container">
        <div class="sf-view-header">
          <div>
            <h1>Customer Orders (Online Storefront & Physical POS)</h1>
            <p>Track order dispatch, courier tracking numbers, payments, and printable invoices.</p>
          </div>
          <button class="sf-btn-action" onclick="SFAdmin.switchTab('pos')">+ New POS Sale</button>
        </div>

        <div class="sf-card">
          <div class="sf-filters-bar">
            <input type="text" id="orderSearchInput" placeholder="Search by Order #, Customer Name, Phone..." oninput="SFAdmin.filterOrdersTable()" class="sf-search-input">
            <select id="orderChannelFilter" onchange="SFAdmin.filterOrdersTable()" class="sf-select">
              <option value="ALL">All Channels</option>
              <option value="ONLINE">Online Store</option>
              <option value="POS">Physical Shop POS</option>
            </select>
            <select id="orderStatusFilter" onchange="SFAdmin.filterOrdersTable()" class="sf-select">
              <option value="ALL">All Order Statuses</option>
              <option value="NEW">New</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="PACKED">Packed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="RETURNED">Returned</option>
            </select>
          </div>

          <div class="sf-table-responsive">
            <table class="sf-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Channel</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items & Drapes</th>
                  <th>Total Amount</th>
                  <th>Payment</th>
                  <th>Fulfillment Status</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody id="sfOrdersTableBody">
                ${renderOrdersTableRows(orders)}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sticky Bulk Selection Actions Bar -->
        ${selectedProductIds.size > 0 ? `
          <div class="sf-bulk-actions-bar">
            <div>
              <b>${selectedProductIds.size}</b> saree(s) selected for batch printing.
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button class="sf-btn-outline" style="border-color: #F5EBDD; color: #F5EBDD; padding: 6px 12px; font-size: 12px;" onclick="SFAdmin.clearProductSelection()">Deselect All</button>
              <button class="sf-btn-primary" style="background: var(--antique-gold); color: #FFF; padding: 8px 16px; font-size: 13px;" onclick="SFAdmin.printSelectedProductLabels()">
                🏷️ Print Stickers for Selected (${selectedProductIds.size}) &rarr;
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderOrdersTableRows(list) {
    if (!list.length) {
      return `
        <tr>
          <td colspan="9" style="text-align: center; padding: 48px 16px; color: var(--secondary-text);">
            <div style="font-size: 32px; margin-bottom: 8px;">📦</div>
            <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 16px; color: #3B2B25; font-weight: 500; margin-bottom: 4px;">
              No Customer Orders Yet
            </div>
            <div style="font-size: 12.5px; color: #7A695E;">
              Transactions from your online boutique and showroom POS register will appear here in real time.
            </div>
          </td>
        </tr>
      `;
    }
    return list.map(o => `
      <tr>
        <td><b>${o.order_number}</b></td>
        <td>
          <span class="sf-badge ${o.channel === 'POS' ? 'badge-pos' : 'badge-online'}">
            ${o.channel === 'POS' ? '🛍️ POS' : '🌐 Online'}
          </span>
        </td>
        <td>${formatDate(o.created_at)}</td>
        <td>
          <strong>${o.customer_name}</strong>
          <small style="display:block; color: var(--secondary-text);">${o.customer_phone || ''}</small>
        </td>
        <td>${(o.items || []).map(i => `${i.qty}x ${i.name}`).join(', ')}</td>
        <td><b>${formatMoney(o.total)}</b></td>
        <td>
          <span class="sf-badge badge-payment">${o.payment_method} (${o.payment_status})</span>
        </td>
        <td>
          <select onchange="SFAdmin.handleOrderStatusChange('${o.id}', this.value)" class="sf-table-select">
            ${['NEW', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'].map(st => `
              <option value="${st}" ${o.order_status === st ? 'selected' : ''}>${st}</option>
            `).join('')}
          </select>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="sf-btn-sm" onclick="SFAdmin.openOrderModal('${o.id}')">Manage / Bill</button>
        </td>
      </tr>
    `).join('');
  }

  function filterOrdersTable() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const q = (document.getElementById('orderSearchInput')?.value || '').toLowerCase().trim();
    const chan = document.getElementById('orderChannelFilter')?.value || 'ALL';
    const st = document.getElementById('orderStatusFilter')?.value || 'ALL';

    let orders = db.getOrders();
    if (q) {
      orders = orders.filter(o =>
        o.order_number.toLowerCase().includes(q) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
        (o.customer_phone && o.customer_phone.includes(q))
      );
    }
    if (chan !== 'ALL') orders = orders.filter(o => o.channel === chan);
    if (st !== 'ALL') orders = orders.filter(o => o.order_status === st);

    const tbody = document.getElementById('sfOrdersTableBody');
    if (tbody) tbody.innerHTML = renderOrdersTableRows(orders);
  }

  function handleOrderStatusChange(orderId, newStatus) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    try {
      db.updateOrderStatus(orderId, newStatus);
      render();
    } catch (e) {
      alert('Error updating status: ' + e.message);
    }
  }

  function openOrderModal(orderId) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const o = db.getOrder(orderId);
    if (!o) return;
    const container = document.getElementById('sfModalContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="sf-modal-backdrop" onclick="if(event.target===this) SFAdmin.closeModal()">
        <div class="sf-modal-card sf-modal-lg">
          <div class="sf-modal-header">
            <div>
              <h3>Order #${o.order_number}</h3>
              <span class="sf-badge ${o.channel === 'POS' ? 'badge-pos' : 'badge-online'}">${o.channel} Order</span>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="sf-btn-outline" onclick="SFAdmin.openInvoicePrintModal('${o.id}')">🖨️ Printable Invoice</button>
              <button class="sf-modal-close" onclick="SFAdmin.closeModal()">×</button>
            </div>
          </div>

          <div class="sf-grid-2col" style="margin-bottom: 20px;">
            <div class="sf-detail-box">
              <h4>Patron Information</h4>
              <div>Name: <b>${o.customer_name}</b></div>
              <div>Phone: <a href="tel:${o.customer_phone}">${o.customer_phone || '—'}</a></div>
              <div>Email: ${o.customer_email || '—'}</div>
              <div>Delivery Address: ${o.delivery_address?.street || ''}, ${o.delivery_address?.city || ''}, ${o.delivery_address?.pincode || ''}</div>
            </div>

            <div class="sf-detail-box">
              <h4>Logistics & Dispatch</h4>
              <div class="sf-form-group" style="margin-bottom: 8px;">
                <label style="font-size: 11px;">Courier Partner:</label>
                <input type="text" id="mOrderCourier" value="${o.courier || 'Blue Dart Express'}" class="sf-input-sm">
              </div>
              <div class="sf-form-group" style="margin-bottom: 8px;">
                <label style="font-size: 11px;">Airway Bill / Tracking ID:</label>
                <input type="text" id="mOrderTracking" value="${o.tracking_number || ''}" class="sf-input-sm">
              </div>
              <button class="sf-btn-sm" onclick="SFAdmin.saveOrderLogistics('${o.id}')">Save Tracking</button>
            </div>
          </div>

          <!-- Itemized Saree List -->
          <div class="sf-table-responsive" style="margin-bottom: 20px;">
            <table class="sf-table">
              <thead>
                <tr>
                  <th>Saree Drape</th>
                  <th>SKU</th>
                  <th>Rate</th>
                  <th>Qty</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${(o.items || []).map(i => `
                  <tr>
                    <td><strong>${i.name}</strong></td>
                    <td>${i.sku}</td>
                    <td>${formatMoney(i.price)}</td>
                    <td>${i.qty}</td>
                    <td style="text-align: right;"><b>${formatMoney(i.total)}</b></td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="text-align: right;">Subtotal:</td>
                  <td style="text-align: right;"><b>${formatMoney(o.subtotal)}</b></td>
                </tr>
                ${o.discount > 0 ? `
                  <tr>
                    <td colspan="4" style="text-align: right; color: #C62828;">Discount (${o.coupon_code || 'Promo'}):</td>
                    <td style="text-align: right; color: #C62828;">−${formatMoney(o.discount)}</td>
                  </tr>
                ` : ''}
                <tr>
                  <td colspan="4" style="text-align: right;">GST (5%):</td>
                  <td style="text-align: right;">${formatMoney(o.tax_amount)}</td>
                </tr>
                <tr>
                  <td colspan="4" style="text-align: right;">Express Shipping:</td>
                  <td style="text-align: right;">${o.shipping_charges === 0 ? 'Complimentary' : formatMoney(o.shipping_charges)}</td>
                </tr>
                <tr style="font-size: 16px;">
                  <td colspan="4" style="text-align: right; font-weight: bold;">Grand Total:</td>
                  <td style="text-align: right; font-weight: bold; color: var(--espresso-brown);">${formatMoney(o.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Sticky Bulk Selection Actions Bar -->
        ${selectedProductIds.size > 0 ? `
          <div class="sf-bulk-actions-bar">
            <div>
              <b>${selectedProductIds.size}</b> saree(s) selected for batch printing.
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button class="sf-btn-outline" style="border-color: #F5EBDD; color: #F5EBDD; padding: 6px 12px; font-size: 12px;" onclick="SFAdmin.clearProductSelection()">Deselect All</button>
              <button class="sf-btn-primary" style="background: var(--antique-gold); color: #FFF; padding: 8px 16px; font-size: 13px;" onclick="SFAdmin.printSelectedProductLabels()">
                🏷️ Print Stickers for Selected (${selectedProductIds.size}) &rarr;
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function saveOrderLogistics(orderId) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const courier = document.getElementById('mOrderCourier')?.value;
    const tracking = document.getElementById('mOrderTracking')?.value;
    db.updateOrderDetails(orderId, { courier, tracking_number: tracking });
    alert('Logistics information saved successfully.');
    render();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. CUSTOMER PROFILES TAB
  // ═══════════════════════════════════════════════════════════════════════════
  function renderCustomersTab(db) {
    const customers = db.getCustomers();

    return `
      <div class="sf-view-container">
        <div class="sf-view-header">
          <div>
            <h1>Patron & Customer Profiles</h1>
            <p>Lifetime purchase tracking, wedding trousseau notes, and contact directory.</p>
          </div>
          <button class="sf-btn-primary" onclick="SFAdmin.openAddCustomerModal(false)">+ Add Customer</button>
        </div>

        <div class="sf-card">
          <div class="sf-table-responsive">
            <table class="sf-table">
              <thead>
                <tr>
                  <th>Patron Name</th>
                  <th>Contact Details</th>
                  <th>Location</th>
                  <th>Total Orders</th>
                  <th>Lifetime Spend</th>
                  <th>Patron Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${customers.map(c => `
                  <tr>
                    <td><b>${c.name}</b></td>
                    <td>
                      <a href="tel:${c.phone}">${c.phone}</a>
                      <small style="display:block; color: var(--secondary-text);">${c.email || ''}</small>
                    </td>
                    <td>${c.city || '—'}, ${c.state || ''}</td>
                    <td><b>${c.total_orders || 0}</b></td>
                    <td><b>${formatMoney(c.total_spent)}</b></td>
                    <td style="max-width: 250px;"><small>${c.notes || '—'}</small></td>
                    <td>
                      <a href="https://wa.me/${(c.phone || '').replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(c.name)}!%20Greeting%20from%20Shanmuka%20Fashions." target="_blank" class="sf-btn-sm" style="text-decoration:none;">💬 WhatsApp</a>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sticky Bulk Selection Actions Bar -->
        ${selectedProductIds.size > 0 ? `
          <div class="sf-bulk-actions-bar">
            <div>
              <b>${selectedProductIds.size}</b> saree(s) selected for batch printing.
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button class="sf-btn-outline" style="border-color: #F5EBDD; color: #F5EBDD; padding: 6px 12px; font-size: 12px;" onclick="SFAdmin.clearProductSelection()">Deselect All</button>
              <button class="sf-btn-primary" style="background: var(--antique-gold); color: #FFF; padding: 8px 16px; font-size: 13px;" onclick="SFAdmin.printSelectedProductLabels()">
                🏷️ Print Stickers for Selected (${selectedProductIds.size}) &rarr;
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function openAddCustomerModal(forPOS = false) {
    const container = document.getElementById('sfModalContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="sf-modal-backdrop" onclick="if(event.target===this) SFAdmin.closeModal()">
        <div class="sf-modal-card">
          <div class="sf-modal-header">
            <h3>+ Create Customer Profile</h3>
            <button class="sf-modal-close" onclick="SFAdmin.closeModal()">×</button>
          </div>

          <form id="sfCustForm" onsubmit="event.preventDefault(); SFAdmin.handleSaveCustomer(${forPOS});">
            <div class="sf-form-group">
              <label>Customer Full Name *</label>
              <input type="text" id="fCustName" required placeholder="e.g. Smt. Gayatri Devi">
            </div>

            <div class="sf-form-grid-2">
              <div class="sf-form-group">
                <label>Mobile / WhatsApp *</label>
                <input type="tel" id="fCustPhone" required placeholder="+91 98401 00000">
              </div>

              <div class="sf-form-group">
                <label>Email Address</label>
                <input type="email" id="fCustEmail" placeholder="patron@gmail.com">
              </div>
            </div>

            <div class="sf-form-grid-2">
              <div class="sf-form-group">
                <label>City</label>
                <input type="text" id="fCustCity" value="Hyderabad" placeholder="City">
              </div>

              <div class="sf-form-group">
                <label>State</label>
                <input type="text" id="fCustState" value="Telangana" placeholder="State">
              </div>
            </div>

            <div class="sf-form-group">
              <label>Preference / Styling Notes</label>
              <input type="text" id="fCustNotes" placeholder="e.g. Prefers Kadwa Banarasi, Daughter wedding in Dec">
            </div>

            <div class="sf-modal-actions">
              <button type="button" class="sf-btn-outline" onclick="SFAdmin.closeModal()">Cancel</button>
              <button type="submit" class="sf-btn-primary">Save Profile</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function handleSaveCustomer(forPOS) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const name = document.getElementById('fCustName').value;
    const phone = document.getElementById('fCustPhone').value;
    const email = document.getElementById('fCustEmail').value;
    const city = document.getElementById('fCustCity').value;
    const state = document.getElementById('fCustState').value;
    const notes = document.getElementById('fCustNotes').value;

    const cust = db.saveCustomer({ name, phone, email, city, state, notes });
    if (forPOS) {
      posCustomer.name = cust.name;
      posCustomer.phone = cust.phone;
      posCustomer.city = cust.city;
    }
    closeModal();
    render();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. SUPPLIERS & PURCHASES TAB
  // ═══════════════════════════════════════════════════════════════════════════
  function renderSuppliersTab(db) {
    const suppliers = db.getSuppliers();
    const purchases = db.getPurchases();

    return `
      <div class="sf-view-container">
        <div class="sf-view-header">
          <div>
            <h1>Master Weavers & Supplier Management</h1>
            <p>Direct loom provenance, weaver society profiles, and purchase receipts with stock intake.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="sf-btn-outline" onclick="SFAdmin.openAddSupplierModal()">+ Add Supplier</button>
            <button class="sf-btn-primary" onclick="SFAdmin.openNewPurchaseModal()">+ Receive Purchase Order</button>
          </div>
        </div>

        <!-- Suppliers Cards -->
        <div class="sf-grid-3col" style="margin-bottom: 28px;">
          ${suppliers.map(s => `
            <div class="sf-card">
              <h3 style="margin-bottom: 4px;">${s.name}</h3>
              <small style="color: var(--secondary-text); display: block; margin-bottom: 12px;">${s.city} • GST: ${s.gstin || 'Unregistered'}</small>
              <div style="font-size: 13px; line-height: 1.7; margin-bottom: 14px;">
                <div>Contact: <b>${s.contact_person || '—'}</b></div>
                <div>Phone: <a href="tel:${s.phone}">${s.phone}</a></div>
                <div>Materials: <i>${s.materials_supplied}</i></div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid rgba(167, 121, 80, 0.2); padding-top: 10px;">
                <div>Total Purchased: <b>${formatMoney(s.total_purchased)}</b></div>
                <div style="color: ${s.balance_due > 0 ? '#C62828' : '#2E7D32'}; font-weight: bold;">
                  ${s.balance_due > 0 ? `Due: ${formatMoney(s.balance_due)}` : 'Fully Settled'}
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Purchase Order Intake History -->
        <div class="sf-card">
          <div class="sf-card-header">
            <h3>Purchase Orders & Stock Intake Receipts</h3>
            <span class="sf-card-badge">${purchases.length} Receipts</span>
          </div>
          <div class="sf-table-responsive">
            <table class="sf-table">
              <thead>
                <tr>
                  <th>PO #</th>
                  <th>Date</th>
                  <th>Weaver Society / Supplier</th>
                  <th>Drapes Received</th>
                  <th>Total Amount</th>
                  <th>Amount Paid</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${purchases.map(po => `
                  <tr>
                    <td><b>${po.po_number}</b></td>
                    <td>${formatDate(po.date)}</td>
                    <td><strong>${po.supplier_name}</strong></td>
                    <td>${(po.items || []).map(i => `${i.qty}x ${i.name} (@${formatMoney(i.unit_cost)})`).join(', ')}</td>
                    <td><b>${formatMoney(po.total_amount)}</b></td>
                    <td>${formatMoney(po.amount_paid)}</td>
                    <td style="color: ${po.balance > 0 ? '#C62828' : '#2E7D32'}; font-weight: bold;">${formatMoney(po.balance)}</td>
                    <td><span class="sf-badge badge-payment">${po.payment_status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sticky Bulk Selection Actions Bar -->
        ${selectedProductIds.size > 0 ? `
          <div class="sf-bulk-actions-bar">
            <div>
              <b>${selectedProductIds.size}</b> saree(s) selected for batch printing.
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button class="sf-btn-outline" style="border-color: #F5EBDD; color: #F5EBDD; padding: 6px 12px; font-size: 12px;" onclick="SFAdmin.clearProductSelection()">Deselect All</button>
              <button class="sf-btn-primary" style="background: var(--antique-gold); color: #FFF; padding: 8px 16px; font-size: 13px;" onclick="SFAdmin.printSelectedProductLabels()">
                🏷️ Print Stickers for Selected (${selectedProductIds.size}) &rarr;
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function openAddSupplierModal() {
    const container = document.getElementById('sfModalContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="sf-modal-backdrop" onclick="if(event.target===this) SFAdmin.closeModal()">
        <div class="sf-modal-card">
          <div class="sf-modal-header">
            <h3>+ Register Master Weaver / Supplier</h3>
            <button class="sf-modal-close" onclick="SFAdmin.closeModal()">×</button>
          </div>

          <form id="sfSuppForm" onsubmit="event.preventDefault(); SFAdmin.handleSaveSupplier();">
            <div class="sf-form-group">
              <label>Supplier / Weavers Guild Name *</label>
              <input type="text" id="fSuppName" required placeholder="e.g. Kanchipuram Master Handlooms Society">
            </div>

            <div class="sf-form-grid-2">
              <div class="sf-form-group">
                <label>Contact Person</label>
                <input type="text" id="fSuppContact" placeholder="Shri Master Weaver">
              </div>

              <div class="sf-form-group">
                <label>Phone Number *</label>
                <input type="tel" id="fSuppPhone" required placeholder="+91 94432 00000">
              </div>
            </div>

            <div class="sf-form-grid-2">
              <div class="sf-form-group">
                <label>City & Cluster</label>
                <input type="text" id="fSuppCity" placeholder="e.g. Kanchipuram, Tamil Nadu">
              </div>

              <div class="sf-form-group">
                <label>GSTIN</label>
                <input type="text" id="fSuppGst" placeholder="33AAACK4421M1Z5">
              </div>
            </div>

            <div class="sf-form-group">
              <label>Materials & Weaves Supplied</label>
              <input type="text" id="fSuppMat" placeholder="e.g. Pure Mulberry Silk, Tested Zari, Handloom Korvai">
            </div>

            <div class="sf-modal-actions">
              <button type="button" class="sf-btn-outline" onclick="SFAdmin.closeModal()">Cancel</button>
              <button type="submit" class="sf-btn-primary">Register Supplier</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function handleSaveSupplier() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const name = document.getElementById('fSuppName').value;
    const contact_person = document.getElementById('fSuppContact').value;
    const phone = document.getElementById('fSuppPhone').value;
    const city = document.getElementById('fSuppCity').value;
    const gstin = document.getElementById('fSuppGst').value;
    const materials_supplied = document.getElementById('fSuppMat').value;

    db.saveSupplier({ name, contact_person, phone, city, gstin, materials_supplied });
    closeModal();
    render();
  }

  function openNewPurchaseModal() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const suppliers = db.getSuppliers();
    const products = db.getProducts();
    const container = document.getElementById('sfModalContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="sf-modal-backdrop" onclick="if(event.target===this) SFAdmin.closeModal()">
        <div class="sf-modal-card sf-modal-lg">
          <div class="sf-modal-header">
            <h3>+ Receive Purchase Order & Stock Intake</h3>
            <button class="sf-modal-close" onclick="SFAdmin.closeModal()">×</button>
          </div>

          <form id="sfPOForm" onsubmit="event.preventDefault(); SFAdmin.handleSavePurchaseOrder();">
            <div class="sf-form-grid-2">
              <div class="sf-form-group">
                <label>Supplier / Master Weaver Guild *</label>
                <select id="poSuppId" required>
                  ${suppliers.map(s => `<option value="${s.id}">${s.name} (${s.city})</option>`).join('')}
                </select>
              </div>

              <div class="sf-form-group">
                <label>Weaver Invoice / Delivery Challan Ref</label>
                <input type="text" id="poInvRef" placeholder="e.g. KNC/NOV/26/44">
              </div>
            </div>

            <div class="sf-form-group">
              <label>Select Saree Drape Received *</label>
              <select id="poProdId" required onchange="SFAdmin.autoFillPOCost(this.value)">
                ${products.map(p => `<option value="${p.id}">${p.name} (${p.sku}) — Current Stock: ${p.stock_qty}</option>`).join('')}
              </select>
            </div>

            <div class="sf-form-grid-3">
              <div class="sf-form-group">
                <label>Quantity Received (Units) *</label>
                <input type="number" id="poQty" min="1" value="5" required>
              </div>

              <div class="sf-form-group">
                <label>Unit Purchase Cost (₹) *</label>
                <input type="number" id="poCost" min="1" value="${products[0] ? products[0].purchase_cost : 3800}" required>
              </div>

              <div class="sf-form-group">
                <label>Amount Paid Now (₹)</label>
                <input type="number" id="poPaid" min="0" placeholder="Leave empty for full pay">
              </div>
            </div>

            <div class="sf-form-group">
              <label>Intake Notes / Quality Verification</label>
              <input type="text" id="poNotes" value="Verified Silk Mark & tested zari seal intact. Added to central inventory.">
            </div>

            <div class="sf-modal-actions">
              <button type="button" class="sf-btn-outline" onclick="SFAdmin.closeModal()">Cancel</button>
              <button type="submit" class="sf-btn-primary">Receive Stock & Update Inventory</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function autoFillPOCost(prodId) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const p = db.getProduct(prodId);
    const costInput = document.getElementById('poCost');
    if (p && costInput) costInput.value = p.purchase_cost;
  }

  function handleSavePurchaseOrder() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const supplier_id = document.getElementById('poSuppId').value;
    const invoice_ref = document.getElementById('poInvRef').value;
    const product_id = parseInt(document.getElementById('poProdId').value, 10);
    const qty = parseInt(document.getElementById('poQty').value, 10);
    const unit_cost = parseInt(document.getElementById('poCost').value, 10);
    const amount_paid_val = document.getElementById('poPaid').value;
    const amount_paid = amount_paid_val ? parseInt(amount_paid_val, 10) : (qty * unit_cost);
    const notes = document.getElementById('poNotes').value;

    try {
      db.receivePurchaseOrder({
        supplier_id,
        invoice_ref,
        items: [{ product_id, qty, unit_cost }],
        amount_paid,
        notes
      });
      closeModal();
      render();
    } catch (e) {
      alert('Error receiving purchase order: ' + e.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. EXPENSE MANAGEMENT TAB
  // ═══════════════════════════════════════════════════════════════════════════
  function renderExpensesTab(db) {
    const expenses = db.getExpenses();
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return `
      <div class="sf-view-container">
        <div class="sf-view-header">
          <div>
            <h1>Operating Expense Management</h1>
            <p>Track showroom rent, packaging, courier logistics, salaries, marketing, and upkeep.</p>
          </div>
          <button class="sf-btn-primary" onclick="SFAdmin.openAddExpenseModal()">+ Record New Expense</button>
        </div>

        <div class="sf-kpis-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 24px;">
          <div class="sf-kpi-card">
            <div class="kpi-value">${formatMoney(totalExpenses)}</div>
            <div class="kpi-label">Total Recorded Expenses</div>
          </div>
          <div class="sf-kpi-card">
            <div class="kpi-value">${expenses.length}</div>
            <div class="kpi-label">Expense Transactions</div>
          </div>
          <div class="sf-kpi-card">
            <div class="kpi-value">Rent & Packaging</div>
            <div class="kpi-label">Primary Cost Centers</div>
          </div>
        </div>

        <div class="sf-card">
          <div class="sf-table-responsive">
            <table class="sf-table">
              <thead>
                <tr>
                  <th>Voucher #</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Payment Mode</th>
                  <th>Amount</th>
                  <th>Ref #</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${expenses.map(exp => `
                  <tr>
                    <td><b>${exp.id}</b></td>
                    <td>${formatDate(exp.date)}</td>
                    <td><span class="sf-badge badge-expense">${exp.category}</span></td>
                    <td style="max-width: 320px;">${exp.description}</td>
                    <td>${exp.payment_method}</td>
                    <td><b>${formatMoney(exp.amount)}</b></td>
                    <td><small>${exp.receipt_ref || '—'}</small></td>
                    <td>
                      <button class="sf-btn-icon delete-btn" title="Delete" onclick="SFAdmin.handleDeleteExpense('${exp.id}')">🗑️</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sticky Bulk Selection Actions Bar -->
        ${selectedProductIds.size > 0 ? `
          <div class="sf-bulk-actions-bar">
            <div>
              <b>${selectedProductIds.size}</b> saree(s) selected for batch printing.
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button class="sf-btn-outline" style="border-color: #F5EBDD; color: #F5EBDD; padding: 6px 12px; font-size: 12px;" onclick="SFAdmin.clearProductSelection()">Deselect All</button>
              <button class="sf-btn-primary" style="background: var(--antique-gold); color: #FFF; padding: 8px 16px; font-size: 13px;" onclick="SFAdmin.printSelectedProductLabels()">
                🏷️ Print Stickers for Selected (${selectedProductIds.size}) &rarr;
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function openAddExpenseModal() {
    const container = document.getElementById('sfModalContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="sf-modal-backdrop" onclick="if(event.target===this) SFAdmin.closeModal()">
        <div class="sf-modal-card">
          <div class="sf-modal-header">
            <h3>+ Record Operating Expense</h3>
            <button class="sf-modal-close" onclick="SFAdmin.closeModal()">×</button>
          </div>

          <form id="sfExpForm" onsubmit="event.preventDefault(); SFAdmin.handleSaveExpense();">
            <div class="sf-form-grid-2">
              <div class="sf-form-group">
                <label>Category *</label>
                <select id="expCategory" required>
                  <option value="Rent">Showroom Rent</option>
                  <option value="Packaging">Packaging & Luxury Boxes</option>
                  <option value="Utilities">Electricity & Utilities</option>
                  <option value="Marketing">Marketing & Photography</option>
                  <option value="Shipping">Logistics & Express Courier</option>
                  <option value="Salaries">Artisans & Staff Salaries</option>
                  <option value="Maintenance">Showroom & Loom Upkeep</option>
                  <option value="Other">Other Operating Expense</option>
                </select>
              </div>

              <div class="sf-form-group">
                <label>Amount (₹) *</label>
                <input type="number" id="expAmount" required min="1" placeholder="e.g. 5000">
              </div>
            </div>

            <div class="sf-form-grid-2">
              <div class="sf-form-group">
                <label>Payment Method</label>
                <select id="expPayment">
                  <option value="UPI">UPI Payment</option>
                  <option value="BANK_TRANSFER">Bank NEFT/RTGS</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Credit / Debit Card</option>
                </select>
              </div>

              <div class="sf-form-group">
                <label>Receipt Reference</label>
                <input type="text" id="expRef" placeholder="e.g. UTR-881234">
              </div>
            </div>

            <div class="sf-form-group">
              <label>Detailed Description *</label>
              <input type="text" id="expDesc" required placeholder="e.g. Purchased 100 magnetic gift boxes for bridal trousseau">
            </div>

            <div class="sf-modal-actions">
              <button type="button" class="sf-btn-outline" onclick="SFAdmin.closeModal()">Cancel</button>
              <button type="submit" class="sf-btn-primary">Record Expense</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function handleSaveExpense() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const category = document.getElementById('expCategory').value;
    const amount = document.getElementById('expAmount').value;
    const payment_method = document.getElementById('expPayment').value;
    const receipt_ref = document.getElementById('expRef').value;
    const description = document.getElementById('expDesc').value;

    db.recordExpense({ category, amount, payment_method, receipt_ref, description });
    closeModal();
    render();
  }

  function handleDeleteExpense(id) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    if (confirm('Delete this expense record?')) {
      db.deleteExpense(id);
      render();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. FINANCIAL REPORTS TAB
  // ═══════════════════════════════════════════════════════════════════════════
  function renderReportsTab(db) {
    const reports = db.getFinancialReports(selectedReportFilter);

    return `
      <div class="sf-view-container">
        <div class="sf-view-header">
          <div>
            <h1>Executive Profit & Loss Statement</h1>
            <p>Calculated using verified purchase costs and actual recorded operating expenses.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <select class="sf-select-period" onchange="SFAdmin.handleReportFilterChange(this.value)">
              <option value="all" ${selectedReportFilter === 'all' ? 'selected' : ''}>All Time</option>
              <option value="month" ${selectedReportFilter === 'month' ? 'selected' : ''}>This Month (Nov 2026)</option>
              <option value="week" ${selectedReportFilter === 'week' ? 'selected' : ''}>Past 7 Days</option>
              <option value="today" ${selectedReportFilter === 'today' ? 'selected' : ''}>Today</option>
            </select>
            <button class="sf-btn-outline" onclick="SFAdmin.exportTaxReportCSV()">Export Tax Report</button>
          </div>
        </div>

        <!-- Profit Summary Card -->
        <div class="sf-card" style="margin-bottom: 24px;">
          <h3 style="margin-bottom: 16px;">Financial Accounting Breakdown</h3>
          <div class="pnl-breakdown-table">
            <div class="pnl-row">
              <span>Gross Retail Revenue (Completed Sales)</span>
              <b>${formatMoney(reports.totalRevenue)}</b>
            </div>
            <div class="pnl-row">
              <span>Cost of Goods Sold (COGS - Purchase Cost of Sold Drapes)</span>
              <span style="color: #C62828;">−${formatMoney(reports.totalCogs)}</span>
            </div>
            <div class="pnl-row highlight-sub">
              <span>Gross Profit (Revenue − COGS)</span>
              <b style="color: #2E7D32;">${formatMoney(reports.grossProfit)} (${reports.grossMarginPercent}%)</b>
            </div>
            <div class="pnl-row">
              <span>Total Recorded Operating Expenses</span>
              <span style="color: #C62828;">−${formatMoney(reports.totalOperatingExpenses)}</span>
            </div>
            <div class="pnl-row highlight-final">
              <span>Estimated Net Profit</span>
              <b style="font-size: 20px; color: ${reports.netProfit >= 0 ? '#2E7D32' : '#C62828'};">
                ${formatMoney(reports.netProfit)}
              </b>
            </div>
          </div>
        </div>

        <!-- Categories & Payments Grid -->
        <div class="sf-grid-2col">
          <div class="sf-card">
            <h3>Sales by Handloom Weave Category</h3>
            <div style="margin-top: 16px;">
              ${Object.entries(reports.categorySales).map(([cat, rev]) => `
                <div style="margin-bottom: 12px;">
                  <div style="display: flex; justify-content: space-between; font-size: 13.5px; margin-bottom: 4px;">
                    <span>${cat} Silks</span>
                    <b>${formatMoney(rev)}</b>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" style="width: ${reports.totalRevenue > 0 ? Math.round((rev / reports.totalRevenue) * 100) : 0}%; background: var(--antique-bronze);"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="sf-card">
            <h3>Payment Method Reconciliation</h3>
            <div style="margin-top: 16px;">
              ${Object.entries(reports.paymentMethods).map(([mode, amt]) => `
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(167, 121, 80, 0.15);">
                  <span>${mode} Payments</span>
                  <b>${formatMoney(amt)}</b>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function exportTaxReportCSV() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const orders = db.getOrders().filter(o => o.order_status !== 'CANCELLED');
    const headers = ['Order Number', 'Date', 'Channel', 'Customer Name', 'GSTIN', 'Taxable Amount', 'GST Rate %', 'CGST Amount (2.5%)', 'SGST Amount (2.5%)', 'Total Tax', 'Grand Total'];
    const rows = orders.map(o => {
      const taxable = o.subtotal - o.discount;
      const halfTax = Math.round(o.tax_amount / 2);
      return [
        o.order_number,
        o.created_at.split('T')[0],
        o.channel,
        `"${o.customer_name}"`,
        `"36AAECS9843K1ZN"`,
        taxable,
        o.tax_rate || 5,
        halfTax,
        halfTax,
        o.tax_amount,
        o.total
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Shanmuka_GST_Tax_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. OFFERS & COUPONS TAB
  // ═══════════════════════════════════════════════════════════════════════════
  function renderCouponsTab(db) {
    const coupons = db.getCoupons();

    return `
      <div class="sf-view-container">
        <div class="sf-view-header">
          <div>
            <h1>Promotional Offers & Coupons</h1>
            <p>Create percentage and flat discount codes for online and physical boutique shoppers.</p>
          </div>
          <button class="sf-btn-primary" onclick="SFAdmin.openAddCouponModal()">+ Create New Coupon</button>
        </div>

        <div class="sf-card">
          <div class="sf-table-responsive">
            <table class="sf-table">
              <thead>
                <tr>
                  <th>Coupon Code</th>
                  <th>Discount Type</th>
                  <th>Value</th>
                  <th>Min Order Value</th>
                  <th>Usage (Used / Limit)</th>
                  <th>Validity Period</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${coupons.map(cp => `
                  <tr>
                    <td><b style="font-size: 15px; letter-spacing: 1px;">${cp.code}</b></td>
                    <td>${cp.type === 'PERCENT' ? 'Percentage Off (%)' : 'Flat Discount (₹)'}</td>
                    <td><b>${cp.type === 'PERCENT' ? `${cp.value}%` : formatMoney(cp.value)}</b></td>
                    <td>${formatMoney(cp.min_order)}</td>
                    <td>${cp.usage_count || 0} / ${cp.usage_limit || '∞'}</td>
                    <td>${cp.valid_from} to ${cp.valid_to}</td>
                    <td>
                      <span class="sf-badge ${cp.is_active ? 'badge-ok' : 'badge-disabled'}">
                        ${cp.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <button class="sf-btn-icon delete-btn" title="Delete" onclick="SFAdmin.handleDeleteCoupon('${cp.code}')">🗑️</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sticky Bulk Selection Actions Bar -->
        ${selectedProductIds.size > 0 ? `
          <div class="sf-bulk-actions-bar">
            <div>
              <b>${selectedProductIds.size}</b> saree(s) selected for batch printing.
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button class="sf-btn-outline" style="border-color: #F5EBDD; color: #F5EBDD; padding: 6px 12px; font-size: 12px;" onclick="SFAdmin.clearProductSelection()">Deselect All</button>
              <button class="sf-btn-primary" style="background: var(--antique-gold); color: #FFF; padding: 8px 16px; font-size: 13px;" onclick="SFAdmin.printSelectedProductLabels()">
                🏷️ Print Stickers for Selected (${selectedProductIds.size}) &rarr;
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function openAddCouponModal() {
    const container = document.getElementById('sfModalContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="sf-modal-backdrop" onclick="if(event.target===this) SFAdmin.closeModal()">
        <div class="sf-modal-card">
          <div class="sf-modal-header">
            <h3>+ Create Promotional Coupon</h3>
            <button class="sf-modal-close" onclick="SFAdmin.closeModal()">×</button>
          </div>

          <form id="sfCouponForm" onsubmit="event.preventDefault(); SFAdmin.handleSaveCoupon();">
            <div class="sf-form-grid-2">
              <div class="sf-form-group">
                <label>Coupon Code *</label>
                <input type="text" id="cpCode" required placeholder="e.g. WEDDING2026" style="text-transform: uppercase;">
              </div>

              <div class="sf-form-group">
                <label>Discount Type *</label>
                <select id="cpType">
                  <option value="PERCENT">Percentage Discount (%)</option>
                  <option value="FLAT">Flat Amount (₹)</option>
                </select>
              </div>
            </div>

            <div class="sf-form-grid-2">
              <div class="sf-form-group">
                <label>Discount Value *</label>
                <input type="number" id="cpVal" required min="1" placeholder="e.g. 10 for 10% or 1000 for ₹1000">
              </div>

              <div class="sf-form-group">
                <label>Minimum Order Value (₹)</label>
                <input type="number" id="cpMin" value="5000" placeholder="e.g. 5000">
              </div>
            </div>

            <div class="sf-form-grid-2">
              <div class="sf-form-group">
                <label>Usage Limit</label>
                <input type="number" id="cpLimit" value="100" placeholder="e.g. 100">
              </div>

              <div class="sf-form-group">
                <label>Valid Until Date</label>
                <input type="date" id="cpTo" value="2026-12-31">
              </div>
            </div>

            <div class="sf-modal-actions">
              <button type="button" class="sf-btn-outline" onclick="SFAdmin.closeModal()">Cancel</button>
              <button type="submit" class="sf-btn-primary">Create Coupon</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function handleSaveCoupon() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const code = document.getElementById('cpCode').value;
    const type = document.getElementById('cpType').value;
    const value = document.getElementById('cpVal').value;
    const min_order = document.getElementById('cpMin').value;
    const usage_limit = document.getElementById('cpLimit').value;
    const valid_to = document.getElementById('cpTo').value;

    db.saveCoupon({ code, type, value, min_order, usage_limit, valid_to });
    closeModal();
    render();
  }

  function handleDeleteCoupon(code) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    if (confirm(`Delete coupon "${code}"?`)) {
      db.deleteCoupon(code);
      render();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. WEBSITE CONTENT MANAGEMENT (CMS) TAB
  // ═══════════════════════════════════════════════════════════════════════════
  function renderCMSTab(db) {
    const cms = db.getCMS();

    return `
      <div class="sf-view-container">
        <div class="sf-view-header">
          <div>
            <h1>Website Content Management (CMS)</h1>
            <p>Update homepage copy, hero video, announcement bar, and boutique details without editing code.</p>
          </div>
          <button class="sf-btn-primary" onclick="SFAdmin.saveCMSChanges()">Save & Publish to Storefront</button>
        </div>

        <div class="sf-card" style="margin-bottom: 24px;">
          <h3>Homepage Top Announcement Bar</h3>
          <div class="sf-form-group" style="margin-top: 12px;">
            <label>Announcement Bar Text</label>
            <input type="text" id="cmsAnnounce" value="${cms.announcement_bar || ''}">
          </div>
        </div>

        <div class="sf-card" style="margin-bottom: 24px;">
          <h3>Campaign Hero Video & Headlines</h3>
          <div class="sf-form-grid-2" style="margin-top: 12px;">
            <div class="sf-form-group">
              <label>Hero Eyebrow Text</label>
              <input type="text" id="cmsHeroEyebrow" value="${cms.hero_eyebrow || ''}">
            </div>
            <div class="sf-form-group">
              <label>Cinematic Video Asset Path</label>
              <input type="text" id="cmsHeroVideo" value="${cms.hero_video || ''}">
            </div>
          </div>

          <div class="sf-form-group">
            <label>Hero Main Headline</label>
            <input type="text" id="cmsHeroHeading" value="${cms.hero_heading || ''}">
          </div>

          <div class="sf-form-group">
            <label>Hero Subtitle / Tagline</label>
            <input type="text" id="cmsHeroTagline" value="${cms.hero_tagline || ''}">
          </div>

          <div class="sf-form-group">
            <label>Hero Campaign Narrative</label>
            <textarea id="cmsHeroNarrative" rows="2">${cms.hero_narrative || ''}</textarea>
          </div>
        </div>

        <div class="sf-card">
          <h3>Boutique Showroom Contact & Story</h3>
          <div class="sf-form-grid-2" style="margin-top: 12px;">
            <div class="sf-form-group">
              <label>WhatsApp Concierge Number</label>
              <input type="text" id="cmsWa" value="${cms.whatsapp_number || '9542156929'}">
            </div>
            <div class="sf-form-group">
              <label>Direct Phone Number</label>
              <input type="text" id="cmsPhone" value="${cms.phone_display || '+91 95421 56929'}">
            </div>
          </div>

          <div class="sf-form-group">
            <label>Flagship Showroom Address</label>
            <input type="text" id="cmsAddress" value="${cms.showroom_address || ''}">
          </div>

          <div class="sf-form-group">
            <label>Living Weaving Traditions Story (Paragraph 1)</label>
            <textarea id="cmsStory1" rows="2">${cms.story_narrative_1 || ''}</textarea>
          </div>
        </div>
      </div>
    `;
  }

  function saveCMSChanges() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const update = {
      announcement_bar: document.getElementById('cmsAnnounce').value,
      hero_eyebrow: document.getElementById('cmsHeroEyebrow').value,
      hero_video: document.getElementById('cmsHeroVideo').value,
      hero_heading: document.getElementById('cmsHeroHeading').value,
      hero_tagline: document.getElementById('cmsHeroTagline').value,
      hero_narrative: document.getElementById('cmsHeroNarrative').value,
      whatsapp_number: document.getElementById('cmsWa').value,
      phone_display: document.getElementById('cmsPhone').value,
      showroom_address: document.getElementById('cmsAddress').value,
      story_narrative_1: document.getElementById('cmsStory1').value
    };

    db.saveCMS(update);
    alert('Website content successfully published! Changes are live on the storefront.');
    render();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. INQUIRIES & REVIEWS TAB
  // ═══════════════════════════════════════════════════════════════════════════
  function renderEnquiriesTab(db) {
    const enquiries = db.getEnquiries();
    const reviews = db.getReviews();

    return `
      <div class="sf-view-container">
        <div class="sf-view-header">
          <div>
            <h1>Patron Styling Inquiries & Reviews</h1>
            <p>Respond to customer WhatsApp requests, styling bookings, and moderate product reviews.</p>
          </div>
        </div>

        <div class="sf-card" style="margin-bottom: 24px;">
          <div class="sf-card-header">
            <h3>Patron Inquiries (${enquiries.length})</h3>
          </div>
          <div class="sf-table-responsive">
            <table class="sf-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Phone / WhatsApp</th>
                  <th>Source</th>
                  <th>Message / Inquiry</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${enquiries.map(eq => `
                  <tr>
                    <td>${formatDate(eq.date)}</td>
                    <td><strong>${eq.name}</strong></td>
                    <td><a href="tel:${eq.phone}">${eq.phone}</a></td>
                    <td><span class="sf-badge badge-payment">${eq.source}</span></td>
                    <td style="max-width: 350px;">${eq.message}</td>
                    <td>
                      <select onchange="SFAdmin.handleEnquiryStatusChange('${eq.id}', this.value)" class="sf-table-select">
                        <option value="NEW" ${eq.status === 'NEW' ? 'selected' : ''}>NEW</option>
                        <option value="IN_PROGRESS" ${eq.status === 'IN_PROGRESS' ? 'selected' : ''}>IN_PROGRESS</option>
                        <option value="RESOLVED" ${eq.status === 'RESOLVED' ? 'selected' : ''}>RESOLVED</option>
                      </select>
                    </td>
                    <td>
                      <a href="https://wa.me/${(eq.phone || '').replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(eq.name)},%20thank%20you%20for%20contacting%20Shanmuka%20Fashions!" target="_blank" class="sf-btn-sm" style="text-decoration:none;">Reply WhatsApp &rarr;</a>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="sf-card">
          <div class="sf-card-header">
            <h3>Verified Patron Product Reviews (${reviews.length})</h3>
          </div>
          <div class="sf-table-responsive">
            <table class="sf-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patron</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${reviews.map(r => `
                  <tr>
                    <td>${r.date}</td>
                    <td><strong>${r.customer_name}</strong></td>
                    <td>⭐⭐⭐⭐⭐ (${r.rating}/5)</td>
                    <td>${r.review}</td>
                    <td><span class="sf-badge badge-ok">${r.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sticky Bulk Selection Actions Bar -->
        ${selectedProductIds.size > 0 ? `
          <div class="sf-bulk-actions-bar">
            <div>
              <b>${selectedProductIds.size}</b> saree(s) selected for batch printing.
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button class="sf-btn-outline" style="border-color: #F5EBDD; color: #F5EBDD; padding: 6px 12px; font-size: 12px;" onclick="SFAdmin.clearProductSelection()">Deselect All</button>
              <button class="sf-btn-primary" style="background: var(--antique-gold); color: #FFF; padding: 8px 16px; font-size: 13px;" onclick="SFAdmin.printSelectedProductLabels()">
                🏷️ Print Stickers for Selected (${selectedProductIds.size}) &rarr;
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function handleEnquiryStatusChange(id, status) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    db.updateEnquiryStatus(id, status);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. STORE SETTINGS & DATABASE BACKUP TAB
  // ═══════════════════════════════════════════════════════════════════════════
  function renderSettingsTab(db) {
    const s = db.getSettings();

    return `
      <div class="sf-view-container">
        <div class="sf-view-header">
          <div>
            <h1>Boutique Settings & Data Integrity</h1>
            <p>Business tax profile, GST configuration, database export and factory reset tools.</p>
          </div>
          <button class="sf-btn-primary" onclick="SFAdmin.saveStoreSettings()">Save Settings</button>
        </div>

        <div class="sf-card" style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3>Thermal Barcode Label Printer Configuration</h3>
              <p style="color: var(--secondary-text); font-size: 12px; margin: 2px 0 0 0;">
                Configure hardware connection, label roll dimensions, and printer command languages (TSC, Zebra, Xprinter, TVS).
              </p>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="sf-btn-outline" onclick="SFAdmin.runPrinterCalibrationTest()">🧪 Calibration Test Print</button>
              <button class="sf-btn-primary" onclick="SFAdmin.savePrinterSettings()">Save Printer Profile</button>
            </div>
          </div>

          ${(() => {
            const pConf = db.getPrinterConfig();
            return `
              <div class="sf-form-grid-3" style="margin-top: 16px;">
                <div class="sf-form-group">
                  <label>Printer Name / Model</label>
                  <input type="text" id="pConfName" value="${pConf.printer_name || 'Thermal Label Printer'}" placeholder="e.g. TSC TE244 / Zebra ZD220">
                </div>

                <div class="sf-form-group">
                  <label>Connection Interface</label>
                  <select id="pConfConn">
                    <option value="BROWSER_DIRECT" ${pConf.connection_type === 'BROWSER_DIRECT' ? 'selected' : ''}>Browser Direct (Standard OS Thermal Driver)</option>
                    <option value="WEB_USB" ${pConf.connection_type === 'WEB_USB' ? 'selected' : ''}>WebUSB (Direct Raw Device Access)</option>
                    <option value="WEB_SERIAL" ${pConf.connection_type === 'WEB_SERIAL' ? 'selected' : ''}>Web Serial / COM Port</option>
                    <option value="NETWORK" ${pConf.connection_type === 'NETWORK' ? 'selected' : ''}>Network IP / JetDirect / QZ Tray</option>
                  </select>
                </div>

                <div class="sf-form-group">
                  <label>Printer Command Language</label>
                  <select id="pConfLang">
                    <option value="BROWSER_PDF" ${pConf.printer_language === 'BROWSER_PDF' ? 'selected' : ''}>Browser Print (100% Scale Millimeter CSS)</option>
                    <option value="TSPL" ${pConf.printer_language === 'TSPL' ? 'selected' : ''}>TSPL-II (TSC, Xprinter, TVS, Godex)</option>
                    <option value="ZPL" ${pConf.printer_language === 'ZPL' ? 'selected' : ''}>ZPL-II (Zebra Technologies)</option>
                  </select>
                </div>
              </div>

              <div class="sf-form-grid-3">
                <div class="sf-form-group">
                  <label>Default Label Width (mm)</label>
                  <input type="number" id="pConfWidth" value="${pConf.sticker_width || 50}" min="20" max="110">
                </div>

                <div class="sf-form-group">
                  <label>Default Label Height (mm)</label>
                  <input type="number" id="pConfHeight" value="${pConf.sticker_height || 30}" min="15" max="150">
                </div>

                <div class="sf-form-group">
                  <label>Label Gap / Sensor Notch (mm)</label>
                  <input type="number" id="pConfGap" value="${pConf.label_gap || 3}" min="0" max="10">
                </div>
              </div>

              <div class="sf-form-grid-2">
                <div class="sf-form-group">
                  <label>Thermal Darkness / Heat (1-15)</label>
                  <input type="range" id="pConfDarkness" value="${pConf.print_darkness || 10}" min="1" max="15" oninput="document.getElementById('darknessVal').textContent = this.value">
                  <small style="color: var(--secondary-text);">Current Darkness: <b id="darknessVal">${pConf.print_darkness || 10}</b> (higher = darker barcodes)</small>
                </div>

                <div class="sf-form-group">
                  <label>Print Speed</label>
                  <select id="pConfSpeed">
                    <option value="2" ${pConf.print_speed === 2 ? 'selected' : ''}>2.0 ips (Highest Precision for Silk Tags)</option>
                    <option value="3" ${pConf.print_speed === 3 ? 'selected' : ''}>3.0 ips (Recommended Balanced)</option>
                    <option value="4" ${pConf.print_speed === 4 ? 'selected' : ''}>4.0 ips (High Volume Fast)</option>
                    <option value="5" ${pConf.print_speed === 5 ? 'selected' : ''}>5.0 ips (Draft Speed)</option>
                  </select>
                </div>
              </div>
            `;
          })()}
        </div>

        <div class="sf-card" style="margin-bottom: 24px;">
          <h3>Commercial Business Profile</h3>
          <div class="sf-form-grid-2" style="margin-top: 12px;">
            <div class="sf-form-group">
              <label>Business Name</label>
              <input type="text" id="sName" value="${s.store_name || ''}">
            </div>
            <div class="sf-form-group">
              <label>GSTIN Number</label>
              <input type="text" id="sGstin" value="${s.gstin || ''}">
            </div>
          </div>

          <div class="sf-form-grid-2">
            <div class="sf-form-group">
              <label>Default Handloom GST %</label>
              <input type="number" id="sGstRate" value="${s.default_gst_percent || 5}">
            </div>
            <div class="sf-form-group">
              <label>Complimentary Express Shipping Threshold (₹)</label>
              <input type="number" id="sFreeShip" value="${s.free_shipping_threshold || 15000}">
            </div>
          </div>
        </div>

        <div class="sf-card" style="margin-bottom: 24px;">
          <h3>Database Backup & Recovery</h3>
          <p style="color: var(--secondary-text); margin-bottom: 16px;">Download a complete snapshot of all products, inventory ledgers, orders, and customer records in JSON format.</p>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button class="sf-btn-outline" onclick="SFAdmin.exportDatabaseBackup()">📥 Download Database Backup (JSON)</button>
            <label class="sf-btn-outline" style="cursor: pointer;">
              📤 Restore from JSON Backup
              <input type="file" accept=".json" onchange="SFAdmin.importDatabaseBackup(event)" style="display: none;">
            </label>
            <button class="sf-btn-outline delete-btn" onclick="SFAdmin.resetDatabaseToFactory()">🧹 Purge All Mock Data & Reset Clean Database</button>
          </div>
        </div>
      </div>
    `;
  }

  function saveStoreSettings() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const update = {
      store_name: document.getElementById('sName').value,
      gstin: document.getElementById('sGstin').value,
      default_gst_percent: parseInt(document.getElementById('sGstRate').value, 10),
      free_shipping_threshold: parseInt(document.getElementById('sFreeShip').value, 10)
    };
    db.saveSettings(update);
    alert('Store settings successfully updated.');
    render();
  }

  function exportDatabaseBackup() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const json = db.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Shanmuka_Fashions_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importDatabaseBackup(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
        db.importJSON(evt.target.result);
        alert('Database restored successfully!');
        render();
      } catch (err) {
        alert('Import Error: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  function resetDatabaseToFactory() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    if (confirm('Permanently wipe all legacy cache and reset to a clean, empty production database?')) {
      db.resetToEmptyState();
      try {
        localStorage.clear();
      } catch (e) {}
      alert('Database successfully reset to clean production state (zero mock data).');
      render();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRINTABLE INVOICE / RECEIPT GENERATOR
  // ═══════════════════════════════════════════════════════════════════════════
  function openInvoicePrintModal(orderId) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const order = db.getOrder(orderId);
    if (!order) return;
    const s = db.getSettings();
    const container = document.getElementById('sfModalContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="sf-modal-backdrop" onclick="if(event.target===this) SFAdmin.closeModal()">
        <div class="sf-modal-card sf-modal-lg printable-invoice-modal">
          <div class="sf-modal-header no-print">
            <h3>Tax Invoice & Receipt</h3>
            <div style="display: flex; gap: 8px;">
              <button class="sf-btn-primary" onclick="window.print()">🖨️ Print Invoice</button>
              <button class="sf-modal-close" onclick="SFAdmin.closeModal()">×</button>
            </div>
          </div>

          <!-- Printable Area -->
          <div class="printable-invoice-body" id="printableInvoice">
            <div class="invoice-brand-row">
              <div>
                <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #3B2B25; margin-bottom: 2px;">SHANMUKA FASHIONS</h2>
                <div style="font-size: 11px; letter-spacing: 1px; color: #A77950; text-transform: uppercase;">Sarees & More • Handloom Heritage Atelier</div>
                <div style="font-size: 11px; color: #666; margin-top: 4px;">Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033</div>
                <div style="font-size: 11px; color: #666;">GSTIN: <b>${s.gstin}</b> • WhatsApp: <b>${s.whatsapp}</b></div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 18px; font-weight: bold; color: #3B2B25;">TAX INVOICE</div>
                <div style="font-size: 13px; font-weight: bold; margin-top: 4px;"># ${order.order_number}</div>
                <div style="font-size: 11px; color: #666;">Date: ${formatDate(order.created_at)}</div>
                <div style="font-size: 11px; color: #666;">Channel: <b>${order.channel === 'POS' ? 'Boutique POS' : 'Online Store'}</b></div>
              </div>
            </div>

            <hr style="border: 0; border-top: 1px solid #E5D7C5; margin: 16px 0;">

            <div class="invoice-customer-row" style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 16px;">
              <div>
                <b>Billed To:</b>
                <div style="font-size: 13px; font-weight: bold; margin-top: 2px;">${order.customer_name}</div>
                <div>Phone: ${order.customer_phone || '—'}</div>
                <div>Address: ${order.delivery_address?.street || 'Showroom Delivery'}, ${order.delivery_address?.city || ''}</div>
              </div>
              <div style="text-align: right;">
                <b>Payment Information:</b>
                <div>Mode: <b>${order.payment_method}</b></div>
                <div>Status: <b>${order.payment_status}</b></div>
                <div>Reference: <small>${order.payment_reference || order.order_number}</small></div>
              </div>
            </div>

            <table class="invoice-table" style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px;">
              <thead>
                <tr style="background: #F5EBDD; border-bottom: 1px solid #A77950;">
                  <th style="padding: 8px; text-align: left;">S.No</th>
                  <th style="padding: 8px; text-align: left;">Saree Description & SKU</th>
                  <th style="padding: 8px; text-align: center;">HSN</th>
                  <th style="padding: 8px; text-align: right;">Rate</th>
                  <th style="padding: 8px; text-align: center;">Qty</th>
                  <th style="padding: 8px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${(order.items || []).map((it, idx) => `
                  <tr style="border-bottom: 1px solid #EEE;">
                    <td style="padding: 8px;">${idx + 1}</td>
                    <td style="padding: 8px;">
                      <b>${it.name}</b>
                      <small style="display: block; color: #666;">SKU: ${it.sku}</small>
                    </td>
                    <td style="padding: 8px; text-align: center;">5007</td>
                    <td style="padding: 8px; text-align: right;">${formatMoney(it.price)}</td>
                    <td style="padding: 8px; text-align: center;">${it.qty}</td>
                    <td style="padding: 8px; text-align: right;"><b>${formatMoney(it.total)}</b></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
              <div style="width: 240px; font-size: 12px; line-height: 1.8;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Subtotal:</span>
                  <b>${formatMoney(order.subtotal)}</b>
                </div>
                ${order.discount > 0 ? `
                  <div style="display: flex; justify-content: space-between; color: #C62828;">
                    <span>Discount:</span>
                    <span>−${formatMoney(order.discount)}</span>
                  </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between;">
                  <span>CGST (2.5%):</span>
                  <span>${formatMoney(Math.round(order.tax_amount / 2))}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>SGST (2.5%):</span>
                  <span>${formatMoney(Math.round(order.tax_amount / 2))}</span>
                </div>
                ${order.shipping_charges > 0 ? `
                  <div style="display: flex; justify-content: space-between;">
                    <span>Shipping:</span>
                    <span>${formatMoney(order.shipping_charges)}</span>
                  </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; border-top: 1px solid #3B2B25; padding-top: 4px; margin-top: 4px;">
                  <span>Grand Total:</span>
                  <span style="color: #3B2B25;">${formatMoney(order.total)}</span>
                </div>
              </div>
            </div>

            <div style="border-top: 1px dashed #A77950; padding-top: 10px; font-size: 10px; color: #666; text-align: center;">
              <div><b>Silk Mark Certified Pure Handloom Guarantee</b></div>
              <div>Exchanges accepted within 7 days with original tag and receipt. No cash refunds.</div>
              <div>Thank you for celebrating traditional Indian textile craftsmanship with Shanmuka Fashions!</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function closeModal() {
    const container = document.getElementById('sfModalContainer');
    if (container) container.innerHTML = '';
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // BARCODE STICKER DESIGNER, BULK PRINTING & HARDWARE PROTOCOLS
  // ═══════════════════════════════════════════════════════════════════════════

  function updateModalBarcodePreview() {
    const codeVal = document.getElementById('fProdBarcode')?.value || document.getElementById('fProdSku')?.value;
    const box = document.getElementById('modalBarcodePreviewBox');
    if (!box || !codeVal) return;
    const bc = typeof SFBarcode !== 'undefined' ? SFBarcode : (typeof require !== 'undefined' ? require('./sf_barcode') : null);
    if (bc) {
      box.innerHTML = bc.generateBarcodeSVG(codeVal, {
        barWidth: 1.2,
        barHeight: 30,
        showText: true,
        fontSize: 9,
        quietZone: 6
      });
    }
  }

  function handleModalCategoryChange(cat, isEdit) {
    if (isEdit) return; // Keep existing barcode intact on edit
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const skuInput = document.getElementById('fProdSku');
    const bcInput = document.getElementById('fProdBarcode');
    if (skuInput) skuInput.value = db.generateNextSku(cat);
    if (bcInput) bcInput.value = db.generateNextBarcode(cat);
    updateModalBarcodePreview();
  }

  function refreshModalSku() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const cat = document.getElementById('fProdCategory')?.value || 'Silk';
    const skuInput = document.getElementById('fProdSku');
    if (skuInput) {
      skuInput.value = db.generateNextSku(cat);
      updateModalBarcodePreview();
    }
  }

  function refreshModalBarcode() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const cat = document.getElementById('fProdCategory')?.value || 'Silk';
    const bcInput = document.getElementById('fProdBarcode');
    if (bcInput) {
      bcInput.value = db.generateNextBarcode(cat);
      updateModalBarcodePreview();
    }
  }

  // ── SELECTION & BULK PRINTING ──
  function toggleSelectAllProducts(chk) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const prods = db.getProducts();
    if (chk.checked) {
      prods.forEach(p => selectedProductIds.add(p.id));
    } else {
      selectedProductIds.clear();
    }
    render();
  }

  function handleProductSelectionChange(id, checked) {
    if (checked) selectedProductIds.add(id);
    else selectedProductIds.delete(id);
    render();
  }

  function clearProductSelection() {
    selectedProductIds.clear();
    render();
  }

  function printSelectedProductLabels() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const selectedProds = db.getProducts().filter(p => selectedProductIds.has(p.id));
    if (!selectedProds.length) {
      alert('Please select at least one saree to print stickers.');
      return;
    }
    openBarcodePrinterModal(selectedProds, { reason: 'Batch Selection Labelling' });
  }

  // ── BARCODE STICKER DESIGNER MODAL ──
  function openBarcodePrinterModal(target, initialOptions = {}) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const container = document.getElementById('sfModalContainer');
    if (!container) return;

    // Resolve target to product or array of products
    let productsList = [];
    if (Array.isArray(target)) {
      productsList = target;
    } else if (typeof target === 'object' && target !== null && target.name) {
      productsList = [target];
    } else {
      const p = db.getProduct(target);
      if (p) productsList = [p];
    }

    if (!productsList.length) {
      alert('No valid saree selected for barcode sticker printing.');
      return;
    }

    activeDesignerTarget = productsList;
    const isMulti = productsList.length > 1;
    const primaryProd = productsList[0];

    // Load saved hardware config as base
    const pConf = db.getPrinterConfig();
    activeDesignerConfig = {
      ...activeDesignerConfig,
      width: pConf.sticker_width || 50,
      height: pConf.sticker_height || 30,
      gap: pConf.label_gap || 3,
      barcodeHeight: pConf.barcode_height || 28,
      fontSize: pConf.font_size || 'normal',
      includeBranding: pConf.include_branding !== false,
      includePrice: pConf.include_price !== false,
      includeMRP: true,
      includeSKU: pConf.include_sku !== false,
      includeCategory: pConf.include_category !== false,
      qtyMode: initialOptions.defaultQty ? 'custom' : (isMulti ? 'stock' : 'one'),
      customQty: initialOptions.defaultQty || 1,
      isReprint: !!initialOptions.isReprint,
      reason: initialOptions.reason || (initialOptions.isReprint ? 'Price/Tag Replacement' : 'Inventory Labelling')
    };

    container.innerHTML = `
      <div class="sf-modal-backdrop" onclick="if(event.target===this) SFAdmin.closeModal()">
        <div class="sf-modal-card sf-modal-xl">
          <div class="sf-modal-header">
            <div>
              <h3>${isMulti ? `Batch Thermal Sticker Printing (${productsList.length} Sarees)` : `Barcode Sticker Designer: ${primaryProd.name}`}</h3>
              <p style="margin: 0; font-size: 12px; color: var(--secondary-text);">
                ${isMulti ? `Preparing thermal labels for ${productsList.length} selected drapes.` : `SKU: ${primaryProd.sku} • Barcode: ${primaryProd.barcode} • Stock: ${primaryProd.stock_qty} pcs`}
              </p>
            </div>
            <button class="sf-modal-close" onclick="SFAdmin.closeModal()">×</button>
          </div>

          <div class="sf-designer-body">
            <!-- Left Config Controls -->
            <div class="sf-designer-controls">
              <div class="sf-designer-section">
                <label class="sf-designer-label">Sticker Dimensions Preset</label>
                <div class="sf-dimension-presets">
                  <button class="sf-dim-btn ${activeDesignerConfig.width === 50 && activeDesignerConfig.height === 30 ? 'active' : ''}" onclick="SFAdmin.setStickerPreset(50, 30, this)">50 × 30 mm (Standard)</button>
                  <button class="sf-dim-btn ${activeDesignerConfig.width === 50 && activeDesignerConfig.height === 25 ? 'active' : ''}" onclick="SFAdmin.setStickerPreset(50, 25, this)">50 × 25 mm (Slim)</button>
                  <button class="sf-dim-btn ${activeDesignerConfig.width === 40 && activeDesignerConfig.height === 30 ? 'active' : ''}" onclick="SFAdmin.setStickerPreset(40, 30, this)">40 × 30 mm (Compact)</button>
                  <button class="sf-dim-btn" onclick="SFAdmin.setStickerPreset('custom', 0, this)">Custom Size</button>
                </div>

                <div id="customDimRow" class="sf-form-grid-2" style="display: none; margin-top: 8px;">
                  <div class="sf-form-group">
                    <label>Width (mm)</label>
                    <input type="number" id="lblWidth" value="${activeDesignerConfig.width}" min="20" max="110" oninput="SFAdmin.updateBarcodeStickerPreview()">
                  </div>
                  <div class="sf-form-group">
                    <label>Height (mm)</label>
                    <input type="number" id="lblHeight" value="${activeDesignerConfig.height}" min="15" max="150" oninput="SFAdmin.updateBarcodeStickerPreview()">
                  </div>
                </div>
              </div>

              <div class="sf-designer-section">
                <label class="sf-designer-label">Fields Displayed on Label</label>
                <div class="sf-checkbox-grid">
                  <label class="sf-checkbox-item"><input type="checkbox" id="lblIncBrand" ${activeDesignerConfig.includeBranding ? 'checked' : ''} onchange="SFAdmin.updateBarcodeStickerPreview()"> Brand Name</label>
                  <label class="sf-checkbox-item"><input type="checkbox" id="lblIncTitle" checked onchange="SFAdmin.updateBarcodeStickerPreview()"> Saree Title</label>
                  <label class="sf-checkbox-item"><input type="checkbox" id="lblIncPrice" ${activeDesignerConfig.includePrice ? 'checked' : ''} onchange="SFAdmin.updateBarcodeStickerPreview()"> Selling Price (₹)</label>
                  <label class="sf-checkbox-item"><input type="checkbox" id="lblIncMRP" ${activeDesignerConfig.includeMRP ? 'checked' : ''} onchange="SFAdmin.updateBarcodeStickerPreview()"> Original MRP</label>
                  <label class="sf-checkbox-item"><input type="checkbox" id="lblIncSKU" ${activeDesignerConfig.includeSKU ? 'checked' : ''} onchange="SFAdmin.updateBarcodeStickerPreview()"> Unique SKU</label>
                  <label class="sf-checkbox-item"><input type="checkbox" id="lblIncCategory" ${activeDesignerConfig.includeCategory ? 'checked' : ''} onchange="SFAdmin.updateBarcodeStickerPreview()"> Category & Color</label>
                </div>
              </div>

              <div class="sf-designer-section">
                <label class="sf-designer-label">Typography & Barcode Sizing</label>
                <div class="sf-form-grid-2">
                  <div class="sf-form-group">
                    <label>Font Scale</label>
                    <select id="lblFontSize" onchange="SFAdmin.updateBarcodeStickerPreview()">
                      <option value="compact" ${activeDesignerConfig.fontSize === 'compact' ? 'selected' : ''}>Compact (Fine Print)</option>
                      <option value="normal" ${activeDesignerConfig.fontSize === 'normal' ? 'selected' : ''}>Normal (Standard)</option>
                      <option value="large" ${activeDesignerConfig.fontSize === 'large' ? 'selected' : ''}>Large (High Legibility)</option>
                    </select>
                  </div>
                  <div class="sf-form-group">
                    <label>Barcode Height: <span id="lblBcHeightVal">${activeDesignerConfig.barcodeHeight}px</span></label>
                    <input type="range" id="lblBcHeight" min="18" max="42" value="${activeDesignerConfig.barcodeHeight}" oninput="SFAdmin.updateBarcodeStickerPreview()">
                  </div>
                </div>
              </div>

              <div class="sf-designer-section">
                <label class="sf-designer-label">Print Quantities</label>
                <div class="sf-qty-selector">
                  <label><input type="radio" name="lblQtyMode" value="one" ${activeDesignerConfig.qtyMode === 'one' ? 'checked' : ''} onchange="SFAdmin.handleQtyModeChange(this.value)"> 1 Sticker each</label>
                  <label><input type="radio" name="lblQtyMode" value="stock" ${activeDesignerConfig.qtyMode === 'stock' ? 'checked' : ''} onchange="SFAdmin.handleQtyModeChange(this.value)"> 1 per Stock Unit</label>
                  <label><input type="radio" name="lblQtyMode" value="custom" ${activeDesignerConfig.qtyMode === 'custom' ? 'checked' : ''} onchange="SFAdmin.handleQtyModeChange(this.value)"> Custom</label>
                  <input type="number" id="lblCustomQty" value="${activeDesignerConfig.customQty}" min="1" max="1000" style="width: 70px; ${activeDesignerConfig.qtyMode === 'custom' ? '' : 'display: none;'}" oninput="SFAdmin.updateQtyDisplay()">
                </div>
                <div style="font-size: 12px; color: var(--secondary-text); margin-top: 6px;">
                  Total labels to dispatch: <b id="lblTotalPrintCount" style="color: var(--espresso-brown);">1</b> label(s)
                </div>
              </div>
            </div>

            <!-- Right Live Preview & Print Dispatches -->
            <div class="sf-designer-preview-pane">
              <div class="sf-preview-header">
                <span>True-Scale Preview: <b id="lblPreviewDimText">${activeDesignerConfig.width} × ${activeDesignerConfig.height} mm</b></span>
                <div class="sf-zoom-controls">
                  <button class="sf-zoom-btn ${activeDesignerConfig.zoom === 1.0 ? 'active' : ''}" onclick="SFAdmin.setPreviewZoom(1.0)">100%</button>
                  <button class="sf-zoom-btn ${activeDesignerConfig.zoom === 1.5 ? 'active' : ''}" onclick="SFAdmin.setPreviewZoom(1.5)">150%</button>
                  <button class="sf-zoom-btn ${activeDesignerConfig.zoom === 2.0 ? 'active' : ''}" onclick="SFAdmin.setPreviewZoom(2.0)">200%</button>
                </div>
              </div>

              <!-- Physical Scaled Preview Area -->
              <div class="sf-preview-canvas-wrap">
                <div id="sfStickerLivePreview" class="sf-sticker-preview-holder"></div>
              </div>

              <!-- Print Action Buttons -->
              <div class="sf-designer-actions">
                <button class="sf-btn-primary" onclick="SFAdmin.triggerPrintStickers()" style="flex: 2; justify-content: center; font-size: 13.5px; padding: 12px 18px;">
                  🖨️ Direct Browser Print (100% Thermal)
                </button>
                <button class="sf-btn-outline" onclick="SFAdmin.downloadTSPLFile()" title="Download TSPL command file for TSC / Xprinter / TVS" style="flex: 1;">
                  💾 TSPL
                </button>
                <button class="sf-btn-outline" onclick="SFAdmin.downloadZPLFile()" title="Download ZPL command file for Zebra" style="flex: 1;">
                  💾 ZPL
                </button>
                <button class="sf-btn-outline" onclick="SFAdmin.copyPrinterCode()" title="Copy raw command string to clipboard">
                  📋 Copy Code
                </button>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-size: 11.5px; color: var(--secondary-text);">
                <span>Printer Engine: <b>Browser 100% Vector Print / ESC-POS / TSPL / ZPL</b></span>
                <a href="javascript:void(0)" onclick="SFAdmin.triggerTestPrintSample()" style="color: var(--antique-gold); text-decoration: underline; font-weight: 600;">🧪 Print 1 Test Sample</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    updateBarcodeStickerPreview();
  }

  function setStickerPreset(w, h, btn) {
    document.querySelectorAll('.sf-dim-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const customRow = document.getElementById('customDimRow');

    if (w === 'custom') {
      if (customRow) customRow.style.display = 'grid';
    } else {
      if (customRow) customRow.style.display = 'none';
      activeDesignerConfig.width = w;
      activeDesignerConfig.height = h;
    }
    updateBarcodeStickerPreview();
  }

  function setPreviewZoom(zoom) {
    activeDesignerConfig.zoom = zoom;
    document.querySelectorAll('.sf-zoom-btn').forEach(b => b.classList.remove('active'));
    event?.target?.classList?.add('active');
    const holder = document.getElementById('sfStickerLivePreview');
    if (holder) {
      holder.style.transform = `scale(${zoom})`;
    }
  }

  function handleQtyModeChange(val) {
    activeDesignerConfig.qtyMode = val;
    const customInput = document.getElementById('lblCustomQty');
    if (customInput) {
      customInput.style.display = val === 'custom' ? 'inline-block' : 'none';
    }
    updateQtyDisplay();
  }

  function updateQtyDisplay() {
    if (!activeDesignerTarget) return;
    const mode = activeDesignerConfig.qtyMode;
    let total = 0;

    if (mode === 'one') {
      total = activeDesignerTarget.length;
    } else if (mode === 'stock') {
      total = activeDesignerTarget.reduce((sum, p) => sum + (p.stock_qty || 1), 0);
    } else {
      const customVal = parseInt(document.getElementById('lblCustomQty')?.value || 1, 10) || 1;
      activeDesignerConfig.customQty = customVal;
      total = customVal * activeDesignerTarget.length;
    }

    const countEl = document.getElementById('lblTotalPrintCount');
    if (countEl) countEl.textContent = total;
  }

  function updateBarcodeStickerPreview() {
    if (!activeDesignerTarget || !activeDesignerTarget.length) return;
    const bc = typeof SFBarcode !== 'undefined' ? SFBarcode : require('./sf_barcode');

    // Read current UI controls
    const w = parseInt(document.getElementById('lblWidth')?.value || activeDesignerConfig.width, 10);
    const h = parseInt(document.getElementById('lblHeight')?.value || activeDesignerConfig.height, 10);
    const bcHeight = parseInt(document.getElementById('lblBcHeight')?.value || 28, 10);
    const fontScale = document.getElementById('lblFontSize')?.value || 'normal';

    activeDesignerConfig.width = w;
    activeDesignerConfig.height = h;
    activeDesignerConfig.barcodeHeight = bcHeight;
    activeDesignerConfig.fontSize = fontScale;
    activeDesignerConfig.includeBranding = !!document.getElementById('lblIncBrand')?.checked;
    activeDesignerConfig.includePrice = !!document.getElementById('lblIncPrice')?.checked;
    activeDesignerConfig.includeMRP = !!document.getElementById('lblIncMRP')?.checked;
    activeDesignerConfig.includeSKU = !!document.getElementById('lblIncSKU')?.checked;
    activeDesignerConfig.includeCategory = !!document.getElementById('lblIncCategory')?.checked;

    const dimText = document.getElementById('lblPreviewDimText');
    if (dimText) dimText.textContent = `${w} × ${h} mm`;
    const bcValText = document.getElementById('lblBcHeightVal');
    if (bcValText) bcValText.textContent = `${bcHeight}px`;

    const holder = document.getElementById('sfStickerLivePreview');
    if (holder) {
      holder.style.transform = `scale(${activeDesignerConfig.zoom})`;
      // Preview with first product in target
      holder.innerHTML = bc.renderStickerHTML(activeDesignerTarget[0], activeDesignerConfig);
    }

    updateQtyDisplay();
  }

  function triggerPrintStickers() {
    if (!activeDesignerTarget || !activeDesignerTarget.length) return;
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const bc = typeof SFBarcode !== 'undefined' ? SFBarcode : require('./sf_barcode');

    const mode = activeDesignerConfig.qtyMode;
    const labelItems = [];

    activeDesignerTarget.forEach(prod => {
      let qty = 1;
      if (mode === 'stock') qty = Math.max(1, prod.stock_qty || 1);
      else if (mode === 'custom') qty = activeDesignerConfig.customQty || 1;

      labelItems.push({ product: prod, quantity: qty });

      // Record in print history
      db.recordPrintHistory({
        productId: prod.id,
        sku: prod.sku,
        barcode: prod.barcode,
        productName: prod.name,
        price: prod.price,
        quantity: qty,
        dimensions: `${activeDesignerConfig.width}x${activeDesignerConfig.height}mm`,
        isReprint: activeDesignerConfig.isReprint,
        reason: activeDesignerConfig.reason,
        adminUser: 'Bhanu (Owner)'
      });
    });

    const totalLabels = labelItems.reduce((sum, item) => sum + item.quantity, 0);

    // Trigger browser print with millimeter @page CSS
    bc.printStickersBrowser(labelItems, activeDesignerConfig);

    toast(`Dispatched ${totalLabels} barcode sticker(s) to thermal printer queue.`);
    closeModal();
    render();
  }

  function triggerTestPrintSample() {
    if (!activeDesignerTarget || !activeDesignerTarget.length) return;
    const bc = typeof SFBarcode !== 'undefined' ? SFBarcode : require('./sf_barcode');
    const testItem = [{ product: activeDesignerTarget[0], quantity: 1 }];
    bc.printStickersBrowser(testItem, activeDesignerConfig);
  }

  function downloadTSPLFile() {
    if (!activeDesignerTarget || !activeDesignerTarget.length) return;
    const bc = typeof SFBarcode !== 'undefined' ? SFBarcode : require('./sf_barcode');
    let tsplContent = '';

    activeDesignerTarget.forEach(p => {
      let qty = 1;
      if (activeDesignerConfig.qtyMode === 'stock') qty = Math.max(1, p.stock_qty || 1);
      else if (activeDesignerConfig.qtyMode === 'custom') qty = activeDesignerConfig.customQty || 1;
      tsplContent += bc.generateTSPL(p, activeDesignerConfig, qty) + '\n';
    });

    const blob = new Blob([tsplContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Shanmuka_TSPL_${activeDesignerTarget[0].sku}.prn`;
    link.click();
    toast('Downloaded TSPL-II printer file.');
  }

  function downloadZPLFile() {
    if (!activeDesignerTarget || !activeDesignerTarget.length) return;
    const bc = typeof SFBarcode !== 'undefined' ? SFBarcode : require('./sf_barcode');
    let zplContent = '';

    activeDesignerTarget.forEach(p => {
      let qty = 1;
      if (activeDesignerConfig.qtyMode === 'stock') qty = Math.max(1, p.stock_qty || 1);
      else if (activeDesignerConfig.qtyMode === 'custom') qty = activeDesignerConfig.customQty || 1;
      zplContent += bc.generateZPL(p, activeDesignerConfig, qty) + '\n';
    });

    const blob = new Blob([zplContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Shanmuka_ZPL_${activeDesignerTarget[0].sku}.zpl`;
    link.click();
    toast('Downloaded ZPL-II Zebra printer file.');
  }

  function copyPrinterCode() {
    if (!activeDesignerTarget || !activeDesignerTarget.length) return;
    const bc = typeof SFBarcode !== 'undefined' ? SFBarcode : require('./sf_barcode');
    const code = bc.generateTSPL(activeDesignerTarget[0], activeDesignerConfig, 1);
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      toast('Copied raw TSPL printer code to clipboard.');
    } else {
      alert('Raw TSPL Code:\n\n' + code);
    }
  }

  // ── BULK PRINTING MODAL BY CATEGORY / STOCK ──
  function openBulkBarcodeModal() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const container = document.getElementById('sfModalContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="sf-modal-backdrop" onclick="if(event.target===this) SFAdmin.closeModal()">
        <div class="sf-modal-card sf-modal-md">
          <div class="sf-modal-header">
            <h3>🏷️ Bulk Barcode Sticker Printing</h3>
            <button class="sf-modal-close" onclick="SFAdmin.closeModal()">×</button>
          </div>

          <div style="padding: 10px 0;">
            <p style="color: var(--secondary-text); font-size: 13px; margin-bottom: 16px;">
              Quickly generate thermal barcode labels in bulk by weave category or central stock status.
            </p>

            <div class="sf-form-group">
              <label>Select Weave Category</label>
              <select id="bulkPrintCat">
                <option value="ALL">All Weave Collections (${db.getProducts().length} Sarees)</option>
                <option value="Kanchipuram">Kanchipuram Pure Silk</option>
                <option value="Banarasi">Banarasi Heritage</option>
                <option value="Organza">Floral Organza</option>
                <option value="Silk">Festive Silk</option>
                <option value="Cotton">Handloom Cotton</option>
                <option value="Designer">Designer Couture</option>
              </select>
            </div>

            <div class="sf-form-group">
              <label>Filter Target Sarees</label>
              <select id="bulkPrintFilter">
                <option value="ALL">All Catalogue Sarees</option>
                <option value="INSTOCK">Only In-Stock Sarees (stock > 0)</option>
                <option value="OUTDATED">Sarees with Outdated Printed Prices</option>
                <option value="NEW">Newly Added Sarees</option>
              </select>
            </div>

            <div class="sf-modal-actions" style="margin-top: 24px;">
              <button type="button" class="sf-btn-outline" onclick="SFAdmin.closeModal()">Cancel</button>
              <button type="button" class="sf-btn-primary" onclick="SFAdmin.handleExecuteBulkPrint()">
                Launch Sticker Designer &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function handleExecuteBulkPrint() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const cat = document.getElementById('bulkPrintCat')?.value || 'ALL';
    const filter = document.getElementById('bulkPrintFilter')?.value || 'ALL';

    let prods = db.getProducts();
    if (cat !== 'ALL') {
      prods = prods.filter(p => p.category.toLowerCase() === cat.toLowerCase());
    }

    if (filter === 'INSTOCK') {
      prods = prods.filter(p => (p.stock_qty || 0) > 0);
    } else if (filter === 'OUTDATED') {
      prods = prods.filter(p => p.price_outdated);
    }

    if (!prods.length) {
      alert('No sarees match the selected bulk criteria.');
      return;
    }

    openBarcodePrinterModal(prods, { reason: `Bulk Print [${cat} - ${filter}]` });
  }

  // ── PRINT HISTORY AUDIT MODAL ──
  function openPrintHistoryModal() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const history = db.getBarcodePrintHistory();
    const container = document.getElementById('sfModalContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="sf-modal-backdrop" onclick="if(event.target===this) SFAdmin.closeModal()">
        <div class="sf-modal-card sf-modal-lg">
          <div class="sf-modal-header">
            <div>
              <h3>📜 Barcode Sticker Printing History</h3>
              <p style="margin: 0; font-size: 11.5px; color: var(--secondary-text);">
                Complete audit trail of all physical label runs with reprint management.
              </p>
            </div>
            <button class="sf-modal-close" onclick="SFAdmin.closeModal()">×</button>
          </div>

          <div style="max-height: 440px; overflow-y: auto; margin-top: 10px;">
            <table class="sf-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Saree & SKU</th>
                  <th>Barcode</th>
                  <th>Printed Price</th>
                  <th>Quantity</th>
                  <th>Size</th>
                  <th>Reason / Type</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${!history.length ? `
                  <tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--secondary-text);">No sticker print runs recorded yet.</td></tr>
                ` : history.map(h => {
                  const prod = db.getProduct(h.product_id);
                  const isPriceChanged = prod && prod.price !== h.price;
                  return `
                    <tr>
                      <td><small>${formatDateTime(h.created_at)}</small></td>
                      <td>
                        <strong>${h.product_name}</strong>
                        <small style="display: block; color: var(--secondary-text);">${h.sku}</small>
                      </td>
                      <td><code>${h.barcode}</code></td>
                      <td>
                        <b>₹${Number(h.price).toLocaleString('en-IN')}</b>
                        ${isPriceChanged ? `<small style="display: block; color: #E65100; font-weight: 600;">Now: ₹${Number(prod.price).toLocaleString('en-IN')}</small>` : ''}
                      </td>
                      <td>${h.quantity} pcs</td>
                      <td><small>${h.sticker_dimensions}</small></td>
                      <td>
                        <span class="sf-badge ${h.is_reprint ? 'badge-status-draft' : 'badge-status-published'}">
                          ${h.is_reprint ? 'Reprint' : 'Original'}
                        </span>
                        <small style="display: block; color: var(--secondary-text);">${h.reason || 'Inventory'}</small>
                      </td>
                      <td style="text-align: right;">
                        <button class="sf-btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="SFAdmin.reprintBarcodeSticker('${h.id}')">
                          🏷️ Reprint
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sticky Bulk Selection Actions Bar -->
        ${selectedProductIds.size > 0 ? `
          <div class="sf-bulk-actions-bar">
            <div>
              <b>${selectedProductIds.size}</b> saree(s) selected for batch printing.
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button class="sf-btn-outline" style="border-color: #F5EBDD; color: #F5EBDD; padding: 6px 12px; font-size: 12px;" onclick="SFAdmin.clearProductSelection()">Deselect All</button>
              <button class="sf-btn-primary" style="background: var(--antique-gold); color: #FFF; padding: 8px 16px; font-size: 13px;" onclick="SFAdmin.printSelectedProductLabels()">
                🏷️ Print Stickers for Selected (${selectedProductIds.size}) &rarr;
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function reprintBarcodeSticker(historyId) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const history = db.getBarcodePrintHistory();
    const item = history.find(h => h.id === historyId);
    if (!item) return;

    openBarcodePrinterModal(item.product_id, {
      defaultQty: item.quantity,
      isReprint: true,
      reason: `Reprint of run ${item.id}`
    });
  }

  // ── PRINTER SETTINGS HANDLERS ──
  function savePrinterSettings() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const updates = {
      printer_name: document.getElementById('pConfName')?.value || 'Thermal Label Printer',
      connection_type: document.getElementById('pConfConn')?.value || 'BROWSER_DIRECT',
      printer_language: document.getElementById('pConfLang')?.value || 'BROWSER_PDF',
      sticker_width: parseInt(document.getElementById('pConfWidth')?.value || 50, 10),
      sticker_height: parseInt(document.getElementById('pConfHeight')?.value || 30, 10),
      label_gap: parseInt(document.getElementById('pConfGap')?.value || 3, 10),
      print_darkness: parseInt(document.getElementById('pConfDarkness')?.value || 10, 10),
      print_speed: parseInt(document.getElementById('pConfSpeed')?.value || 3, 10)
    };

    db.savePrinterConfig(updates);
    toast('Thermal barcode printer profile successfully saved.');
    render();
  }

  function runPrinterCalibrationTest() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const bc = typeof SFBarcode !== 'undefined' ? SFBarcode : require('./sf_barcode');
    const pConf = db.getPrinterConfig();

    const sampleProduct = {
      name: 'Calibration Test Saree',
      sku: 'SF-TEST-001',
      barcode: 'SF26010001',
      price: 9999,
      old: 11999,
      category: 'Test Weave',
      color: 'Sample Gold'
    };

    bc.printStickersBrowser([{ product: sampleProduct, quantity: 1 }], {
      width: pConf.sticker_width || 50,
      height: pConf.sticker_height || 30,
      includeBranding: true,
      includePrice: true,
      includeMRP: true,
      includeSKU: true,
      includeCategory: true
    });
    toast('Sent calibration test label to printer queue.');
  }

  function attachTabEvents(tab, db) {
    // Tab specific keyboard or event attachments
    if (tab === 'pos') {
      const barcodeInput = document.getElementById('posBarcodeInput');
      if (barcodeInput) barcodeInput.focus();
    }
  }

  return {
    render,
    switchTab,
    handleLogin,
    handleLogout,
    handleReportFilterChange,
    filterPOSCategory,
    handlePOSBarcodeKeyDown,
    addPOStoCart,
    changePOSQty,
    removePOSItem,
    clearPOSCart,
    updatePOSCustomer,
    updatePOSDiscount,
    setPOSPaymentMethod,
    updatePOSCashTendered,
    completePOSSale,
    filterProductsTable,
    openAddProductModal,
    openEditProductModal,
    handleSaveProduct,
    handleFileInputChange,
    setCoverImage,
    moveProductImage,
    removeProductImage,
    handleAddImageUrl,
    handleDuplicateProduct,
    handleDeleteProduct,
    exportProductsCSV,
    openStockAdjustmentModal,
    handleSaveStockAdjustment,
    openProductStockHistoryModal,
    filterOrdersTable,
    handleOrderStatusChange,
    openOrderModal,
    saveOrderLogistics,
    openAddCustomerModal,
    handleSaveCustomer,
    openAddSupplierModal,
    handleSaveSupplier,
    openNewPurchaseModal,
    autoFillPOCost,
    handleSavePurchaseOrder,
    openAddExpenseModal,
    handleSaveExpense,
    handleDeleteExpense,
    exportTaxReportCSV,
    openAddCouponModal,
    handleSaveCoupon,
    handleDeleteCoupon,
    saveCMSChanges,
    handleEnquiryStatusChange,
    saveStoreSettings,
    exportDatabaseBackup,
    importDatabaseBackup,
    resetDatabaseToFactory,
    openInvoicePrintModal,
    closeModal,
    updateModalBarcodePreview,
    handleModalCategoryChange,
    refreshModalSku,
    refreshModalBarcode,
    toggleSelectAllProducts,
    handleProductSelectionChange,
    clearProductSelection,
    printSelectedProductLabels,
    openBarcodePrinterModal,
    setStickerPreset,
    setPreviewZoom,
    handleQtyModeChange,
    updateQtyDisplay,
    updateBarcodeStickerPreview,
    triggerPrintStickers,
    triggerTestPrintSample,
    downloadTSPLFile,
    downloadZPLFile,
    copyPrinterCode,
    openBulkBarcodeModal,
    handleExecuteBulkPrint,
    openPrintHistoryModal,
    reprintBarcodeSticker,
    savePrinterSettings,
    runPrinterCalibrationTest
  };
}));

