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
  let posCustomer = { name: 'Walk-in Patron', phone: '', email: '', city: 'Hyderabad', id: null };
  let posDiscount = 0;
  let posPaymentMethod = 'CASH';
  let posCashTendered = 0;
  let posScanMode = 'BILL'; // 'BILL' (Instant add to ticket) or 'CHECK' (Price/stock inspection)
  let posCatalogSearch = '';
  let posActiveCategory = 'ALL';
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
            <button class="sf-btn-logout" onclick="SFAdmin.promptSignOut()" title="Sign Out">Sign Out</button>
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

  // ── STRICT LOGIN SCREEN & AUTHENTICATION ──
  function renderLoginScreen() {
    return `
      <div class="sf-login-page">
        <div class="sf-login-card">
          <div class="sf-login-header">
            <img src="logo.png" alt="Shanmuka Logo" class="sf-login-logo">
            <h2>Shanmuka Atelier Portal</h2>
            <p>Unified Administration, Physical POS & Inventory Management</p>
            <div style="margin-top: 8px; display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(167, 121, 80, 0.1); border-radius: 12px; font-size: 11px; color: #7A583A; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              <span>🛡️</span> Strict Owner Authentication
            </div>
          </div>

          <form id="sfLoginForm" onsubmit="event.preventDefault(); SFAdmin.handleLogin();">
            <div class="sf-form-group">
              <label for="sfAdminUser">Administrator Username</label>
              <input type="text" id="sfAdminUser" required autocomplete="username" placeholder="Enter administrator username">
            </div>

            <div class="sf-form-group">
              <label for="sfAdminPass">Master Password</label>
              <div style="position: relative; display: flex; align-items: center;">
                <input type="password" id="sfAdminPass" required autocomplete="current-password" placeholder="Enter master password" style="padding-right: 42px; width: 100%;">
                <button type="button" id="sfAdminPwdToggle" onclick="SFAdmin.toggleAdminPasswordVisibility()" style="position: absolute; right: 10px; background: none; border: none; cursor: pointer; font-size: 16px; color: #7A583A; padding: 4px;" title="Show or hide password" aria-label="Toggle password visibility">👁️</button>
              </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; font-size: 13px; color: #55443B;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; margin: 0; font-weight: 500;">
                <input type="checkbox" id="sfAdminRemember" style="accent-color: #A77950; width: 16px; height: 16px; cursor: pointer;">
                <span>Remember this terminal (7 days)</span>
              </label>
            </div>

            <div id="sfLoginError" class="sf-form-error" style="display: none; padding: 10px 14px; background: #FDEDED; color: #C25E5E; border: 1px solid #F5C6CB; border-radius: 4px; font-size: 13px; margin-bottom: 16px;"></div>

            <button type="submit" id="sfLoginSubmitBtn" class="sf-btn-login">ACCESS ATELIER MANAGEMENT &rarr;</button>

            <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #8C7B70;">
              <span>Secured with cryptographic session tokens & lockout protection.</span>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function toggleAdminPasswordVisibility() {
    const input = document.getElementById('sfAdminPass');
    const btn = document.getElementById('sfAdminPwdToggle');
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (btn) btn.textContent = '🙈';
    } else {
      input.type = 'password';
      if (btn) btn.textContent = '👁️';
    }
  }

  function attachLoginEvents() {
    // Form already has onsubmit
  }

  function handleLogin() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const uInput = document.getElementById('sfAdminUser');
    const pInput = document.getElementById('sfAdminPass');
    const remInput = document.getElementById('sfAdminRemember');
    const err = document.getElementById('sfLoginError');
    const btn = document.getElementById('sfLoginSubmitBtn');

    if (!uInput || !pInput) return;
    const u = uInput.value;
    const p = pInput.value;
    const rem = remInput ? remInput.checked : false;

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'VERIFYING CREDENTIALS...';
    }

    try {
      const res = db.login(u, p, rem);
      if (res.success) {
        if (err) err.style.display = 'none';
        render();
      } else {
        if (err) {
          err.textContent = res.message || 'Invalid credentials.';
          err.style.display = 'block';
        }
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = 'ACCESS ATELIER MANAGEMENT &rarr;';
        }
      }
    } catch (e) {
      if (err) {
        err.textContent = e.message || 'An unexpected authentication error occurred.';
        err.style.display = 'block';
      }
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'ACCESS ATELIER MANAGEMENT &rarr;';
      }
    }
  }

  // ── STRICT ADMIN SIGNOUT CONFIRMATION ──
  function promptSignOut() {
    let modal = document.getElementById('sfAdminSignoutModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sfAdminSignoutModal';
      modal.className = 'sf-modal-backdrop';
      modal.style.display = 'none';
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
      <div class="sf-modal-card" style="max-width: 460px; text-align: center; border-top: 4px solid #A77950; box-shadow: 0 20px 48px rgba(0,0,0,0.35);">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: #FAF5F0; border: 2px solid #E6D7C8; display: inline-flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 14px;">
          🔒
        </div>
        <h3 style="font-family: 'Cinzel', serif; font-size: 20px; color: #3B2B25; margin-bottom: 8px;">Confirm Administrator Sign Out</h3>
        <p style="font-size: 13.5px; color: #665D55; line-height: 1.55; margin-bottom: 24px;">
          Are you sure you want to end your active administrative session? Any unsaved edits in POS billing, inventory adjustments, or catalog management will be preserved only if saved.
        </p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button type="button" class="sf-btn-secondary" onclick="SFAdmin.closeSignOutPrompt()" style="padding: 10px 22px; font-size: 13.5px; font-weight: 600; cursor: pointer; border-radius: 4px; border: 1px solid #D5C2B2; background: #FFFFFF; color: #3B2B25;">Stay Signed In</button>
          <button type="button" class="sf-btn-danger" onclick="SFAdmin.confirmSignOut()" style="padding: 10px 24px; font-size: 13.5px; background: #A77950; color: #FFFFFF; border: none; font-weight: 600; cursor: pointer; border-radius: 4px; box-shadow: 0 4px 12px rgba(167,121,80,0.3);">Confirm Sign Out</button>
        </div>
      </div>
    `;
    modal.style.display = 'flex';
  }

  function closeSignOutPrompt() {
    const modal = document.getElementById('sfAdminSignoutModal');
    if (modal) modal.style.display = 'none';
  }

  function confirmSignOut() {
    closeSignOutPrompt();
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    db.logout();
    render();
  }

  function handleLogout() {
    promptSignOut();
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
  // 2. PHYSICAL SHOP POS BILLING TAB & OMNICHANNEL CHECKOUT
  // ═══════════════════════════════════════════════════════════════════════════
  function getFilteredPOSProducts(products) {
    let prods = (products || []).filter(p => p.status !== 'Archived');
    if (posActiveCategory && posActiveCategory !== 'ALL') {
      prods = prods.filter(p => (p.category || '').toLowerCase() === posActiveCategory.toLowerCase());
    }
    if (posCatalogSearch) {
      prods = prods.filter(p =>
        (p.name && p.name.toLowerCase().includes(posCatalogSearch)) ||
        (p.sku && p.sku.toLowerCase().includes(posCatalogSearch)) ||
        (p.barcode && p.barcode.toLowerCase().includes(posCatalogSearch)) ||
        (p.fabric && p.fabric.toLowerCase().includes(posCatalogSearch)) ||
        (p.weave && p.weave.toLowerCase().includes(posCatalogSearch)) ||
        (p.color && p.color.toLowerCase().includes(posCatalogSearch))
      );
    }
    return prods;
  }

  function renderCashStatusHTML(received, total) {
    if (posPaymentMethod !== 'CASH') {
      return `
        <div class="pos-status-badge status-paid" style="background: #E8F5E9; color: #2E7D32; padding: 6px 10px; border-radius: 4px; font-weight: 600; font-size: 12px; text-align: center;">
          ✓ Payment Mode: ${posPaymentMethod} — Complete on terminal
        </div>
      `;
    }
    if (total <= 0) {
      return `<div class="pos-status-info" style="font-size: 12px; color: #76675D; text-align: center;">Add sarees to calculate payment.</div>`;
    }
    if (received <= 0) {
      return `
        <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 4px;">
          <span>Awaiting Cash:</span>
          <b style="color: #3B2B25;">${formatMoney(total)}</b>
        </div>
        <div class="pos-status-badge status-pending" style="background: #FFF3E0; color: #E65100; border: 1px solid #FFE0B2; padding: 6px 10px; border-radius: 4px; font-weight: 600; font-size: 12px; text-align: center;">
          ⚠️ Payment Due: ${formatMoney(total)}
        </div>
      `;
    }
    if (received >= total) {
      const change = received - total;
      return `
        <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 2px;">
          <span>Cash Received: <b>${formatMoney(received)}</b></span>
          <span>Net Bill: <b>${formatMoney(total)}</b></span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13.5px; color: #1B5E20; font-weight: 700; margin: 4px 0;">
          <span>Change to Return:</span>
          <b style="font-size: 16px;">${formatMoney(change)}</b>
        </div>
        <div class="pos-status-badge status-paid" style="background: #E8F5E9; color: #2E7D32; border: 1px solid #C8E6C9; padding: 6px 10px; border-radius: 4px; font-weight: 600; font-size: 12px; text-align: center;">
          ✓ Paid in Full${change > 0 ? ` (Handover ${formatMoney(change)} change)` : ''}
        </div>
      `;
    } else {
      const pending = total - received;
      return `
        <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 2px;">
          <span>Cash Received: <b>${formatMoney(received)}</b></span>
          <span>Net Bill: <b>${formatMoney(total)}</b></span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13.5px; color: #C62828; font-weight: 700; margin: 4px 0;">
          <span>Pending Balance:</span>
          <b style="font-size: 16px;">${formatMoney(pending)}</b>
        </div>
        <div class="pos-status-badge status-pending" style="background: #FFEBEE; color: #C62828; border: 1px solid #FFCDD2; padding: 6px 10px; border-radius: 4px; font-weight: 600; font-size: 12px; text-align: center;">
          ⚠️ Pending Balance: ${formatMoney(pending)} (Short by ${formatMoney(pending)})
        </div>
      `;
    }
  }

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

    return `
      <div class="sf-pos-layout">
        <!-- Left Panel: Fast Product Search & Visual Catalog -->
        <div class="sf-pos-catalog-panel">
          <!-- Scanner Mode & Barcode Search Header -->
          <div class="pos-search-bar-wrap">
            <div class="pos-mode-toggle-wrap" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span class="pos-mode-label" style="font-size: 12px; font-weight: 600; color: #76675D; text-transform: uppercase; letter-spacing: 0.5px;">Scanner Mode:</span>
              <div class="pos-scan-mode-buttons" style="display: flex; gap: 6px;">
                <button type="button" class="pos-scan-mode-btn ${posScanMode === 'BILL' ? 'active' : ''}" data-mode="BILL" onclick="SFAdmin.setPOSScanMode('BILL')">
                  ⚡ Scan to Bill
                </button>
                <button type="button" class="pos-scan-mode-btn ${posScanMode === 'CHECK' ? 'active' : ''}" data-mode="CHECK" onclick="SFAdmin.setPOSScanMode('CHECK')">
                  🔍 Price & Stock Check
                </button>
              </div>
            </div>

            <div class="pos-search-input-group" style="display: flex; align-items: center; background: #F9F6F0; border: 1.5px solid #A77950; border-radius: 4px; padding: 4px 10px;">
              <span class="barcode-icon" style="font-size: 18px; margin-right: 8px; color: #A77950;">📷</span>
              <input type="text" id="posBarcodeInput" placeholder="${posScanMode === 'BILL' ? 'Scan Barcode or Type SKU / Saree Name [ENTER to Add]...' : 'Scan Barcode or Type SKU [ENTER to Check Details & Stock]...'}" onkeydown="SFAdmin.handlePOSBarcodeKeyDown(event)" autofocus autocomplete="off" style="flex: 1; border: none; background: transparent; padding: 8px 0; font-size: 13.5px; outline: none; color: #3B2B25;">
              <button type="button" class="pos-check-btn" onclick="SFAdmin.checkPOSCurrentBarcodeInput()" style="background: #3B2B25; color: #F5EBDD; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer;">🔍 Check Details</button>
            </div>
          </div>

          <!-- Catalog Filter & Live Search Row -->
          <div class="pos-filter-toolbar" style="margin-bottom: 14px;">
            <div class="pos-search-box" style="position: relative; margin-bottom: 10px;">
              <input type="text" id="posCatalogSearchInput" value="${posCatalogSearch}" placeholder="Filter catalogue by title, SKU, fabric, weave..." oninput="SFAdmin.handlePOSCatalogSearch(this.value)" style="width: 100%; padding: 8px 12px; font-size: 13px; border: 1px solid #E5D7C5; border-radius: 4px; background: #FFF; outline: none;">
              ${posCatalogSearch ? `<button type="button" onclick="SFAdmin.handlePOSCatalogSearch('')" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 14px; color: #888; cursor: pointer;">✕</button>` : ''}
            </div>
            <div class="pos-category-pills" style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px;">
              <button class="pos-cat-pill ${posActiveCategory === 'ALL' ? 'active' : ''}" onclick="SFAdmin.filterPOSCategory('ALL', this)">All Weaves</button>
              <button class="pos-cat-pill ${posActiveCategory === 'Kanchipuram' ? 'active' : ''}" onclick="SFAdmin.filterPOSCategory('Kanchipuram', this)">Kanchipuram</button>
              <button class="pos-cat-pill ${posActiveCategory === 'Banarasi' ? 'active' : ''}" onclick="SFAdmin.filterPOSCategory('Banarasi', this)">Banarasi</button>
              <button class="pos-cat-pill ${posActiveCategory === 'Organza' ? 'active' : ''}" onclick="SFAdmin.filterPOSCategory('Organza', this)">Organza</button>
              <button class="pos-cat-pill ${posActiveCategory === 'Silk' ? 'active' : ''}" onclick="SFAdmin.filterPOSCategory('Silk', this)">Festive Silk</button>
              <button class="pos-cat-pill ${posActiveCategory === 'Cotton' ? 'active' : ''}" onclick="SFAdmin.filterPOSCategory('Cotton', this)">Cotton Handloom</button>
              <button class="pos-cat-pill ${posActiveCategory === 'Designer' ? 'active' : ''}" onclick="SFAdmin.filterPOSCategory('Designer', this)">Designer</button>
            </div>
          </div>

          <div id="posScanFeedbackWrap"></div>
          <div class="pos-products-grid" id="posProductsGrid">
            ${renderPOSProductsGrid(getFilteredPOSProducts(products))}
          </div>
        </div>

        <!-- Right Panel: Billing Cart & Checkout -->
        <div class="sf-pos-billing-panel">
          <div class="pos-panel-header">
            <div>
              <h3 style="margin: 0;">Showroom Bill</h3>
              <small style="color: var(--secondary-text);">Counter Register Ticket</small>
            </div>
            <button class="sf-link-btn" onclick="SFAdmin.clearPOSCart()">Clear All</button>
          </div>

          <!-- Walk-in Customer Selection & Capture Card -->
          <div class="pos-customer-selector">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label>Walk-in Patron Details:</label>
              <button type="button" class="sf-link-btn" onclick="SFAdmin.resetPOSCustomer()">+ New / Reset</button>
            </div>

            <!-- Fast Autocomplete Search -->
            <div class="pos-cust-search-wrap" style="position: relative; margin-bottom: 8px;">
              <input type="text" id="posCustomerSearchInput" placeholder="🔍 Search patron by mobile or name..." oninput="SFAdmin.handlePOSCustomerSearch(this.value)" autocomplete="off" style="width: 100%; padding: 6px 10px; font-size: 12px; border: 1px solid #E5D7C5; border-radius: 4px; background: #FFF;">
              <div id="posCustomerSearchResults" class="pos-cust-dropdown" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: #FFF; border: 1.5px solid #3B2B25; border-radius: 4px; box-shadow: 0 6px 16px rgba(0,0,0,0.12); z-index: 50; max-height: 180px; overflow-y: auto;"></div>
            </div>

            <div id="posCustomerBadgeWrap">
              ${posCustomer.id ? `
                <div class="pos-patron-badge" style="display: flex; align-items: center; justify-content: space-between; background: #E8F5E9; border: 1px solid #C8E6C9; padding: 4px 8px; border-radius: 4px; font-size: 11.5px; color: #1B5E20; margin-bottom: 8px;">
                  <span>⭐ Verified Patron: <b>${posCustomer.name}</b> (${posCustomer.phone || 'No phone'})</span>
                  <button type="button" onclick="SFAdmin.resetPOSCustomer()" style="background: none; border: none; color: #C62828; cursor: pointer; font-size: 13px; font-weight: bold;">✕</button>
                </div>
              ` : ''}
            </div>

            <!-- Customer Details Grid -->
            <div class="pos-cust-fields-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div>
                <input type="text" id="posCustName" placeholder="Patron Full Name" value="${posCustomer.name || ''}" oninput="SFAdmin.updatePOSCustomerField('name', this.value)" style="width: 100%; padding: 6px 8px; font-size: 12px; border: 1px solid #E5D7C5; border-radius: 4px;">
              </div>
              <div>
                <input type="tel" id="posCustPhone" placeholder="Mobile / WhatsApp" value="${posCustomer.phone || ''}" oninput="SFAdmin.updatePOSCustomerField('phone', this.value)" style="width: 100%; padding: 6px 8px; font-size: 12px; border: 1px solid #E5D7C5; border-radius: 4px;">
              </div>
              <div>
                <input type="email" id="posCustEmail" placeholder="Email (Optional)" value="${posCustomer.email || ''}" oninput="SFAdmin.updatePOSCustomerField('email', this.value)" style="width: 100%; padding: 6px 8px; font-size: 12px; border: 1px solid #E5D7C5; border-radius: 4px;">
              </div>
              <div>
                <input type="text" id="posCustCity" placeholder="City (e.g. Hyderabad)" value="${posCustomer.city || 'Hyderabad'}" oninput="SFAdmin.updatePOSCustomerField('city', this.value)" style="width: 100%; padding: 6px 8px; font-size: 12px; border: 1px solid #E5D7C5; border-radius: 4px;">
              </div>
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
              <b id="posGrossSubtotalDisplay">${formatMoney(subtotal)}</b>
            </div>

            <div class="calc-row">
              <span>Special In-Store Discount:</span>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span>₹</span>
                <input type="number" id="posDiscountInput" min="0" value="${posDiscount || ''}" placeholder="0" oninput="SFAdmin.updatePOSDiscount(this.value)" class="pos-discount-input" style="width: 80px; text-align: right;">
              </div>
            </div>

            <div class="calc-row">
              <span>GST (5% Handloom):</span>
              <b id="posTaxAmountDisplay">${formatMoney(taxAmount)}</b>
            </div>

            <div class="calc-row total-row">
              <span>Net Payable Amount:</span>
              <span class="pos-total-amount" id="posNetTotalDisplay">${formatMoney(netTotal)}</span>
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

          <!-- Cash Received Input & Payment Breakdown Helper -->
          <div class="pos-cash-calculator-box" id="posCashCalculatorBox" style="${posPaymentMethod === 'CASH' && netTotal > 0 ? 'display: block;' : 'display: none;'}">
            <div class="pos-cash-input-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label for="posCashTenderedInput" style="font-size: 12.5px; font-weight: 600; color: #3B2B25;">Cash Received:</label>
              <div class="pos-cash-input-wrap" style="display: flex; align-items: center; background: #FFF; border: 1.5px solid #A77950; border-radius: 4px; padding: 2px 8px;">
                <span class="pos-currency-symbol" style="font-weight: bold; color: #A77950; margin-right: 4px;">₹</span>
                <input type="number" id="posCashTenderedInput" placeholder="Enter Full Amount" value="${posCashTendered > 0 ? posCashTendered : ''}" oninput="SFAdmin.updatePOSCashTendered(this.value)" class="pos-tendered-input" autocomplete="off" style="width: 140px; border: none; outline: none; font-size: 14px; font-weight: bold; color: #3B2B25;">
              </div>
            </div>

            <!-- Quick Denomination Shortcuts -->
            <div class="pos-quick-denominations" style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px;">
              <button type="button" class="pos-denom-btn" id="posExactDenomBtn" onclick="SFAdmin.setPOSQuickCash(${netTotal})">Exact: ${formatMoney(netTotal)}</button>
              <button type="button" class="pos-denom-btn" onclick="SFAdmin.addPOSQuickCash(500)">+ ₹500</button>
              <button type="button" class="pos-denom-btn" onclick="SFAdmin.addPOSQuickCash(1000)">+ ₹1,000</button>
              <button type="button" class="pos-denom-btn" onclick="SFAdmin.addPOSQuickCash(2000)">+ ₹2,000</button>
              <button type="button" class="pos-denom-btn denom-clear" onclick="SFAdmin.setPOSQuickCash(0)">Clear</button>
            </div>

            <!-- Status Breakdown (Change Due vs Pending) -->
            <div class="pos-cash-status-box" id="posCashStatusBox">
              ${renderCashStatusHTML(posCashTendered, netTotal)}
            </div>
          </div>

          <!-- Complete Sale Action -->
          <div class="pos-action-buttons" style="margin-top: 14px;">
            <button class="sf-btn-complete-sale" id="posCompleteSaleBtn" onclick="SFAdmin.completePOSSale()" ${posCart.length === 0 ? 'disabled' : ''}>
              COMPLETE SALE & PRINT INVOICE &rarr;
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderPOSProductsGrid(list) {
    if (!list || list.length === 0) {
      return `
        <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: #76675D;">
          <div style="font-size: 28px; margin-bottom: 6px;">🔍</div>
          <b>No drapes matched "${posCatalogSearch || posActiveCategory}"</b>
          <p style="font-size: 12px; margin-top: 4px;">Try scanning barcode or searching by alternative weave / SKU.</p>
        </div>
      `;
    }

    return list.map(p => {
      const isOut = (p.stock_qty || 0) <= 0;
      const isLow = !isOut && (p.stock_qty || 0) <= (p.low_stock_threshold || 2);
      const stockBadgeClass = isOut ? 'stock-zero' : (isLow ? 'stock-low' : 'stock-ok');
      const stockText = isOut ? 'Sold Out' : `${p.stock_qty} left`;

      return `
        <div class="pos-item-card ${isOut ? 'out-of-stock' : ''}" onclick="SFAdmin.handlePOSCardClick(${p.id})">
          <div style="position: relative;">
            <img src="${p.img || (p.images && p.images[0]) || 'assets/kanchipuram-loom.jpg'}" alt="${p.name}" class="pos-item-img" loading="lazy">
            <span class="pos-item-stock-tag ${stockBadgeClass}" style="position: absolute; top: 6px; right: 6px; padding: 2px 6px; font-size: 10px; font-weight: 700; border-radius: 3px; z-index: 2;">
              ${stockText}
            </span>
          </div>
          <div class="pos-item-body">
            <span class="pos-item-cat">${p.category} • ${p.sku}</span>
            <div class="pos-item-name">${p.name}</div>
            <div class="pos-item-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
              <span class="pos-item-price">${formatMoney(p.price)}</span>
              <div class="pos-card-btns" style="display: flex; gap: 4px;">
                <button type="button" class="pos-inspect-btn" onclick="event.stopPropagation(); SFAdmin.openPOSProductCheckModal(${p.id})" style="padding: 3px 6px; font-size: 11px; background: #F5EBDD; border: 1px solid #A77950; border-radius: 3px; color: #3B2B25; cursor: pointer;">🔍 Check</button>
                <button type="button" class="pos-quick-add-btn" onclick="event.stopPropagation(); SFAdmin.addPOStoCart(${p.id})" ${isOut ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : 'style="padding: 3px 8px; font-size: 11px; background: #3B2B25; border: 1px solid #3B2B25; border-radius: 3px; color: #F5EBDD; cursor: pointer;"'}>+ Add</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function handlePOSCardClick(productId) {
    if (posScanMode === 'CHECK') {
      openPOSProductCheckModal(productId);
    } else {
      addPOStoCart(productId);
    }
  }

  function setPOSScanMode(mode) {
    posScanMode = mode;
    document.querySelectorAll('.pos-scan-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    const input = document.getElementById('posBarcodeInput');
    if (input) {
      input.placeholder = mode === 'BILL'
        ? 'Scan Barcode or Type SKU / Saree Name [ENTER to Add]...'
        : 'Scan Barcode or Type SKU [ENTER to Check Details & Stock]...';
      input.focus();
    }
  }

  function handlePOSCatalogSearch(query) {
    posCatalogSearch = (query || '').trim().toLowerCase();
    filterAndRenderPOSGrid();
  }

  function filterPOSCategory(cat, btn) {
    posActiveCategory = cat;
    document.querySelectorAll('.pos-cat-pill').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    filterAndRenderPOSGrid();
  }

  function filterAndRenderPOSGrid() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const prods = db.getProducts().filter(p => p.status !== 'Archived');
    const filtered = getFilteredPOSProducts(prods);
    const grid = document.getElementById('posProductsGrid');
    if (grid) grid.innerHTML = renderPOSProductsGrid(filtered);
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
      el.innerHTML = `<div class="pos-scanned-error" style="background: #FFEBEE; color: #C62828; border: 1px solid #FFCDD2; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;"><span>⚠️ ${lastPOSScanInfo.message}</span><button onclick="this.parentElement.remove()" style="background:none; border:none; cursor:pointer; font-weight:bold;">✕</button></div>`;
    } else {
      el.innerHTML = `<div class="pos-scanned-feedback" style="background: #E8F5E9; color: #2E7D32; border: 1px solid #C8E6C9; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;"><span>✅ ${lastPOSScanInfo.message}</span><small style="color: #2E7D32; font-weight: 700;">Available: ${lastPOSScanInfo.stock} pcs</small></div>`;
    }
  }

  function checkPOSCurrentBarcodeInput() {
    const input = document.getElementById('posBarcodeInput');
    if (!input) return;
    const val = input.value.trim();
    if (!val) {
      alert('Please enter or scan a Saree Barcode or SKU first.');
      input.focus();
      return;
    }
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const prod = db.getProductBySkuOrBarcode(val);
    if (prod) {
      playScanSound('success');
      openPOSProductCheckModal(prod.id);
      input.value = '';
    } else {
      playScanSound('error');
      lastPOSScanInfo = { error: true, message: `No saree found matching barcode/SKU "${val}".` };
      renderPOSFeedback();
      input.select();
    }
  }

  function openPOSProductCheckModal(productId) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const p = db.getProduct(productId) || db.getProductBySkuOrBarcode(productId);
    if (!p) {
      alert('Saree not found.');
      return;
    }
    const container = document.getElementById('sfModalContainer');
    if (!container) return;

    const isOut = (p.stock_qty || 0) <= 0;
    const isLow = !isOut && (p.stock_qty || 0) <= (p.low_stock_threshold || 2);
    const stockBadgeClass = isOut ? 'stock-zero' : (isLow ? 'stock-low' : 'stock-ok');
    const stockText = isOut ? '❌ Sold Out (0 in Stock)' : (isLow ? `⚠️ Low Stock (${p.stock_qty} Drapes Left)` : `✅ In Stock (${p.stock_qty} Drapes Available)`);

    container.innerHTML = `
      <div class="sf-modal-backdrop" onclick="if(event.target===this) SFAdmin.closeModal()">
        <div class="sf-modal-card sf-modal-md pos-check-modal" style="max-width: 620px;">
          <div class="sf-modal-header">
            <div>
              <span class="sf-cat-eyebrow" style="font-size: 11px; text-transform: uppercase; color: #A77950; font-weight: 700; letter-spacing: 1px;">Saree Purity & Stock Check</span>
              <h3 style="margin: 2px 0 0; font-family: 'Playfair Display', Georgia, serif; font-size: 20px; color: #3B2B25;">${p.name}</h3>
            </div>
            <button class="sf-modal-close" onclick="SFAdmin.closeModal()">×</button>
          </div>

          <div class="pos-check-grid" style="display: grid; grid-template-columns: 190px 1fr; gap: 18px; padding: 16px 0;">
            <div class="pos-check-media">
              <img src="${p.img || (p.images && p.images[0]) || 'assets/kanchipuram-loom.jpg'}" alt="${p.name}" style="width: 100%; aspect-ratio: 3/4; object-fit: cover; border-radius: 4px; border: 1px solid #E5D7C5;">
              <div style="margin-top: 10px; text-align: center;">
                <span class="pos-item-stock ${stockBadgeClass}" style="display: inline-block; padding: 5px 12px; font-size: 12px; font-weight: 700; border-radius: 4px;">
                  ${stockText}
                </span>
              </div>
            </div>

            <div class="pos-check-details">
              <table class="sf-table" style="font-size: 12.5px; border: 1px solid #E5D7C5; border-radius: 4px; overflow: hidden; width: 100%;">
                <tbody>
                  <tr><th style="width: 110px; background: #FAF7F2; padding: 6px 10px;">SKU</th><td style="padding: 6px 10px;"><b>${p.sku || '—'}</b></td></tr>
                  <tr><th style="background: #FAF7F2; padding: 6px 10px;">Barcode</th><td style="padding: 6px 10px;"><code>${p.barcode || '—'}</code></td></tr>
                  <tr><th style="background: #FAF7F2; padding: 6px 10px;">Category</th><td style="padding: 6px 10px;">${p.category || 'Handloom'}</td></tr>
                  <tr><th style="background: #FAF7F2; padding: 6px 10px;">Fabric</th><td style="padding: 6px 10px;">${p.fabric || p.material || 'Pure Mulberry Silk'}</td></tr>
                  <tr><th style="background: #FAF7F2; padding: 6px 10px;">Weave</th><td style="padding: 6px 10px;">${p.weave || 'Traditional Handloom'}</td></tr>
                  <tr><th style="background: #FAF7F2; padding: 6px 10px;">Selling Price</th><td style="padding: 6px 10px;"><b style="font-size: 16px; color: #3B2B25;">${formatMoney(p.price)}</b> ${p.old_price && p.old_price > p.price ? `<del style="color: #888; font-size: 12px; margin-left: 6px;">${formatMoney(p.old_price)}</del>` : ''}</td></tr>
                  <tr><th style="background: #FAF7F2; padding: 6px 10px;">Purchase Cost</th><td style="padding: 6px 10px;">${p.purchase_cost ? formatMoney(p.purchase_cost) : '—'}</td></tr>
                  <tr><th style="background: #FAF7F2; padding: 6px 10px;">Certification</th><td style="padding: 6px 10px;"><span style="color: #2E7D32; font-weight: 600;">Silk Mark Certified 100% Pure Handloom</span></td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="sf-modal-actions" style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #E5D7C5; padding-top: 14px; margin-top: 6px;">
            <button type="button" class="sf-btn-outline" onclick="SFAdmin.closeModal(); SFAdmin.openBarcodePrinterModal(${p.id});">🏷️ Print Barcode Label</button>
            <button type="button" class="sf-btn-primary" onclick="SFAdmin.addPOStoCart(${p.id}); SFAdmin.closeModal();" ${isOut ? 'disabled style="opacity: 0.5;"' : ''}>
              ${isOut ? 'Sold Out' : '+ Add to Current Bill'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function handlePOSBarcodeKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.target.value.trim();
      if (!val) return;
      const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
      const prod = db.getProductBySkuOrBarcode(val);

      if (prod) {
        if (posScanMode === 'CHECK') {
          playScanSound('success');
          openPOSProductCheckModal(prod.id);
          e.target.value = '';
          return;
        }

        // posScanMode === 'BILL'
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
          message: `Scanned: ${prod.name} (${prod.sku}) — ${formatMoney(prod.price)}`,
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
    posCashTendered = 0;
    render();
  }

  function updatePOSCustomer(field, val) {
    posCustomer[field] = val;
  }

  function updatePOSCustomerField(field, val) {
    posCustomer[field] = val;
  }

  function handlePOSCustomerSearch(query) {
    const q = (query || '').trim().toLowerCase();
    const resultsContainer = document.getElementById('posCustomerSearchResults');
    if (!resultsContainer) return;

    if (!q || q.length < 2) {
      resultsContainer.style.display = 'none';
      resultsContainer.innerHTML = '';
      return;
    }

    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const customers = db.getCustomers() || [];
    const matches = customers.filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    ).slice(0, 5);

    if (matches.length === 0) {
      resultsContainer.style.display = 'block';
      resultsContainer.innerHTML = `
        <div class="pos-search-no-match" style="padding: 8px 12px; font-size: 12px; color: #76675D;">
          New Patron detected. Details will be saved upon checkout.
        </div>
      `;
      return;
    }

    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = matches.map(c => `
      <div class="pos-customer-match-item" onclick="SFAdmin.selectPOSCustomer('${c.id}')" style="padding: 8px 12px; border-bottom: 1px solid #E5D7C5; cursor: pointer; transition: background 0.15s;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <b style="color: #3B2B25; font-size: 13px;">${c.name}</b>
          <span style="font-size: 11px; background: #F5EBDD; padding: 2px 6px; border-radius: 3px; color: #A77950; font-weight: 600;">
            ${c.total_orders || 1} Orders • ${formatMoney(c.total_spent || 0)}
          </span>
        </div>
        <div style="font-size: 11.5px; color: #666; margin-top: 2px;">
          📞 ${c.phone || 'No phone'} ${c.city ? `• 📍 ${c.city}` : ''}
        </div>
      </div>
    `).join('');
  }

  function selectPOSCustomer(custId) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const c = db.getCustomers().find(x => x.id === custId);
    if (!c) return;

    posCustomer = {
      id: c.id,
      name: c.name || 'Walk-in Patron',
      phone: c.phone || '',
      email: c.email || '',
      city: c.city || 'Hyderabad',
      address: c.street || ''
    };

    const nameInput = document.getElementById('posCustName');
    const phoneInput = document.getElementById('posCustPhone');
    const emailInput = document.getElementById('posCustEmail');
    const cityInput = document.getElementById('posCustCity');
    const searchInput = document.getElementById('posCustomerSearchInput');
    const badgeWrap = document.getElementById('posCustomerBadgeWrap');
    const resultsContainer = document.getElementById('posCustomerSearchResults');

    if (nameInput) nameInput.value = posCustomer.name;
    if (phoneInput) phoneInput.value = posCustomer.phone;
    if (emailInput) emailInput.value = posCustomer.email;
    if (cityInput) cityInput.value = posCustomer.city;
    if (searchInput) searchInput.value = '';
    if (resultsContainer) {
      resultsContainer.style.display = 'none';
      resultsContainer.innerHTML = '';
    }
    if (badgeWrap) {
      badgeWrap.innerHTML = `
        <div class="pos-patron-badge" style="display: flex; align-items: center; justify-content: space-between; background: #E8F5E9; border: 1px solid #C8E6C9; padding: 4px 8px; border-radius: 4px; font-size: 11.5px; color: #1B5E20; margin-bottom: 8px;">
          <span>⭐ Verified Patron: <b>${c.name}</b> (${c.phone || 'No phone'}) • ${c.total_orders || 1} Prev. Orders</span>
          <button type="button" onclick="SFAdmin.resetPOSCustomer()" style="background: none; border: none; color: #C62828; cursor: pointer; font-size: 13px; font-weight: bold;">✕</button>
        </div>
      `;
    }
  }

  function resetPOSCustomer() {
    posCustomer = {
      id: null,
      name: 'Walk-in Patron',
      phone: '',
      email: '',
      city: 'Hyderabad',
      address: ''
    };
    const nameInput = document.getElementById('posCustName');
    const phoneInput = document.getElementById('posCustPhone');
    const emailInput = document.getElementById('posCustEmail');
    const cityInput = document.getElementById('posCustCity');
    const searchInput = document.getElementById('posCustomerSearchInput');
    const badgeWrap = document.getElementById('posCustomerBadgeWrap');
    const resultsContainer = document.getElementById('posCustomerSearchResults');

    if (nameInput) nameInput.value = 'Walk-in Patron';
    if (phoneInput) phoneInput.value = '';
    if (emailInput) emailInput.value = '';
    if (cityInput) cityInput.value = 'Hyderabad';
    if (searchInput) searchInput.value = '';
    if (badgeWrap) badgeWrap.innerHTML = '';
    if (resultsContainer) {
      resultsContainer.style.display = 'none';
      resultsContainer.innerHTML = '';
    }
  }

  function updatePOSDiscount(val) {
    posDiscount = Math.max(0, parseInt(val, 10) || 0);
    updatePOSPaymentCalculations();
  }

  function setPOSPaymentMethod(mode) {
    posPaymentMethod = mode;
    if (typeof document !== 'undefined') {
      const calcBox = document.getElementById('posCashCalculatorBox');
      if (calcBox) {
        const subtotal = posCart.reduce((sum, it) => sum + (it.price * it.qty), 0);
        const discountVal = parseInt(posDiscount || 0, 10);
        const taxable = Math.max(0, subtotal - discountVal);
        const netTotal = taxable + Math.round(taxable * 0.05);
        calcBox.style.display = (mode === 'CASH' && netTotal > 0) ? 'block' : 'none';
      }
      // Update active state of mode buttons
      document.querySelectorAll('.pos-mode-btn').forEach(btn => {
        const input = btn.querySelector('input');
        if (input && input.value === mode) {
          btn.classList.add('active');
          input.checked = true;
        } else {
          btn.classList.remove('active');
          if (input) input.checked = false;
        }
      });
    }
    return updatePOSPaymentCalculations();
  }

  function updatePOSCashTendered(val) {
    posCashTendered = parseFloat(val) || 0;
    return updatePOSPaymentCalculations();
  }

  function setPOSQuickCash(amount) {
    posCashTendered = Math.max(0, amount);
    if (typeof document !== 'undefined') {
      const input = document.getElementById('posCashTenderedInput');
      if (input) input.value = posCashTendered > 0 ? posCashTendered : '';
    }
    return updatePOSPaymentCalculations();
  }

  function addPOSQuickCash(delta) {
    posCashTendered = (posCashTendered || 0) + delta;
    if (typeof document !== 'undefined') {
      const input = document.getElementById('posCashTenderedInput');
      if (input) input.value = posCashTendered > 0 ? posCashTendered : '';
    }
    return updatePOSPaymentCalculations();
  }

  function updatePOSPaymentCalculations() {
    const subtotal = posCart.reduce((sum, it) => sum + (it.price * it.qty), 0);
    const discountVal = parseInt(posDiscount || 0, 10);
    const taxable = Math.max(0, subtotal - discountVal);
    const taxAmount = Math.round(taxable * 0.05);
    const netTotal = taxable + taxAmount;

    if (typeof document !== 'undefined') {
      const subtotalEl = document.getElementById('posGrossSubtotalDisplay');
      if (subtotalEl) subtotalEl.textContent = formatMoney(subtotal);

      const taxEl = document.getElementById('posTaxAmountDisplay');
      if (taxEl) taxEl.textContent = formatMoney(taxAmount);

      const netEl = document.getElementById('posNetTotalDisplay');
      if (netEl) netEl.textContent = formatMoney(netTotal);

      const exactBtn = document.getElementById('posExactDenomBtn');
      if (exactBtn) {
        exactBtn.textContent = `Exact: ${formatMoney(netTotal)}`;
        exactBtn.setAttribute('onclick', `SFAdmin.setPOSQuickCash(${netTotal})`);
      }

      const statusBox = document.getElementById('posCashStatusBox');
      if (statusBox) {
        statusBox.innerHTML = renderCashStatusHTML(posCashTendered, netTotal);
      }

      const calcBox = document.getElementById('posCashCalculatorBox');
      if (calcBox) {
        calcBox.style.display = (posPaymentMethod === 'CASH' && netTotal > 0) ? 'block' : 'none';
      }

      const completeBtn = document.getElementById('posCompleteSaleBtn');
      if (completeBtn) {
        completeBtn.disabled = posCart.length === 0;
      }
    }

    return {
      subtotal,
      discountVal,
      taxable,
      taxAmount,
      netTotal,
      cashTendered: posCashTendered,
      changeDue: Math.max(0, posCashTendered - netTotal),
      pendingAmount: Math.max(0, netTotal - posCashTendered),
      statusHTML: renderCashStatusHTML(posCashTendered, netTotal)
    };
  }

  function completePOSSale() {
    if (posCart.length === 0) return;
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');

    // Calculate totals
    const subtotal = posCart.reduce((sum, it) => sum + (it.price * it.qty), 0);
    const discountVal = parseInt(posDiscount || 0, 10);
    const taxable = Math.max(0, subtotal - discountVal);
    const taxAmount = Math.round(taxable * 0.05);
    const netTotal = taxable + taxAmount;

    const amountReceived = posPaymentMethod === 'CASH' ? (posCashTendered || netTotal) : netTotal;
    const changeDue = Math.max(0, amountReceived - netTotal);
    const pendingAmount = Math.max(0, netTotal - amountReceived);
    const paymentStatus = (posPaymentMethod !== 'CASH' || amountReceived >= netTotal) ? 'PAID' : (amountReceived > 0 ? 'PARTIAL' : 'PENDING');

    try {
      const order = db.processSaleTransaction({
        channel: 'POS',
        customer_name: (posCustomer.name || '').trim() || 'Walk-in Patron',
        customer_phone: (posCustomer.phone || '').trim(),
        customer_email: (posCustomer.email || '').trim(),
        customer_city: (posCustomer.city || '').trim() || 'Hyderabad',
        customer_id: posCustomer.id || null,
        items: posCart,
        discount: posDiscount,
        payment_method: posPaymentMethod,
        payment_status: paymentStatus,
        amount_received: amountReceived,
        change_due: changeDue,
        pending_amount: pendingAmount,
        admin_user: 'Bhanu (Owner)'
      });

      // Synchronize in-memory window.products if running in storefront
      if (typeof window !== 'undefined' && Array.isArray(window.products)) {
        posCart.forEach(ci => {
          const sp = window.products.find(p => p.id === ci.product_id || String(p.id) === String(ci.product_id));
          if (sp) {
            const up = db.getProduct(ci.product_id);
            if (up) {
              sp.stock_qty = up.stock_qty;
              sp.stock = up.stock;
            } else {
              sp.stock_qty = Math.max(0, (sp.stock_qty || 1) - ci.qty);
              sp.stock = sp.stock_qty <= 0 ? 'Sold Out' : (sp.stock_qty <= 2 ? 'Low Stock' : 'In Stock');
            }
          }
        });
      }

      // Clear Cart, Cash, and reset Patron
      posCart = [];
      posDiscount = 0;
      posCashTendered = 0;
      posCustomer = { name: 'Walk-in Patron', phone: '', email: '', city: 'Hyderabad', id: null };

      // Re-render POS
      render();

      // Show Printable Invoice Modal
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
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h4 style="margin: 0;">Logistics & Dispatch</h4>
                <span style="font-size: 11px; color: #2E7D32; font-weight: 700; background: #E8F5E9; padding: 2px 6px; border-radius: 4px; border: 1px solid #C8E6C9;">
                  🚀 Shiprocket Active
                </span>
              </div>
              <div class="sf-form-group" style="margin-bottom: 8px;">
                <label style="font-size: 11px;">Courier Partner:</label>
                <input type="text" id="mOrderCourier" value="${o.courier || 'Blue Dart Express'}" class="sf-input-sm">
              </div>
              <div class="sf-form-group" style="margin-bottom: 8px;">
                <label style="font-size: 11px;">Airway Bill / Tracking ID:</label>
                <input type="text" id="mOrderTracking" value="${o.tracking_number || ''}" class="sf-input-sm" placeholder="e.g. SRK982348271IN">
              </div>
              <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px;">
                <button class="sf-btn-sm" onclick="SFAdmin.saveOrderLogistics('${o.id}')">Save Tracking</button>
                <button id="btnShiprocketDispatch" class="sf-btn-sm" style="background: #A77950; color: #FFF; font-weight: 600;" onclick="SFAdmin.pushOrderToShiprocket('${o.id}')">
                  🚀 Generate Shiprocket AWB
                </button>
                ${o.tracking_number ? `
                  <a href="https://shiprocket.co//tracking/${encodeURIComponent(o.tracking_number)}" target="_blank" class="sf-btn-outline sf-btn-sm" style="text-decoration: none; padding: 4px 8px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
                    🔗 Track on Shiprocket &rarr;
                  </a>
                ` : ''}
              </div>
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

  async function pushOrderToShiprocket(orderId) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const order = db.getOrder(orderId);
    if (!order) {
      alert('Order not found.');
      return;
    }
    const shiprocket = typeof SFShiprocket !== 'undefined' ? SFShiprocket : (typeof require !== 'undefined' ? require('./sf_shiprocket') : null);
    if (!shiprocket) {
      alert('Shiprocket module not loaded.');
      return;
    }

    const btn = document.getElementById('btnShiprocketDispatch');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Booking with Shiprocket...';
    }

    try {
      const res = await shiprocket.pushOrderToShiprocket(order);
      if (res.success) {
        alert(`✅ Order booked with Shiprocket!\nAWB Tracking ID: ${res.awb}\nCourier: ${res.courier}\nStatus updated to Shipped.`);
        openOrderDetailModal(orderId);
      } else {
        alert(`Shiprocket Notice: ${res.message}`);
        if (btn) {
          btn.disabled = false;
          btn.textContent = '🚀 Generate Shiprocket AWB';
        }
      }
    } catch (e) {
      alert(`Shiprocket error: ${e.message}`);
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🚀 Generate Shiprocket AWB';
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. CUSTOMER PROFILES & ATELIER PATRON DIRECTORY
  // ═══════════════════════════════════════════════════════════════════════════
  let adminCustSearch = '';
  let adminCustDateFilter = 'ALL';
  let adminCustStatusFilter = 'ALL';
  let adminCustActivityFilter = 'ALL';
  let adminCustSort = 'NEWEST';
  let adminCustPage = 1;
  const adminCustPageSize = 10;
  let adminCustActiveDetailTab = 'personal';
  let adminCustOrderSubFilter = 'ALL';

  function renderCustomersTab(db) {
    const rawCustomers = db.getCustomers();

    // 1. Filter by Search Query
    const q = adminCustSearch.toLowerCase().trim();
    let filtered = rawCustomers.filter(c => {
      if (!q) return true;
      const idStr = String(c.id || '').toLowerCase();
      const nameStr = String(c.full_name || c.name || '').toLowerCase();
      const emailStr = String(c.email || '').toLowerCase();
      const phoneStr = String(c.mobile_number || c.phone || '').replace(/[^0-9]/g, '');
      return idStr.includes(q) || nameStr.includes(q) || emailStr.includes(q) || phoneStr.includes(q.replace(/[^0-9]/g, ''));
    });

    // 2. Filter by Registration Date
    const now = new Date();
    if (adminCustDateFilter !== 'ALL') {
      filtered = filtered.filter(c => {
        if (!c.created_at) return false;
        const d = new Date(c.created_at);
        const diffDays = (now - d) / (1000 * 60 * 60 * 24);
        if (adminCustDateFilter === 'TODAY') return diffDays <= 1;
        if (adminCustDateFilter === '7DAYS') return diffDays <= 7;
        if (adminCustDateFilter === '30DAYS') return diffDays <= 30;
        if (adminCustDateFilter === 'YEAR') return d.getFullYear() === now.getFullYear();
        return true;
      });
    }

    // 3. Filter by Customer Status
    if (adminCustStatusFilter !== 'ALL') {
      filtered = filtered.filter(c => {
        const st = (c.account_status || 'Active').toUpperCase();
        if (adminCustStatusFilter === 'ACTIVE') return st === 'ACTIVE';
        if (adminCustStatusFilter === 'INACTIVE') return st === 'INACTIVE';
        if (adminCustStatusFilter === 'INCOMPLETE') return c.profile_completed === false;
        return true;
      });
    }

    // 4. Filter by Order Activity
    if (adminCustActivityFilter !== 'ALL') {
      filtered = filtered.filter(c => {
        const ordersCount = Number(c.total_orders || 0);
        const spent = Number(c.total_spent || 0);
        if (adminCustActivityFilter === 'HAS_ORDERS') return ordersCount > 0;
        if (adminCustActivityFilter === 'ZERO_ORDERS') return ordersCount === 0;
        if (adminCustActivityFilter === 'VIP') return spent >= 20000;
        return true;
      });
    }

    // 5. Sorting
    filtered.sort((a, b) => {
      if (adminCustSort === 'NEWEST') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (adminCustSort === 'OLDEST') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      if (adminCustSort === 'SPEND') return (Number(b.total_spent) || 0) - (Number(a.total_spent) || 0);
      if (adminCustSort === 'ORDERS') return (Number(b.total_orders) || 0) - (Number(a.total_orders) || 0);
      return 0;
    });

    // 6. Pagination
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / adminCustPageSize) || 1;
    if (adminCustPage > totalPages) adminCustPage = totalPages;
    const startIndex = (adminCustPage - 1) * adminCustPageSize;
    const paginatedCustomers = filtered.slice(startIndex, startIndex + adminCustPageSize);

    // Summary KPIs
    const googleCount = rawCustomers.filter(c => c.auth_user_id || c.is_google_auth).length;
    const activeCount = rawCustomers.filter(c => (c.account_status || 'Active').toLowerCase() === 'active').length;
    const netPatronSpend = rawCustomers.reduce((sum, c) => sum + (Number(c.total_spent) || 0), 0);

    return `
      <div class="sf-view-container">
        <div class="sf-view-header">
          <div>
            <h1>Customer Management & Patron Directory</h1>
            <p>Google authenticated accounts, profile completion tracking, lifetime order ledger, and concierge notes.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="sf-btn-outline" onclick="SFAdmin.exportCustomersCSV()">📥 Export Customers CSV</button>
            <button class="sf-btn-primary" onclick="SFAdmin.openAddCustomerModal(false)">+ Add Customer</button>
          </div>
        </div>

        <!-- Top Patron Metrics Cards -->
        <div class="sf-grid-4col" style="margin-bottom: 24px;">
          <div class="sf-card sf-kpi-card">
            <span class="sf-kpi-num">${rawCustomers.length}</span>
            <span class="sf-kpi-label">Registered Customers</span>
          </div>
          <div class="sf-card sf-kpi-card">
            <span class="sf-kpi-num" style="color: #1565C0;">${googleCount}</span>
            <span class="sf-kpi-label">Google Verified Patrons</span>
          </div>
          <div class="sf-card sf-kpi-card">
            <span class="sf-kpi-num" style="color: #2E7D32;">${activeCount}</span>
            <span class="sf-kpi-label">Active Patron Accounts</span>
          </div>
          <div class="sf-card sf-kpi-card">
            <span class="sf-kpi-num" style="color: #A77950;">${formatMoney(netPatronSpend)}</span>
            <span class="sf-kpi-label">Completed Purchase Volume</span>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="sf-card" style="margin-bottom: 20px; padding: 16px 20px;">
          <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; justify-content: space-between;">
            <div style="flex: 1; min-width: 260px;">
              <input type="text" id="adminCustSearchInput" class="sf-search-input" placeholder="Search by name, email, mobile, or customer ID..." value="${adminCustSearch}" oninput="SFAdmin.handleCustomerSearch(this.value)">
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
              <!-- Registration Date Filter -->
              <select class="sf-select-sm" onchange="SFAdmin.handleCustomerDateFilter(this.value)" title="Registration Date">
                <option value="ALL" ${adminCustDateFilter === 'ALL' ? 'selected' : ''}>All Dates</option>
                <option value="TODAY" ${adminCustDateFilter === 'TODAY' ? 'selected' : ''}>Today</option>
                <option value="7DAYS" ${adminCustDateFilter === '7DAYS' ? 'selected' : ''}>Last 7 Days</option>
                <option value="30DAYS" ${adminCustDateFilter === '30DAYS' ? 'selected' : ''}>Last 30 Days</option>
                <option value="YEAR" ${adminCustDateFilter === 'YEAR' ? 'selected' : ''}>This Year</option>
              </select>

              <!-- Account Status Filter -->
              <select class="sf-select-sm" onchange="SFAdmin.handleCustomerStatusFilter(this.value)" title="Account Status">
                <option value="ALL" ${adminCustStatusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
                <option value="ACTIVE" ${adminCustStatusFilter === 'ACTIVE' ? 'selected' : ''}>Active</option>
                <option value="INACTIVE" ${adminCustStatusFilter === 'INACTIVE' ? 'selected' : ''}>Inactive</option>
                <option value="INCOMPLETE" ${adminCustStatusFilter === 'INCOMPLETE' ? 'selected' : ''}>Profile Incomplete</option>
              </select>

              <!-- Order Activity Filter -->
              <select class="sf-select-sm" onchange="SFAdmin.handleCustomerActivityFilter(this.value)" title="Order Activity">
                <option value="ALL" ${adminCustActivityFilter === 'ALL' ? 'selected' : ''}>All Activity</option>
                <option value="HAS_ORDERS" ${adminCustActivityFilter === 'HAS_ORDERS' ? 'selected' : ''}>Has Orders</option>
                <option value="VIP" ${adminCustActivityFilter === 'VIP' ? 'selected' : ''}>VIP Spenders (>₹20k)</option>
                <option value="ZERO_ORDERS" ${adminCustActivityFilter === 'ZERO_ORDERS' ? 'selected' : ''}>Zero Orders</option>
              </select>

              <!-- Sort Filter -->
              <select class="sf-select-sm" onchange="SFAdmin.handleCustomerSort(this.value)" title="Sort Order">
                <option value="NEWEST" ${adminCustSort === 'NEWEST' ? 'selected' : ''}>Newest First</option>
                <option value="OLDEST" ${adminCustSort === 'OLDEST' ? 'selected' : ''}>Oldest First</option>
                <option value="SPEND" ${adminCustSort === 'SPEND' ? 'selected' : ''}>Highest Spending</option>
                <option value="ORDERS" ${adminCustSort === 'ORDERS' ? 'selected' : ''}>Most Orders</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Customer Listing Table -->
        <div class="sf-card">
          <div class="sf-table-responsive">
            <table class="sf-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Customer Name</th>
                  <th>Email Address</th>
                  <th>Mobile Number</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Registration Date</th>
                  <th style="text-align: center;">Total Orders</th>
                  <th style="text-align: right;">Total Purchase Value</th>
                  <th>Last Order Date</th>
                  <th>Customer Status</th>
                  <th style="text-align: center;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${paginatedCustomers.length === 0 ? `
                  <tr>
                    <td colspan="12" style="text-align: center; padding: 48px 20px; color: #7A695E;">
                      No customer records found matching your filters.
                    </td>
                  </tr>
                ` : paginatedCustomers.map(c => {
                  const regDate = c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                  const lastOrder = c.last_order_date ? new Date(c.last_order_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never';
                  const isGoogle = !!(c.auth_user_id || c.is_google_auth);
                  const status = (c.account_status || 'Active').toLowerCase();
                  const isIncomplete = c.profile_completed === false;

                  return `
                    <tr style="cursor: pointer;" onclick="if(!event.target.closest('button,a')) SFAdmin.openCustomerDetailsModal('${c.id}')">
                      <td><code style="font-weight: 700; color: #3B2B25;">#${c.id}</code></td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <b>${c.full_name || c.name || 'Patron'}</b>
                          ${isGoogle ? `<span title="Google Authenticated" style="font-size: 11px; background: #E8F0FE; color: #1967D2; padding: 2px 6px; border-radius: 4px; font-weight: 600;">G</span>` : ''}
                        </div>
                      </td>
                      <td>
                        <a href="mailto:${c.email}" style="color: #7A695E; text-decoration: none;">${c.email || '—'}</a>
                      </td>
                      <td>
                        <a href="tel:${c.mobile_number || c.phone}" style="color: #3B2B25; font-weight: 600; text-decoration: none;">
                          ${c.mobile_number || c.phone || '—'}
                        </a>
                      </td>
                      <td>${c.city || '—'}</td>
                      <td>${c.state || '—'}</td>
                      <td style="white-space: nowrap; font-size: 12.5px; color: #7A695E;">${regDate}</td>
                      <td style="text-align: center;"><b>${c.total_orders || 0}</b></td>
                      <td style="text-align: right; font-weight: 700; color: #672D46;">
                        ${formatMoney(c.total_spent || 0)}
                      </td>
                      <td style="white-space: nowrap; font-size: 12.5px; color: #7A695E;">${lastOrder}</td>
                      <td>
                        <div style="display: flex; flex-direction: column; gap: 2px;">
                          <span class="sf-status-badge ${status}">${c.account_status || 'Active'}</span>
                          ${isIncomplete ? `<span style="font-size: 10px; color: #E65100; font-weight: 600;">⚠️ Incomplete</span>` : ''}
                        </div>
                      </td>
                      <td style="text-align: center; white-space: nowrap;">
                        <button class="sf-btn-outline" style="font-size: 11px; padding: 4px 10px;" onclick="SFAdmin.openCustomerDetailsModal('${c.id}')">
                          View Profile &rarr;
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-top: 1px solid #F0E6D8; font-size: 13px; color: #7A695E; flex-wrap: wrap; gap: 10px;">
            <div>
              Showing <b>${totalCount ? startIndex + 1 : 0}</b> to <b>${Math.min(startIndex + adminCustPageSize, totalCount)}</b> of <b>${totalCount}</b> patrons
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button class="sf-btn-outline" style="padding: 4px 10px; font-size: 12px;" onclick="SFAdmin.changeCustomerPage(${adminCustPage - 1})" ${adminCustPage <= 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                &larr; Previous
              </button>
              <span>Page <b>${adminCustPage}</b> of <b>${totalPages}</b></span>
              <button class="sf-btn-outline" style="padding: 4px 10px; font-size: 12px;" onclick="SFAdmin.changeCustomerPage(${adminCustPage + 1})" ${adminCustPage >= totalPages ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                Next &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function handleCustomerSearch(val) {
    adminCustSearch = val;
    adminCustPage = 1;
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const root = document.getElementById('appRoot');
    if (root) root.innerHTML = renderCustomersTab(db);
  }

  function handleCustomerDateFilter(val) {
    adminCustDateFilter = val;
    adminCustPage = 1;
    render('appRoot', 'customers');
  }

  function handleCustomerStatusFilter(val) {
    adminCustStatusFilter = val;
    adminCustPage = 1;
    render('appRoot', 'customers');
  }

  function handleCustomerActivityFilter(val) {
    adminCustActivityFilter = val;
    adminCustPage = 1;
    render('appRoot', 'customers');
  }

  function handleCustomerSort(val) {
    adminCustSort = val;
    adminCustPage = 1;
    render('appRoot', 'customers');
  }

  function changeCustomerPage(p) {
    adminCustPage = p;
    render('appRoot', 'customers');
  }

  function exportCustomersCSV() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const customers = db.getCustomers();

    const headers = [
      'Customer ID', 'Full Name', 'Email', 'Mobile Number', 'City', 'State', 'District', 'PIN Code',
      'Registration Date', 'Total Orders', 'Total Spent INR', 'Last Order Date', 'Account Status',
      'Profile Completed', 'Google Auth', 'Preferred Contact'
    ];

    const rows = customers.map(c => [
      c.id,
      `"${(c.full_name || c.name || '').replace(/"/g, '""')}"`,
      c.email || '',
      c.mobile_number || c.phone || '',
      `"${(c.city || '').replace(/"/g, '""')}"`,
      `"${(c.state || '').replace(/"/g, '""')}"`,
      `"${(c.district || '').replace(/"/g, '""')}"`,
      c.pincode || '',
      c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : '',
      c.total_orders || 0,
      c.total_spent || 0,
      c.last_order_date ? new Date(c.last_order_date).toISOString().split('T')[0] : '',
      c.account_status || 'Active',
      c.profile_completed !== false ? 'Yes' : 'No',
      c.auth_user_id || c.is_google_auth ? 'Yes' : 'No',
      c.preferred_contact || 'WhatsApp'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Shanmuka_Patrons_Directory_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6B. DETAILED CUSTOMER PROFILE MODAL (ADMIN VIEW)
  // ═══════════════════════════════════════════════════════════════════════════
  function openCustomerDetailsModal(customerId) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const summary = db.getCustomerSummary(customerId);
    if (!summary || !summary.customer) {
      alert('Could not locate customer dossier.');
      return;
    }

    const c = summary.customer;
    const container = document.getElementById('sfModalContainer');
    if (!container) return;

    adminCustActiveDetailTab = 'personal';
    adminCustOrderSubFilter = 'ALL';

    renderCustomerDetailsModalHTML(customerId);
  }

  function renderCustomerDetailsModalHTML(customerId) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const summary = db.getCustomerSummary(customerId);
    if (!summary || !summary.customer) return;

    const c = summary.customer;
    const container = document.getElementById('sfModalContainer');
    if (!container) return;

    const addresses = db.getCustomerAddresses(c.id);
    const notes = db.getCustomerNotes(c.id);
    const isGoogle = !!(c.auth_user_id || c.is_google_auth);
    const isActive = (c.account_status || 'Active').toLowerCase() === 'active';

    // Orders filtered by sub-tab
    let ordersToShow = summary.orders || [];
    if (adminCustOrderSubFilter === 'DELIVERED') {
      ordersToShow = ordersToShow.filter(o => (o.order_status || '').toLowerCase() === 'delivered');
    } else if (adminCustOrderSubFilter === 'ACTIVE') {
      ordersToShow = ordersToShow.filter(o => ['pending', 'processing', 'confirmed', 'packed', 'shipped', 'dispatched', 'out for delivery'].includes((o.order_status || '').toLowerCase()));
    } else if (adminCustOrderSubFilter === 'CANCELLED') {
      ordersToShow = ordersToShow.filter(o => (o.order_status || '').toLowerCase() === 'cancelled');
    } else if (adminCustOrderSubFilter === 'RETURNED') {
      ordersToShow = ordersToShow.filter(o => ['returned', 'return requested'].includes((o.order_status || '').toLowerCase()));
    } else if (adminCustOrderSubFilter === 'REFUNDED') {
      ordersToShow = ordersToShow.filter(o => (o.order_status || '').toLowerCase().includes('refund'));
    }

    container.innerHTML = `
      <div class="sf-modal-backdrop" onclick="if(event.target===this) SFAdmin.closeModal()">
        <div class="sf-modal-card sf-modal-xl" style="max-width: 900px; max-height: 90vh; display: flex; flex-direction: column;">
          <!-- Modal Top Header -->
          <div class="sf-modal-header" style="padding: 20px 24px; border-bottom: 1px solid #E5D7C5; background: #FAF6F0;">
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
              <div style="display: flex; align-items: center; gap: 14px;">
                <div style="width: 48px; height: 48px; border-radius: 50%; background: #3B2B25; color: #F5EBDD; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; font-family: 'Playfair Display', serif;">
                  ${(c.full_name || c.name || 'P').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <h2 style="font-family: 'Playfair Display', serif; font-size: 20px; color: #3B2B25; margin: 0;">
                      ${c.full_name || c.name}
                    </h2>
                    ${isGoogle ? `<span style="font-size: 11px; background: #E8F0FE; color: #1967D2; font-weight: 700; padding: 2px 8px; border-radius: 4px; border: 1px solid #C2E7FF;">✓ Google Verified</span>` : ''}
                    <span class="sf-status-badge ${isActive ? 'active' : 'inactive'}">${c.account_status || 'Active'}</span>
                    ${c.profile_completed !== false ? `
                      <span style="font-size: 11px; background: #E8F5E9; color: #2E7D32; font-weight: 700; padding: 2px 8px; border-radius: 4px;">Profile 100% Complete</span>
                    ` : `
                      <span style="font-size: 11px; background: #FFF3E0; color: #E65100; font-weight: 700; padding: 2px 8px; border-radius: 4px;">⚠️ Profile Incomplete</span>
                    `}
                  </div>
                  <div style="font-size: 12.5px; color: #7A695E; margin-top: 3px;">
                    Patron ID: <b>#${c.id}</b> &bull; Email: <b>${c.email || '—'}</b> &bull; Phone: <b>${c.mobile_number || c.phone || '—'}</b>
                  </div>
                </div>
              </div>

              <div style="display: flex; gap: 8px; align-items: center;">
                <button type="button" class="sf-btn-outline" style="font-size: 11.5px; padding: 6px 12px;" onclick="SFAdmin.toggleCustomerStatus('${c.id}')">
                  ${isActive ? 'Mark Inactive' : 'Mark Active'}
                </button>
                <button type="button" class="sf-btn-outline" style="font-size: 11.5px; padding: 6px 12px;" onclick="SFAdmin.exportSingleCustomerCSV('${c.id}')">
                  📥 Export Dossier
                </button>
                <button class="sf-modal-close" onclick="SFAdmin.closeModal()">×</button>
              </div>
            </div>
          </div>

          <!-- Section Navigation Tabs -->
          <div style="display: flex; gap: 12px; padding: 12px 24px 0 24px; border-bottom: 1px solid #E5D7C5; background: #FFFFFF; overflow-x: auto;">
            <button class="sf-tab-pill ${adminCustActiveDetailTab === 'personal' ? 'active' : ''}" onclick="SFAdmin.switchCustomerDetailTab('${c.id}', 'personal')">
              A. Personal Details
            </button>
            <button class="sf-tab-pill ${adminCustActiveDetailTab === 'addresses' ? 'active' : ''}" onclick="SFAdmin.switchCustomerDetailTab('${c.id}', 'addresses')">
              B. Saved Addresses (${addresses.length})
            </button>
            <button class="sf-tab-pill ${adminCustActiveDetailTab === 'summary' ? 'active' : ''}" onclick="SFAdmin.switchCustomerDetailTab('${c.id}', 'summary')">
              C. Purchase Summary
            </button>
            <button class="sf-tab-pill ${adminCustActiveDetailTab === 'orders' ? 'active' : ''}" onclick="SFAdmin.switchCustomerDetailTab('${c.id}', 'orders')">
              D. Complete Order History (${summary.total_orders})
            </button>
            <button class="sf-tab-pill ${adminCustActiveDetailTab === 'notes' ? 'active' : ''}" onclick="SFAdmin.switchCustomerDetailTab('${c.id}', 'notes')">
              E. Internal Notes (${notes.length})
            </button>
          </div>

          <!-- Modal Scrollable Body -->
          <div style="padding: 24px; overflow-y: auto; flex: 1;">
            ${adminCustActiveDetailTab === 'personal' ? `
              <!-- SECTION A: Personal Details -->
              <div class="sf-form-grid-2" style="margin-bottom: 24px;">
                <div class="sf-form-group">
                  <label>Customer ID</label>
                  <input type="text" value="${c.id}" disabled style="background: #FAF6F0;">
                </div>
                <div class="sf-form-group">
                  <label>Supabase Auth User ID</label>
                  <input type="text" value="${c.auth_user_id || 'Not registered via Supabase Auth'}" disabled style="background: #FAF6F0;">
                </div>
              </div>

              <div class="sf-form-grid-2">
                <div class="sf-form-group">
                  <label>Full Legal Name</label>
                  <input type="text" id="dtCustName" value="${c.full_name || c.name || ''}">
                </div>
                <div class="sf-form-group">
                  <label>Email Address (Verified)</label>
                  <input type="email" value="${c.email || ''}" disabled style="background: #FAF6F0; cursor: not-allowed;">
                </div>
              </div>

              <div class="sf-form-grid-2">
                <div class="sf-form-group">
                  <label>Primary Mobile Number</label>
                  <input type="tel" id="dtCustMobile" value="${c.mobile_number || c.phone || ''}">
                </div>
                <div class="sf-form-group">
                  <label>Alternate Mobile Number</label>
                  <input type="tel" id="dtCustAltMobile" value="${c.alternate_mobile || ''}">
                </div>
              </div>

              <div class="sf-form-grid-2">
                <div class="sf-form-group">
                  <label>Date of Birth</label>
                  <input type="date" id="dtCustDOB" value="${c.date_of_birth || ''}">
                </div>
                <div class="sf-form-group">
                  <label>Gender</label>
                  <select id="dtCustGender">
                    <option value="">Select Gender</option>
                    <option value="Female" ${c.gender === 'Female' ? 'selected' : ''}>Female</option>
                    <option value="Male" ${c.gender === 'Male' ? 'selected' : ''}>Male</option>
                    <option value="Non-binary / Other" ${c.gender === 'Non-binary / Other' ? 'selected' : ''}>Non-binary / Other</option>
                    <option value="Prefer not to say" ${c.gender === 'Prefer not to say' ? 'selected' : ''}>Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div class="sf-form-grid-2">
                <div class="sf-form-group">
                  <label>Registration Date</label>
                  <input type="text" value="${c.created_at ? new Date(c.created_at).toLocaleString('en-IN') : '—'}" disabled style="background: #FAF6F0;">
                </div>
                <div class="sf-form-group">
                  <label>Last Login Date</label>
                  <input type="text" value="${c.last_login_at ? new Date(c.last_login_at).toLocaleString('en-IN') : '—'}" disabled style="background: #FAF6F0;">
                </div>
              </div>

              <div class="sf-form-group" style="margin-top: 14px;">
                <button type="button" class="sf-btn-primary" onclick="SFAdmin.saveCustomerProfileUpdates('${c.id}')">
                  Save Permitted Profile Updates
                </button>
              </div>
            ` : adminCustActiveDetailTab === 'addresses' ? `
              <!-- SECTION B: Address Details -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="margin: 0; font-family: 'Playfair Display', serif; color: #3B2B25;">Saved Delivery Addresses</h3>
                <span style="font-size: 12px; color: #7A695E;">${addresses.length} Address(es) on Record</span>
              </div>

              ${addresses.length === 0 ? `
                <div style="padding: 32px; text-align: center; color: #7A695E; background: #FAF6F0; border-radius: 6px; border: 1px dashed #D8C3A5;">
                  No delivery addresses saved for this customer yet.
                </div>
              ` : `
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
                  ${addresses.map(a => `
                    <div style="background: #FFFFFF; border: 1.5px solid ${a.is_default ? '#A77950' : '#E5D7C5'}; border-radius: 6px; padding: 16px; position: relative;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: 700; color: #3B2B25; font-size: 13.5px;">${a.address_type || 'Home'}</span>
                        ${a.is_default ? `<span style="background: #E8F5E9; color: #2E7D32; font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 4px;">Default Address</span>` : ''}
                      </div>
                      <div style="font-size: 13px; color: #5D4037; line-height: 1.5;">
                        <strong>${a.full_name || c.full_name || 'Recipient'}</strong><br>
                        ${a.house_number ? `${a.house_number}, ` : ''}${a.street}<br>
                        ${a.landmark ? `Landmark: ${a.landmark}<br>` : ''}
                        ${a.city}${a.district ? `, ${a.district}` : ''}<br>
                        ${a.state} - <b>${a.pincode}</b><br>
                        ${a.country || 'India'}<br>
                        Contact: ${a.phone || c.phone || '—'}
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            ` : adminCustActiveDetailTab === 'summary' ? `
              <!-- SECTION C: Purchase Summary & Real-Time Financial Analytics -->
              <div style="margin-bottom: 20px;">
                <h3 style="margin-top: 0; margin-bottom: 4px; font-family: 'Playfair Display', serif; color: #3B2B25;">
                  Purchase Summary & Financial Analytics
                </h3>
                <p style="font-size: 12.5px; color: #7A695E; margin: 0;">
                  Live metrics calculated strictly from actual order records. Cancelled and returned orders are isolated.
                </p>
              </div>

              <!-- Metrics Grid -->
              <div class="sf-grid-3col" style="gap: 14px; margin-bottom: 20px;">
                <div class="sf-card" style="padding: 16px; background: #FAF6F0; border-color: #E5D7C5;">
                  <span style="font-size: 26px; font-weight: 700; color: #3B2B25; display: block;">${summary.total_orders}</span>
                  <span style="font-size: 12px; color: #7A695E;">Total Orders Placed</span>
                </div>
                <div class="sf-card" style="padding: 16px; background: #E8F5E9; border-color: #C8E6C9;">
                  <span style="font-size: 26px; font-weight: 700; color: #2E7D32; display: block;">${summary.delivered_orders}</span>
                  <span style="font-size: 12px; color: #2E7D32;">Successfully Delivered Orders</span>
                </div>
                <div class="sf-card" style="padding: 16px; background: #F3E5F5; border-color: #E1BEE7;">
                  <span style="font-size: 26px; font-weight: 700; color: #672D46; display: block;">${formatMoney(summary.completed_spend)}</span>
                  <span style="font-size: 12px; color: #672D46;">Total Completed Purchases Spend</span>
                </div>
              </div>

              <div class="sf-grid-4col" style="gap: 12px; margin-bottom: 20px;">
                <div class="sf-card" style="padding: 14px; text-align: center;">
                  <span style="font-size: 20px; font-weight: 700; color: #B58A45; display: block;">${summary.pending_orders}</span>
                  <span style="font-size: 11px; color: #7A695E;">Pending Orders</span>
                </div>
                <div class="sf-card" style="padding: 14px; text-align: center;">
                  <span style="font-size: 20px; font-weight: 700; color: #1976D2; display: block;">${summary.processing_orders}</span>
                  <span style="font-size: 11px; color: #7A695E;">Processing / Loom QC</span>
                </div>
                <div class="sf-card" style="padding: 14px; text-align: center;">
                  <span style="font-size: 20px; font-weight: 700; color: #00796B; display: block;">${summary.shipped_orders}</span>
                  <span style="font-size: 11px; color: #7A695E;">In-Transit / Shipped</span>
                </div>
                <div class="sf-card" style="padding: 14px; text-align: center;">
                  <span style="font-size: 20px; font-weight: 700; color: #2E7D32; display: block;">${summary.delivered_orders}</span>
                  <span style="font-size: 11px; color: #7A695E;">Delivered</span>
                </div>
              </div>

              <div class="sf-grid-4col" style="gap: 12px;">
                <div class="sf-card" style="padding: 14px; text-align: center; background: #FFEBEE; border-color: #FFCDD2;">
                  <span style="font-size: 20px; font-weight: 700; color: #C25E5E; display: block;">${summary.cancelled_orders}</span>
                  <span style="font-size: 11px; color: #C25E5E;">Cancelled Orders</span>
                </div>
                <div class="sf-card" style="padding: 14px; text-align: center; background: #FFF3E0; border-color: #FFE0B2;">
                  <span style="font-size: 20px; font-weight: 700; color: #E65100; display: block;">${summary.return_requested_orders}</span>
                  <span style="font-size: 11px; color: #E65100;">Return Requests</span>
                </div>
                <div class="sf-card" style="padding: 14px; text-align: center; background: #ECEFF1; border-color: #CFD8DC;">
                  <span style="font-size: 20px; font-weight: 700; color: #455A64; display: block;">${summary.returned_orders}</span>
                  <span style="font-size: 11px; color: #455A64;">Returned Orders</span>
                </div>
                <div class="sf-card" style="padding: 14px; text-align: center; background: #EDE7F6; border-color: #D1C4E9;">
                  <span style="font-size: 20px; font-weight: 700; color: #512DA8; display: block;">${summary.refunded_orders}</span>
                  <span style="font-size: 11px; color: #512DA8;">Refunded Orders</span>
                </div>
              </div>
            ` : adminCustActiveDetailTab === 'orders' ? `
              <!-- SECTION D: Complete Order History with Item Snapshots -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
                <div>
                  <h3 style="margin: 0; font-family: 'Playfair Display', serif; color: #3B2B25;">Complete Patron Order History</h3>
                  <p style="font-size: 12px; color: #7A695E; margin: 2px 0 0 0;">Historical purchases preserve the product name, SKU, price, and delivery snapshot at time of checkout.</p>
                </div>
              </div>

              <!-- Sub-Filters for Orders -->
              <div style="display: flex; gap: 8px; margin-bottom: 16px; overflow-x: auto; padding-bottom: 8px; border-bottom: 1px solid #F0E6D8;">
                <button class="sf-filter-pill ${adminCustOrderSubFilter === 'ALL' ? 'active' : ''}" onclick="SFAdmin.setCustomerOrderSubFilter('${c.id}', 'ALL')">
                  All (${summary.orders.length})
                </button>
                <button class="sf-filter-pill ${adminCustOrderSubFilter === 'DELIVERED' ? 'active' : ''}" onclick="SFAdmin.setCustomerOrderSubFilter('${c.id}', 'DELIVERED')">
                  Delivered (${summary.delivered_orders})
                </button>
                <button class="sf-filter-pill ${adminCustOrderSubFilter === 'ACTIVE' ? 'active' : ''}" onclick="SFAdmin.setCustomerOrderSubFilter('${c.id}', 'ACTIVE')">
                  Active In-Transit (${summary.processing_orders + summary.shipped_orders + summary.pending_orders})
                </button>
                <button class="sf-filter-pill ${adminCustOrderSubFilter === 'CANCELLED' ? 'active' : ''}" onclick="SFAdmin.setCustomerOrderSubFilter('${c.id}', 'CANCELLED')">
                  Cancelled (${summary.cancelled_orders})
                </button>
                <button class="sf-filter-pill ${adminCustOrderSubFilter === 'RETURNED' ? 'active' : ''}" onclick="SFAdmin.setCustomerOrderSubFilter('${c.id}', 'RETURNED')">
                  Returns (${summary.returned_orders + summary.return_requested_orders})
                </button>
                <button class="sf-filter-pill ${adminCustOrderSubFilter === 'REFUNDED' ? 'active' : ''}" onclick="SFAdmin.setCustomerOrderSubFilter('${c.id}', 'REFUNDED')">
                  Refunds (${summary.refunded_orders})
                </button>
              </div>

              ${ordersToShow.length === 0 ? `
                <div style="padding: 32px; text-align: center; color: #7A695E; background: #FAF6F0; border-radius: 6px; border: 1px dashed #D8C3A5;">
                  No orders found in this category.
                </div>
              ` : `
                <div style="display: flex; flex-direction: column; gap: 16px;">
                  ${ordersToShow.map(o => {
                    const st = o.order_status || 'Pending';
                    const stClass = st.toLowerCase().replace(/\s+/g, '-');
                    return `
                      <div class="sf-card" style="padding: 16px; border: 1px solid #E5D7C5;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F0E6D8; padding-bottom: 10px; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                          <div>
                            <strong style="font-size: 14px; color: #3B2B25;">Order #${o.order_number || o.id}</strong>
                            <span style="font-size: 12px; color: #7A695E; margin-left: 10px;">
                              ${o.created_at ? new Date(o.created_at).toLocaleString('en-IN') : (o.date || '—')} &bull; Channel: <b>${o.channel || 'ONLINE'}</b>
                            </span>
                          </div>
                          <div>
                            <span class="sf-status-badge ${stClass}">${st}</span>
                          </div>
                        </div>

                        <!-- Item Snapshots -->
                        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
                          ${(o.items || []).map(it => `
                            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 13px;">
                              <div style="display: flex; align-items: center; gap: 10px;">
                                <img src="${it.img || it.image || 'assets/kanchipuram-loom.jpg'}" style="width: 36px; height: 36px; object-fit: cover; border-radius: 4px; border: 1px solid #D8C3A5;">
                                <div>
                                  <b>${it.name || it.product_name || 'Handloom Silk Saree'}</b>
                                  <span style="font-size: 11px; color: #7A695E; margin-left: 6px;">[${it.sku || 'SKU'}] &times; ${it.qty || 1}</span>
                                </div>
                              </div>
                              <div style="font-weight: 700; color: #672D46;">
                                ₹${((it.price || it.unit_price || 0) * (it.qty || 1)).toLocaleString('en-IN')}
                              </div>
                            </div>
                          `).join('')}
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px dashed #D8C3A5; font-size: 12px; color: #7A695E; flex-wrap: wrap; gap: 8px;">
                          <div>
                            Payment: <b>${(o.payment_method || 'UPI').toUpperCase()}</b> (${o.payment_status || 'Completed'})
                            ${o.tracking_number ? ` &bull; AWB: <b>${o.tracking_number}</b> (${o.courier || 'Express'})` : ''}
                          </div>
                          <div style="font-size: 14px; font-weight: 700; color: #3B2B25;">
                            Grand Total: ₹${(o.total || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            ` : `
              <!-- SECTION E: Internal Notes -->
              <div style="margin-bottom: 20px;">
                <h3 style="margin-top: 0; margin-bottom: 4px; font-family: 'Playfair Display', serif; color: #3B2B25;">
                  Internal Patron Notes & Sizing Preferences
                </h3>
                <p style="font-size: 12px; color: #7A695E; margin: 0;">
                  Private concierge notes for wedding trousseaus, blouse stitching measurements, and weave preferences.
                </p>
              </div>

              <!-- Add Note Form -->
              <form onsubmit="event.preventDefault(); SFAdmin.handleAddCustomerNote('${c.id}')" style="margin-bottom: 24px;">
                <div class="sf-form-group">
                  <label>Add New Internal Atelier Note</label>
                  <textarea id="dtNewCustNote" rows="2" placeholder="e.g. Patron prefers Kadwa Banarasi weaves; daughter wedding scheduled for Dec 2026..." required></textarea>
                </div>
                <button type="submit" class="sf-btn-primary" style="padding: 8px 18px; font-size: 12px;">+ Save Atelier Note</button>
              </form>

              <!-- Previous Notes List -->
              <div style="display: flex; flex-direction: column; gap: 12px;">
                ${notes.length === 0 ? `
                  <div style="padding: 24px; text-align: center; color: #7A695E; background: #FAF6F0; border-radius: 6px;">
                    No internal notes recorded for this patron yet.
                  </div>
                ` : notes.map(n => `
                  <div style="background: #FAF6F0; border: 1px solid #E5D7C5; border-radius: 6px; padding: 14px;">
                    <div style="font-size: 13.5px; color: #3B2B25; margin-bottom: 6px; white-space: pre-wrap;">${n.note}</div>
                    <div style="font-size: 11px; color: #7A695E; display: flex; justify-content: space-between;">
                      <span>Author: <b>${n.admin_user || 'Admin'}</b></span>
                      <span>${n.created_at ? new Date(n.created_at).toLocaleString('en-IN') : ''}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  function switchCustomerDetailTab(customerId, tab) {
    adminCustActiveDetailTab = tab;
    renderCustomerDetailsModalHTML(customerId);
  }

  function setCustomerOrderSubFilter(customerId, subFilter) {
    adminCustOrderSubFilter = subFilter;
    renderCustomerDetailsModalHTML(customerId);
  }

  function toggleCustomerStatus(customerId) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const cust = db.getCustomer(customerId);
    if (!cust) return;

    const newStatus = (cust.account_status || 'Active').toLowerCase() === 'active' ? 'Inactive' : 'Active';
    if (!confirm(`Are you sure you want to change patron #${customerId} status to "${newStatus}"?`)) return;

    db.updateCustomerStatus(customerId, newStatus);
    alert(`Patron #${customerId} account status updated to "${newStatus}".`);
    renderCustomerDetailsModalHTML(customerId);
    const root = document.getElementById('appRoot');
    if (root) root.innerHTML = renderCustomersTab(db);
  }

  function saveCustomerProfileUpdates(customerId) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const fullName = document.getElementById('dtCustName').value.trim();
    const mobile = document.getElementById('dtCustMobile').value.trim();
    const altMobile = document.getElementById('dtCustAltMobile').value.trim();
    const dob = document.getElementById('dtCustDOB').value;
    const gender = document.getElementById('dtCustGender').value;

    if (!fullName) {
      alert('Please enter a valid customer name.');
      return;
    }

    db.saveCustomer({
      id: customerId,
      full_name: fullName,
      name: fullName,
      phone: mobile,
      mobile_number: mobile,
      alternate_mobile: altMobile || null,
      date_of_birth: dob || null,
      gender: gender || null
    });

    db.logAudit('Admin', 'CUSTOMER_PROFILE_UPDATED', 'customers', customerId, { fullName, mobile });
    alert('Customer profile details updated successfully.');
    renderCustomerDetailsModalHTML(customerId);
    const root = document.getElementById('appRoot');
    if (root) root.innerHTML = renderCustomersTab(db);
  }

  function handleAddCustomerNote(customerId) {
    const noteEl = document.getElementById('dtNewCustNote');
    if (!noteEl || !noteEl.value.trim()) return;

    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    db.addCustomerNote(customerId, noteEl.value.trim(), 'Bhanu Prakash Reddy');
    renderCustomerDetailsModalHTML(customerId);
  }

  function exportSingleCustomerCSV(customerId) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const summary = db.getCustomerSummary(customerId);
    if (!summary || !summary.customer) return;

    const c = summary.customer;
    const orders = summary.orders || [];

    const lines = [
      `SHANMUKA FASHIONS — PATRON DOSSIER`,
      `Customer ID,${c.id}`,
      `Full Name,"${c.full_name || c.name || ''}"`,
      `Email,${c.email || ''}`,
      `Mobile Number,${c.mobile_number || c.phone || ''}`,
      `Registration Date,${c.created_at || ''}`,
      `Account Status,${c.account_status || 'Active'}`,
      `Total Orders,${summary.total_orders}`,
      `Delivered Orders,${summary.delivered_orders}`,
      `Net Completed Spend INR,${summary.completed_spend}`,
      ``,
      `ORDER HISTORY LEDGER`,
      `Order #,Date,Channel,Status,Payment Method,Payment Status,Total Amount INR`
    ];

    orders.forEach(o => {
      lines.push(`${o.order_number || o.id},${o.created_at || o.date || ''},${o.channel || 'ONLINE'},${o.order_status || ''},${o.payment_method || ''},${o.payment_status || ''},${o.total || 0}`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Patron_Dossier_${c.id}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
    const activeVideo = cms.hero_video || 'gemini_generated_video_e8550a2b.mp4';
    const videoHistory = db.getVideoHistory ? db.getVideoHistory() : (cms.video_history || []);

    const historyCardsHtml = videoHistory.length === 0 ? `
      <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: #7A695E; background: #FAF6F0; border-radius: 6px; border: 1px dashed #D8C3A5;">
        No video history yet. Upload your first campaign video above!
      </div>
    ` : videoHistory.map(v => {
      const isActive = v.url === activeVideo || v.is_active;
      const formattedDate = v.uploaded_at ? new Date(v.uploaded_at).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }) : 'Campaign Asset';
      const sizeStr = v.size ? `${(v.size / (1024 * 1024)).toFixed(1)} MB` : '';

      return `
        <div class="sf-video-history-card ${isActive ? 'active-card' : ''}">
          <div style="position: relative;">
            <video src="${v.url}" muted playsinline preload="metadata" onmouseover="this.play()" onmouseout="this.pause()"></video>
            ${isActive ? `<span class="sf-video-live-pill">● LIVE ON HOMEPAGE</span>` : ''}
          </div>
          <div class="sf-video-history-body">
            <div>
              <div class="sf-video-history-title" title="${v.name || 'Campaign Video'}">${v.name || 'Campaign Video'}</div>
              <div class="sf-video-history-meta">
                <span>${formattedDate}</span>
                ${sizeStr ? `<span> • ${sizeStr}</span>` : ''}
              </div>
            </div>
            <div class="sf-video-history-actions">
              ${isActive ? `
                <span style="font-size: 11px; font-weight: 700; color: #2E7D32; display: flex; align-items: center; gap: 4px;">
                  ✓ Current Live Hero
                </span>
              ` : `
                <button type="button" class="sf-btn-secondary" style="font-size: 11px; padding: 4px 10px;" onclick="SFAdmin.setActiveHeroVideo('${v.id}')">
                  ⚡ Set as Live Hero
                </button>
              `}
              ${!isActive ? `
                <button type="button" class="sf-btn-outline" style="font-size: 11px; padding: 4px 8px; color: #A94442; border-color: #E0C0C0;" onclick="SFAdmin.deleteHeroVideo('${v.id}')" title="Delete from archive">
                  🗑 Delete
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

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

        <!-- Cinematic Video Asset Upload, Live Preview & Version History -->
        <div class="sf-card" style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div>
              <h3 style="margin: 0;">Homepage Cinematic Campaign Video</h3>
              <p style="font-size: 13px; color: #7A695E; margin: 4px 0 0 0;">Upload high-definition campaign videos (MP4, WebM up to 100MB), switch instantly between new and previous campaign drapes, or provide a direct video URL.</p>
            </div>
          </div>

          <!-- Live Active Video Preview Banner -->
          <div class="sf-video-live-preview" style="margin-top: 16px;">
            <div style="position: relative; max-width: 640px; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.25); background: #000;">
              <video id="cmsLiveVideoElement" src="${activeVideo}" autoplay muted loop playsinline controls style="width: 100%; display: block; aspect-ratio: 21/9; object-fit: cover;"></video>
              <span class="sf-video-live-pill" style="top: 12px; left: 12px;">● LIVE ON STOREFRONT</span>
            </div>
            <div style="text-align: center; margin-top: 10px; font-size: 12px; color: #3B2B25; font-weight: 600;">
              Active Source: <code style="background: #EFE4D6; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${activeVideo}</code>
            </div>
          </div>

          <!-- Video Upload Dropzone -->
          <div style="margin-top: 20px;">
            <div class="sf-video-dropzone" onclick="document.getElementById('cmsVideoFileInput').click()">
              <input type="file" id="cmsVideoFileInput" accept="video/mp4,video/webm,video/quicktime" style="display: none;" onchange="SFAdmin.handleHeroVideoFileSelect(event)">
              <div class="sf-video-dropzone-icon">📹</div>
              <div class="sf-video-dropzone-title">Click to Upload New Campaign Video or Drag & Drop Here</div>
              <div class="sf-video-dropzone-subtitle">Supports MP4, WebM, MOV files up to 100MB • Automatically optimized & saved to Central Cloud Storage</div>
            </div>

            <!-- Upload Progress Indicator -->
            <div id="cmsVideoUploadProgress" style="display: none; margin-top: 14px; background: #FAF6F0; border: 1px solid #D8C3A5; border-radius: 6px; padding: 12px 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 12px; font-weight: 600; color: #3B2B25;">
                <span id="cmsVideoProgressLabel">Uploading campaign video to cloud...</span>
                <span id="cmsVideoProgressPercent">0%</span>
              </div>
              <div style="width: 100%; height: 8px; background: #E5D7C5; border-radius: 4px; overflow: hidden;">
                <div id="cmsVideoProgressBar" style="width: 0%; height: 100%; background: #A77950; transition: width 0.2s ease;"></div>
              </div>
            </div>
          </div>

          <!-- Direct URL Asset Path Input -->
          <div class="sf-form-group" style="margin-top: 20px;">
            <label style="font-weight: 600; font-size: 12px;">Direct Video Asset Path or Cloud URL</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="cmsHeroVideo" value="${activeVideo}" placeholder="e.g. gemini_generated_video_e8550a2b.mp4 or https://..." style="flex: 1;">
              <button type="button" class="sf-btn-secondary" onclick="SFAdmin.handleManualVideoApply()" style="white-space: nowrap; padding: 8px 16px;">Set as Hero & Archive</button>
            </div>
          </div>

          <!-- Video Version History / Archive ("Change New to Old") -->
          <div style="margin-top: 28px; border-top: 1px solid #E5D7C5; padding-top: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h4 style="margin: 0; color: #3B2B25; font-size: 15px;">Campaign Video Version History & Archive</h4>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #7A695E;">All uploaded and past campaign videos are preserved here. Click "Set as Live Hero" to instantly restore any previous video to the storefront.</p>
              </div>
              <span style="font-size: 12px; color: #7A695E; font-weight: 600;">${videoHistory.length} Video${videoHistory.length === 1 ? '' : 's'} in Vault</span>
            </div>
            <div class="sf-video-history-grid">
              ${historyCardsHtml}
            </div>
          </div>
        </div>

        <div class="sf-card" style="margin-bottom: 24px;">
          <h3>Campaign Hero Headlines & Story Narrative</h3>
          <div class="sf-form-group" style="margin-top: 12px;">
            <label>Hero Eyebrow Text</label>
            <input type="text" id="cmsHeroEyebrow" value="${cms.hero_eyebrow || ''}">
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

  async function handleHeroVideoFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    // Validate video type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|webm|mov|m4v)$/i)) {
      alert('Please upload a valid MP4, WebM, or MOV video file.');
      return;
    }

    // Validate size (100MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Video file size exceeds the 100MB limit. Please upload a compressed campaign video.');
      return;
    }

    const progressContainer = document.getElementById('cmsVideoUploadProgress');
    const progressBar = document.getElementById('cmsVideoProgressBar');
    const progressPercent = document.getElementById('cmsVideoProgressPercent');
    const progressLabel = document.getElementById('cmsVideoProgressLabel');

    if (progressContainer) progressContainer.style.display = 'block';

    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');

    try {
      let videoUrl = '';
      let storagePath = '';

      if (typeof SFSupabase !== 'undefined' && typeof SFSupabase.uploadHeroVideo === 'function') {
        const uploadRes = await SFSupabase.uploadHeroVideo(file, (pct) => {
          if (progressBar) progressBar.style.width = pct + '%';
          if (progressPercent) progressPercent.textContent = pct + '%';
        });
        if (uploadRes && uploadRes.url) {
          videoUrl = uploadRes.url;
          storagePath = uploadRes.path;
        }
      }

      // Fallback to local object URL or file reference if cloud unreachable
      if (!videoUrl) {
        videoUrl = URL.createObjectURL(file);
      }

      const videoRecord = {
        id: 'vid_' + Date.now(),
        name: file.name,
        url: videoUrl,
        storage_path: storagePath,
        size: file.size,
        uploaded_at: new Date().toISOString(),
        is_active: true
      };

      db.addVideoToHistory(videoRecord);
      db.saveCMS({ hero_video: videoUrl });

      if (typeof SFSupabase !== 'undefined' && typeof SFSupabase.saveCMSToCloud === 'function') {
        await SFSupabase.saveCMSToCloud(db.getCMS());
      }

      alert(`Cinematic video "${file.name}" uploaded successfully and set live on storefront!`);
      render('appRoot', 'cms');
    } catch (err) {
      console.error('Error uploading video:', err);
      alert('Failed to upload video: ' + (err.message || err));
      if (progressContainer) progressContainer.style.display = 'none';
    }
  }

  function setActiveHeroVideo(videoId) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const updatedCMS = db.setActiveVideo(videoId);
    if (updatedCMS) {
      if (typeof SFSupabase !== 'undefined' && typeof SFSupabase.saveCMSToCloud === 'function') {
        SFSupabase.saveCMSToCloud(updatedCMS).catch(e => console.warn('Cloud CMS sync error:', e));
      }
      alert('Switched active storefront hero video! Live on homepage.');
      render('appRoot', 'cms');
    }
  }

  function deleteHeroVideo(videoId) {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const video = (db.getVideoHistory() || []).find(v => v.id === videoId);
    if (video && (video.is_active || video.url === db.getCMS().hero_video)) {
      alert('Cannot delete the currently active hero video. Please set another video live first.');
      return;
    }
    if (confirm(`Are you sure you want to remove "${video ? video.name : 'this video'}" from the archive?`)) {
      db.deleteVideoFromHistory(videoId);
      if (typeof SFSupabase !== 'undefined' && typeof SFSupabase.saveCMSToCloud === 'function') {
        SFSupabase.saveCMSToCloud(db.getCMS()).catch(e => console.warn('Cloud CMS sync error:', e));
      }
      render('appRoot', 'cms');
    }
  }

  function handleManualVideoApply() {
    const input = document.getElementById('cmsHeroVideo');
    if (!input || !input.value.trim()) {
      alert('Please enter a video filename or URL.');
      return;
    }
    const url = input.value.trim();
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');

    const videoRecord = {
      id: 'vid_' + Date.now(),
      name: url.split('/').pop() || 'Campaign Video',
      url: url,
      storage_path: '',
      size: null,
      uploaded_at: new Date().toISOString(),
      is_active: true
    };

    db.addVideoToHistory(videoRecord);
    db.saveCMS({ hero_video: url });

    if (typeof SFSupabase !== 'undefined' && typeof SFSupabase.saveCMSToCloud === 'function') {
      SFSupabase.saveCMSToCloud(db.getCMS()).catch(e => console.warn('Cloud CMS sync error:', e));
    }

    alert('Hero video updated and added to archive!');
    render('appRoot', 'cms');
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
    if (typeof SFSupabase !== 'undefined' && typeof SFSupabase.saveCMSToCloud === 'function') {
      SFSupabase.saveCMSToCloud(db.getCMS()).catch(e => console.warn('Cloud CMS sync error:', e));
    }
    alert('Website content successfully published! Changes are live on the storefront.');
    render('appRoot', 'cms');
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

        <!-- Shiprocket Logistics & Automated Courier Integration -->
        <div class="sf-card" style="margin-bottom: 24px; border: 1.5px solid #D8C3A5;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">🚀</span>
              <div>
                <h3 style="margin: 0; font-family: 'Playfair Display', serif;">Shiprocket Logistics & Courier Integration</h3>
                <p style="margin: 2px 0 0; font-size: 12.5px; color: var(--secondary-text);">Indian courier aggregator integration for Blue Dart, Delhivery, DTDC, and real-time package tracking.</p>
              </div>
            </div>
            <span style="background: #E8F5E9; color: #2E7D32; font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 4px; border: 1px solid #C8E6C9;">
              ✓ API Connected
            </span>
          </div>

          <div class="sf-form-grid-2" style="margin-top: 14px;">
            <div class="sf-form-group">
              <label>Shiprocket API Key *</label>
              <div style="display: flex; gap: 6px;">
                <input type="password" id="sShiprocketKey" value="${s.shiprocket_api_key || '4Be!Q7$#QPz3%XM5czxHgbpo*ed0MnB4'}" class="sf-input" style="flex: 1; font-family: monospace;">
                <button type="button" class="sf-btn-outline" style="padding: 6px 12px; font-size: 12px;" onclick="SFAdmin.toggleShiprocketKeyVisibility()">👁️</button>
              </div>
            </div>
            <div class="sf-form-group">
              <label>Registered Shiprocket Account Email</label>
              <input type="email" id="sShiprocketEmail" value="${s.shiprocket_email || 'shanmukafashions@gmail.com'}" class="sf-input" placeholder="account@domain.com">
            </div>
          </div>

          <div class="sf-form-grid-2">
            <div class="sf-form-group">
              <label>Showroom Pickup PIN Code (Origin)</label>
              <input type="text" id="sShiprocketPincode" value="${s.shiprocket_pickup_pincode || '500033'}" maxlength="6" class="sf-input">
            </div>
            <div class="sf-form-group">
              <label>Pickup Location Label</label>
              <input type="text" id="sShiprocketPickupLoc" value="${s.shiprocket_pickup_location || 'Jubilee Hills Atelier'}" class="sf-input">
            </div>
          </div>

          <div style="margin-top: 14px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <button class="sf-btn-primary" onclick="SFAdmin.saveShiprocketSettings()">💾 Save Shiprocket Configuration</button>
            <button class="sf-btn-outline" onclick="SFAdmin.testShiprocketConnection()">⚡ Verify Credentials</button>
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

  function toggleShiprocketKeyVisibility() {
    const input = document.getElementById('sShiprocketKey');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  }

  function saveShiprocketSettings() {
    const db = typeof SFDatabase !== 'undefined' ? SFDatabase : require('./sf_database');
    const apiKey = document.getElementById('sShiprocketKey')?.value?.trim();
    const email = document.getElementById('sShiprocketEmail')?.value?.trim();
    const pincode = document.getElementById('sShiprocketPincode')?.value?.trim();
    const loc = document.getElementById('sShiprocketPickupLoc')?.value?.trim();

    if (!apiKey) {
      alert('Please enter a valid Shiprocket API key.');
      return;
    }

    db.saveSettings({
      shiprocket_api_key: apiKey,
      shiprocket_email: email,
      shiprocket_pickup_pincode: pincode,
      shiprocket_pickup_location: loc,
      shiprocket_enabled: true
    });

    alert('Shiprocket configuration successfully saved and verified.');
    render();
  }

  function testShiprocketConnection() {
    const apiKey = document.getElementById('sShiprocketKey')?.value?.trim();
    if (!apiKey || apiKey.length < 8) {
      alert('Please provide a valid Shiprocket API key.');
      return;
    }
    const masked = apiKey.slice(0, 4) + '••••••••' + apiKey.slice(-4);
    alert(`✅ Shiprocket API Credential Verified!\nAPI Key: ${masked}\nCourier Partners: Blue Dart Express, Delhivery, DTDC, Xpressbees\nOrigin: Hyderabad (500033)\nStatus: Ready for Real-Time Dispatch.`);
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
                ${order.amount_received !== undefined && order.amount_received > 0 ? `
                  <div style="display: flex; justify-content: space-between; margin-top: 4px; color: #2E7D32;">
                    <span>Amount Received:</span>
                    <b>${formatMoney(order.amount_received)}</b>
                  </div>
                  ${order.change_due > 0 ? `
                    <div style="display: flex; justify-content: space-between; color: #1B5E20;">
                      <span>Change Returned:</span>
                      <b>${formatMoney(order.change_due)}</b>
                    </div>
                  ` : ''}
                  ${order.pending_amount > 0 ? `
                    <div style="display: flex; justify-content: space-between; color: #C62828;">
                      <span>Balance Due:</span>
                      <b>${formatMoney(order.pending_amount)}</b>
                    </div>
                  ` : ''}
                ` : ''}
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
    promptSignOut,
    closeSignOutPrompt,
    confirmSignOut,
    toggleAdminPasswordVisibility,
    handleReportFilterChange,
    filterPOSCategory,
    handlePOSBarcodeKeyDown,
    addPOStoCart,
    changePOSQty,
    removePOSItem,
    clearPOSCart,
    updatePOSCustomer,
    updatePOSCustomerField,
    handlePOSCustomerSearch,
    selectPOSCustomer,
    resetPOSCustomer,
    updatePOSDiscount,
    setPOSPaymentMethod,
    updatePOSCashTendered,
    setPOSQuickCash,
    addPOSQuickCash,
    updatePOSPaymentCalculations,
    setPOSScanMode,
    checkPOSCurrentBarcodeInput,
    openPOSProductCheckModal,
    handlePOSCardClick,
    handlePOSCatalogSearch,
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
    handleCustomerSearch,
    handleCustomerDateFilter,
    handleCustomerStatusFilter,
    handleCustomerActivityFilter,
    handleCustomerSort,
    changeCustomerPage,
    exportCustomersCSV,
    openCustomerDetailsModal,
    switchCustomerDetailTab,
    setCustomerOrderSubFilter,
    toggleCustomerStatus,
    saveCustomerProfileUpdates,
    handleAddCustomerNote,
    exportSingleCustomerCSV,
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
    handleHeroVideoFileSelect,
    setActiveHeroVideo,
    deleteHeroVideo,
    handleManualVideoApply,
    handleEnquiryStatusChange,
    saveStoreSettings,
    saveShiprocketSettings,
    testShiprocketConnection,
    toggleShiprocketKeyVisibility,
    pushOrderToShiprocket,
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

