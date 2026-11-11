/**
 * Shanmuka Fashions — Central Database & Retail Engine
 * Unified relational data store, inventory ledger, transactions, and CMS.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SFDatabase = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const STORAGE_KEY = 'sf_central_retail_db_live_v2026';

  // Production Clean Master Schema (Zero Mock / Dummy Fallback Data)
  const CLEAN_SEED = {
    settings: {
      store_name: 'Shanmuka Fashions',
      tagline: 'Sarees & More — Elegance Woven Through Generations',
      owner_name: 'Bhanu Prakash Reddy',
      phone: '+91 95421 56929',
      whatsapp: '9542156929',
      email: 'concierge@shanmukafashions.com',
      showroom_address: 'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
      showroom_hours: 'Monday – Sunday: 10:00 AM – 9:00 PM (IST)',
      currency: 'INR',
      currency_symbol: '₹',
      gst_registered: true,
      gstin: '36AAECS9843K1ZN',
      default_gst_percent: 5,
      free_shipping_threshold: 15000,
      standard_shipping_charge: 350,
      invoice_prefix: 'SF-INV-2026-',
      pos_prefix: 'POS-2026-',
      receipt_header: 'SHANMUKA FASHIONS\\nFlagship Saree Atelier, Jubilee Hills, Hyderabad\\nGSTIN: 36AAECS9843K1ZN • WhatsApp: +91 95421 56929',
      receipt_footer: 'Silk Mark Certified Pure Handloom Sarees.\\nExchanges accepted within 7 days with price tag and original invoice.\\nThank you for choosing Shanmuka Fashions!',
      low_stock_threshold: 2,
      shiprocket_enabled: true,
      shiprocket_api_key: '4Be!Q7$#QPz3%XM5czxHgbpo*ed0MnB4',
      shiprocket_email: 'shanmukafashions@gmail.com',
      shiprocket_pickup_pincode: '500033',
      shiprocket_pickup_location: 'Jubilee Hills Atelier'
    },
    auth: {
      username: 'admin',
      password_hash: 'admin123',
      session_token: null,
      session_expiry: null,
      owner_name: 'Bhanu Prakash Reddy'
    },
    cms: {
      announcement_bar: 'COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹15,000 • SHANMUKA FASHIONS • WHATSAPP CONCIERGE',
      hero_eyebrow: 'Traditional Indian Saree Heritage',
      hero_heading: 'Heritage Weaves for the Modern Woman',
      hero_tagline: 'Elegance Woven Through Generations.',
      hero_narrative: 'Discover the timeless grandeur of certified pure handloom silks, authentic temple borders, and heirloom brocades hand-crafted by multi-generational master weavers.',
      hero_video: 'gemini_generated_video_e8550a2b.mp4',
      story_heading: 'Elegance Woven Through Generations',
      story_narrative_1: 'The Indian handloom saree is a living testament to thousands of years of textile artistry. At Shanmuka Fashions, we celebrate the generational wisdom of master artisan communities across Kanchipuram, Varanasi, Dharmavaram, and Chanderi.',
      story_narrative_2: 'Each drape represents painstaking devotion—from the spinning of pure mulberry silk yarns to the hand-setting of Jacquard punch cards and tested gold zari borders. We honor these timeless weaving traditions by curating authentic heirloom sarees for celebrations that last a lifetime.',
      whatsapp_number: '9542156929',
      phone_display: '+91 95421 56929',
      showroom_address: 'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
      video_history: [
        {
          id: 'VID-ORIGINAL-01',
          name: 'Royal Atelier Loom Weaving (Original Cinematic Drape)',
          url: 'gemini_generated_video_e8550a2b.mp4',
          size: '14.8 MB',
          uploaded_at: '2026-11-08T10:00:00Z',
          is_active: true
        }
      ]
    },
    coupons: [
      {
        id: 'COUP-01',
        code: 'FESTIVE10',
        type: 'PERCENT',
        value: 10,
        min_order: 5000,
        usage_limit: 100,
        usage_count: 0,
        valid_from: '2026-10-01',
        valid_to: '2026-12-31',
        is_active: true
      },
      {
        id: 'COUP-02',
        code: 'BRIDAL2000',
        type: 'FLAT',
        value: 2000,
        min_order: 15000,
        usage_limit: 50,
        usage_count: 0,
        valid_from: '2026-10-01',
        valid_to: '2026-12-31',
        is_active: true
      },
      {
        id: 'COUP-03',
        code: 'SHANMUKA5',
        type: 'PERCENT',
        value: 5,
        min_order: 3000,
        usage_limit: 500,
        usage_count: 0,
        valid_from: '2026-01-01',
        valid_to: '2026-12-31',
        is_active: true
      }
    ],
    printer_configuration: {
      printer_name: 'Shanmuka Thermal Label Printer (TSC / Zebra / Xprinter)',
      connection_type: 'BROWSER_DIRECT',
      printer_language: 'BROWSER_PDF',
      sticker_width: 50,
      sticker_height: 30,
      label_gap: 3,
      print_darkness: 10,
      print_speed: 3,
      include_branding: true,
      include_price: true,
      include_sku: true,
      include_category: true,
      font_size: 'normal',
      barcode_height: 28
    },
    products: [],
    inventory_ledger: [],
    orders: [],
    customers: [],
    customer_addresses: [],
    customer_notes: [],
    suppliers: [],
    purchases: [],
    expenses: [],
    enquiries: [],
    reviews: [],
    audit_logs: [],
    barcode_print_history: [],
    inventory_units: []
  };

  const DEMO_SEED = CLEAN_SEED;
  const EMPTY_SEED = CLEAN_SEED;
  const INITIAL_SEED = CLEAN_SEED;

  class DatabaseEngine {
    constructor() {
      this.state = null;
      this.listeners = [];
      this.init();
    }

    _sanitize(state) {
      if (!state) return;
      const mockNames = [
        'Royal Kanchipuram Pure Silk Saree',
        'Banarasi Heritage Meenakari Weave',
        'Floral Organza Tissue Saree',
        'Festive Peacock Zari Silk Saree',
        'Everyday Handloom Cotton Grace',
        'Bridal Kanchipuram Gold Brocade',
        'Banarasi Celebration Silk Saree',
        'Tissue Kanchipuram Regal Gold',
        'Heritage Patola Silk Saree',
        'Chanderi Zari Floral Saree',
        'Vintage Temple Border Silk',
        'Lilac Sheer Organza Saree',
        'Royal Velvet Zardozi Saree',
        'Sapphire Tapestry Designer Saree'
      ];
      if (Array.isArray(state.products)) {
        state.products = state.products.filter(p => {
          if (!p) return false;
          if (mockNames.includes(p.name)) return false;
          if (typeof p.sku === 'string' && /^SF-(KNC|BNR|ORG|SLK|COT|TIS|PAT|CHN|VEL|DSG)-0[0-1][0-9]$/.test(p.sku)) return false;
          return true;
        });
      }
      if (Array.isArray(state.orders)) {
        state.orders = state.orders.filter(o => {
          if (!o) return false;
          const num = String(o.order_number || o.id || '');
          if (num.startsWith('SF-849') || num === 'POS-2026-001' || num === 'SF-ORD-2026-001') return false;
          if (['Dr. Madhavi Varma', 'Kavita Reddy', 'Pooja Sharma', 'Ananya Iyer'].includes(o.customer_name)) return false;
          return true;
        });
      }
      if (Array.isArray(state.customers)) {
        state.customers = state.customers.filter(c => {
          if (!c) return false;
          return !['Pooja Sharma', 'Ananya Iyer', 'Deepa Rao', 'Kavya Reddy', 'Sneha Patel'].includes(c.name);
        });
      }
      if (Array.isArray(state.suppliers)) {
        state.suppliers = state.suppliers.filter(s => {
          if (!s) return false;
          return !['Kanchipuram Master Weavers Co-op', 'Varanasi Heritage Zari Works', 'Bangalore Silk Filature Mills', 'Salem Dobby Looms'].includes(s.name);
        });
      }
      if (Array.isArray(state.expenses)) {
        state.expenses = state.expenses.filter(e => {
          if (!e) return false;
          return !['Showroom Rent', 'Weavers Guild Advance', 'Electricity & Utilities', 'Luxury Packaging Boxes', 'Security & Maintenance'].some(desc => (e.description || '').includes(desc));
        });
      }
      if (Array.isArray(state.enquiries)) {
        state.enquiries = state.enquiries.filter(eq => {
          if (!eq) return false;
          return !['Pooja Sharma', 'Meera Reddy', 'Meenakshi Iyer', 'Sunita Reddy'].includes(eq.name);
        });
      }
      if (Array.isArray(state.inventory_ledger)) {
        state.inventory_ledger = state.inventory_ledger.filter(l => {
          if (!l) return false;
          if (mockNames.includes(l.product_name)) return false;
          if (typeof l.sku === 'string' && /^SF-(KNC|BNR|ORG|SLK|COT|TIS|PAT|CHN|VEL|DSG)-0[0-1][0-9]$/.test(l.sku)) return false;
          return true;
        });
      }
    }

    init() {
      // 1. Purge legacy mock data cache from previous sessions
      try {
        if (typeof localStorage !== 'undefined') {
          const legacyKeys = [
            'sf_central_retail_db_production',
            'sf_central_retail_db_v1',
            'sf_central_retail_db_v2',
            'sf_products_tw_v3',
            'sf_orders_tw',
            'sf_enquiries_tw'
          ];
          legacyKeys.forEach(k => localStorage.removeItem(k));
        }
      } catch (e) {}

      // 2. Load production state or initialize clean empty schema
      try {
        if (typeof localStorage !== 'undefined') {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            this.state = JSON.parse(stored);
            this._sanitize(this.state);
            if (!this.state.products || !this.state.inventory_ledger) {
              this.state = JSON.parse(JSON.stringify(INITIAL_SEED));
              this.commit();
            }
          } else {
            this.state = JSON.parse(JSON.stringify(INITIAL_SEED));
            this.commit();
          }
        } else {
          this.state = JSON.parse(JSON.stringify(INITIAL_SEED));
        }
      } catch (e) {
        console.warn('Database initialization fallback to clean schema:', e);
        this.state = JSON.parse(JSON.stringify(INITIAL_SEED));
      }

      // 3. Asynchronously synchronize with Cloud Supabase in browser environment
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          this.syncWithCloud().catch(() => {});
        }, 10);
      }
    }

    commit() {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        }
      } catch (e) {
        console.error('Failed to commit database state to localStorage:', e);
      }
      this.notifyListeners();
    }

    subscribe(fn) {
      if (typeof fn === 'function') {
        this.listeners.push(fn);
      }
    }

    notifyListeners() {
      for (const fn of this.listeners) {
        try { fn(this.state); } catch (e) { console.error('Listener error:', e); }
      }
    }

    logAudit(action, entity, entity_id, details, user = 'Bhanu (Owner)') {
      const log = {
        id: 'AUDIT-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        timestamp: new Date().toISOString(),
        action,
        entity,
        entity_id: String(entity_id),
        details,
        user
      };
      this.state.audit_logs.unshift(log);
      if (this.state.audit_logs.length > 500) this.state.audit_logs.pop();
    }

    // ── PRODUCTS & CATALOGUE ──
    getProducts() {
      return this.state.products || [];
    }

    getProduct(id) {
      const numId = parseInt(id, 10);
      return this.getProducts().find(p => p.id === numId);
    }

    getProductBySkuOrBarcode(code) {
      if (!code) return null;
      const clean = String(code).trim().toLowerCase();
      // 1. Direct SKU, Barcode, or ID match
      const directMatch = this.getProducts().find(p =>
        (p.sku && p.sku.toLowerCase() === clean) ||
        (p.barcode && p.barcode.toLowerCase() === clean) ||
        (p.id && String(p.id) === clean)
      );
      if (directMatch) return directMatch;

      // 2. Serialized Individual Unit Barcode match (e.g. SF26010001-01)
      if (this.state.inventory_units && Array.isArray(this.state.inventory_units)) {
        const unit = this.state.inventory_units.find(u => u.unit_barcode && u.unit_barcode.toLowerCase() === clean);
        if (unit) {
          const parent = this.getProduct(unit.product_id);
          if (parent) {
            return {
              ...parent,
              scanned_unit: unit
            };
          }
        }
      }
      return null;
    }

    saveProduct(prodData, adminUser = 'Bhanu (Owner)') {
      if (!prodData.name || !prodData.price) {
        throw new Error('Product name and selling price are required.');
      }

      const products = this.state.products;
      const isEdit = prodData.id && products.some(p => p.id === parseInt(prodData.id, 10));

      if (isEdit) {
        const id = parseInt(prodData.id, 10);
        const idx = products.findIndex(p => p.id === id);
        const existing = products[idx];
        const oldStock = existing.stock_qty;
        const newStock = parseInt(prodData.stock_qty !== undefined ? prodData.stock_qty : existing.stock_qty, 10);
        const newPrice = parseInt(prodData.price, 10);
        const isPriceChanged = existing.price !== newPrice;

        // Barcode permanence: preserve existing barcode unless explicitly edited with uniqueness check
        let barcode = existing.barcode;
        if (prodData.barcode && prodData.barcode.trim() !== existing.barcode) {
          const bcVal = this.validateBarcodeUniqueness(prodData.barcode, id);
          if (!bcVal.valid) throw new Error(bcVal.message);
          barcode = prodData.barcode.trim();
        }

        // SKU uniqueness validation
        let sku = existing.sku;
        if (prodData.sku && prodData.sku.trim().toUpperCase() !== existing.sku) {
          const skuVal = this.validateSkuUniqueness(prodData.sku, id);
          if (!skuVal.valid) throw new Error(skuVal.message);
          sku = prodData.sku.trim().toUpperCase();
        }

        // Update product
        const updated = {
          ...existing,
          ...prodData,
          id,
          sku,
          barcode,
          barcode_type: existing.barcode_type || 'CODE128',
          tracking_mode: prodData.tracking_mode || existing.tracking_mode || 'PRODUCT',
          barcode_status: 'VERIFIED',
          price: newPrice,
          old: prodData.old ? parseInt(prodData.old, 10) : existing.old,
          purchase_cost: prodData.purchase_cost ? parseInt(prodData.purchase_cost, 10) : (existing.purchase_cost || Math.round(newPrice * 0.58)),
          stock_qty: newStock,
          low_stock_threshold: prodData.low_stock_threshold ? parseInt(prodData.low_stock_threshold, 10) : 2,
          stock: newStock <= 0 ? 'Sold Out' : (newStock <= 2 ? 'Low Stock' : 'In Stock'),
          price_outdated: isPriceChanged && existing.last_printed_price && existing.last_printed_price !== newPrice
        };
        products[idx] = updated;

        // If stock changed directly in edit form, record in ledger
        if (oldStock !== newStock) {
          const diff = newStock - oldStock;
          this.recordLedgerEntry({
            product_id: id,
            sku: updated.sku,
            product_name: updated.name,
            type: 'ADJUSTMENT',
            prev_qty: oldStock,
            change_qty: diff,
            new_qty: newStock,
            reason: prodData.adjustment_reason || 'Product catalog manual stock update',
            reference_id: 'EDIT-' + id,
            channel: 'ADMIN',
            admin_user: adminUser
          });
        }

        this.logAudit('PRODUCT_UPDATE', 'PRODUCT', id, `Updated product "${updated.name}" (${updated.sku})`, adminUser);
        this.commit();
        const sbUpdate = (typeof SFSupabase !== 'undefined') ? SFSupabase : (typeof window !== 'undefined' && window.SFSupabase ? window.SFSupabase : null);
        if (sbUpdate && typeof sbUpdate.saveProductToCloud === 'function') {
          sbUpdate.saveProductToCloud(updated).catch(e => console.warn('Supabase product cloud sync:', e));
        }
        return updated;
      } else {
        // Create new Saree
        const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
        const category = prodData.category || 'Silk';

        // 1. Auto-generate or validate SKU
        let sku = prodData.sku ? prodData.sku.trim().toUpperCase() : this.generateNextSku(category);
        const skuCheck = this.validateSkuUniqueness(sku);
        if (!skuCheck.valid) {
          if (prodData.sku) throw new Error(skuCheck.message);
          sku = this.generateNextSku(category);
        }

        // 2. Auto-generate or validate Barcode (Code 128 Internal Standard)
        let barcode = prodData.barcode ? prodData.barcode.trim() : this.generateNextBarcode(category);
        const barcodeCheck = this.validateBarcodeUniqueness(barcode);
        if (!barcodeCheck.valid) {
          if (prodData.barcode) throw new Error(barcodeCheck.message);
          barcode = this.generateNextBarcode(category);
        }

        const stockQty = parseInt(prodData.stock_qty || 0, 10);
        const price = parseInt(prodData.price, 10);
        const purchaseCost = parseInt(prodData.purchase_cost || Math.round(price * 0.58), 10);

        const newProd = {
          id: newId,
          sku,
          barcode,
          barcode_type: 'CODE128',
          tracking_mode: prodData.tracking_mode || 'PRODUCT',
          barcode_status: 'VERIFIED',
          last_printed_price: null,
          last_printed_at: null,
          price_outdated: false,
          name: prodData.name.trim(),
          category: prodData.category || 'Silk',
          collection: prodData.collection || 'Heirloom Edits',
          fabric: prodData.fabric || 'Pure Silk',
          color: prodData.color || 'Royal Classic',
          material: prodData.material || 'Pure Mulberry Silk (Silk Mark Certified)',
          weave: prodData.weave || 'Traditional Handloom',
          pattern: prodData.pattern || 'Heritage Zari Work',
          occasion: prodData.occasion || 'Bridal & Wedding',
          saree_length: prodData.saree_length || '6.3 Metres (incl. 0.8m Blouse)',
          blouse_piece: prodData.blouse_piece || 'Included (Unstitched)',
          purchase_cost: purchaseCost,
          price,
          old: prodData.old ? parseInt(prodData.old, 10) : Math.round(price * 1.25),
          stock_qty: stockQty,
          low_stock_threshold: prodData.low_stock_threshold ? parseInt(prodData.low_stock_threshold, 10) : 2,
          stock: stockQty <= 0 ? 'Sold Out' : (stockQty <= 2 ? 'Low Stock' : 'In Stock'),
          badge: prodData.badge || 'New Arrival',
          status: prodData.status || 'Published',
          is_featured: !!prodData.is_featured,
          img: prodData.img || 'assets/kanchipuram-loom.jpg',
          images: prodData.images && prodData.images.length ? prodData.images : [prodData.img || 'assets/kanchipuram-loom.jpg'],
          video: prodData.video || '',
          rating: 5.0,
          reviewsCount: 1,
          desc: prodData.desc || 'Authentic pure handloom saree crafted by master weavers.'
        };

        products.unshift(newProd);

        if (stockQty > 0) {
          this.recordLedgerEntry({
            product_id: newId,
            sku,
            product_name: newProd.name,
            type: 'STOCK_IN',
            prev_qty: 0,
            change_qty: stockQty,
            new_qty: stockQty,
            reason: 'Initial stock intake upon catalogue creation',
            reference_id: 'NEW-PROD-' + newId,
            channel: 'ADMIN',
            admin_user: adminUser
          });
        }

        this.logAudit('PRODUCT_CREATE', 'PRODUCT', newId, `Created saree "${newProd.name}" (${sku}) with stock ${stockQty}`, adminUser);
        this.commit();
        const sbCreate = (typeof SFSupabase !== 'undefined') ? SFSupabase : (typeof window !== 'undefined' && window.SFSupabase ? window.SFSupabase : null);
        if (sbCreate && typeof sbCreate.saveProductToCloud === 'function') {
          sbCreate.saveProductToCloud(newProd).catch(e => console.warn('Supabase product cloud sync:', e));
        }
        return newProd;
      }
    }

    duplicateProduct(id, adminUser = 'Bhanu (Owner)') {
      const orig = this.getProduct(id);
      if (!orig) throw new Error('Product not found for duplication');

      const dupData = {
        ...orig,
        id: null,
        sku: null,
        barcode: null,
        name: orig.name + ' (Copy)',
        stock_qty: 0
      };
      return this.saveProduct(dupData, adminUser);
    }

    archiveProduct(id, adminUser = 'Bhanu (Owner)') {
      const p = this.getProduct(id);
      if (!p) throw new Error('Product not found');
      p.status = p.status === 'Archived' ? 'Published' : 'Archived';
      this.logAudit('PRODUCT_STATUS', 'PRODUCT', id, `Changed status of "${p.name}" to ${p.status}`, adminUser);
      this.commit();
      const sbArch = (typeof SFSupabase !== 'undefined') ? SFSupabase : (typeof window !== 'undefined' && window.SFSupabase ? window.SFSupabase : null);
      if (sbArch && typeof sbArch.archiveProductInCloud === 'function') {
        sbArch.archiveProductInCloud(id).catch(e => console.warn('Supabase product cloud sync:', e));
      }
      return p;
    }

    deleteProduct(id, adminUser = 'Bhanu (Owner)') {
      const numId = parseInt(id, 10);
      const p = this.getProduct(numId);
      if (!p) return false;
      this.state.products = this.state.products.filter(x => x.id !== numId);
      this.logAudit('PRODUCT_DELETE', 'PRODUCT', numId, `Deleted product "${p.name}" (${p.sku})`, adminUser);
      this.commit();
      const sbDel = (typeof SFSupabase !== 'undefined') ? SFSupabase : (typeof window !== 'undefined' && window.SFSupabase ? window.SFSupabase : null);
      if (sbDel && typeof sbDel.deleteProductFromCloud === 'function') {
        sbDel.deleteProductFromCloud(numId).catch(e => console.warn('Supabase product cloud sync:', e));
      }
      return true;
    }


    // ═══════════════════════════════════════════════════════════════════════════
    // BARCODE & THERMAL LABEL PRINTING SUITE
    // ═══════════════════════════════════════════════════════════════════════════
    generateNextSku(category = 'Silk') {
      const bc = typeof SFBarcode !== 'undefined' ? SFBarcode : (typeof require !== 'undefined' ? require('./sf_barcode') : null);
      const existingSkus = this.getProducts().map(p => p.sku).filter(Boolean);
      const nextId = (this.getProducts().length || 0) + 1;
      return bc ? bc.generateUniqueSKU(category, nextId, existingSkus) : `SF-SLK-${String(nextId).padStart(3, '0')}`;
    }

    generateNextBarcode(category = 'Silk') {
      const bc = typeof SFBarcode !== 'undefined' ? SFBarcode : (typeof require !== 'undefined' ? require('./sf_barcode') : null);
      const existingBarcodes = this.getProducts().map(p => p.barcode).filter(Boolean);
      const nextId = (this.getProducts().length || 0) + 1;
      return bc ? bc.generateUniqueBarcode(category, nextId, existingBarcodes) : `SF2601${String(nextId).padStart(4, '0')}`;
    }

    validateSkuUniqueness(sku, excludeProductId = null) {
      if (!sku) return { valid: false, message: 'SKU is required.' };
      const clean = String(sku).trim().toUpperCase();
      const existing = this.getProducts().find(p => p.sku && p.sku.toUpperCase() === clean && p.id !== parseInt(excludeProductId, 10));
      if (existing) {
        return { valid: false, message: `SKU "${clean}" is already assigned to "${existing.name}". Each saree SKU must be unique.` };
      }
      return { valid: true };
    }

    validateBarcodeUniqueness(barcode, excludeProductId = null) {
      if (!barcode) return { valid: false, message: 'Barcode is required.' };
      const clean = String(barcode).trim().toUpperCase();
      const existing = this.getProducts().find(p => p.barcode && p.barcode.toUpperCase() === clean && p.id !== parseInt(excludeProductId, 10));
      if (existing) {
        return { valid: false, message: `Barcode "${clean}" is already registered to "${existing.name}". Duplicate barcodes are strictly rejected.` };
      }
      return { valid: true };
    }

    getBarcodePrintHistory() {
      if (!this.state.barcode_print_history) this.state.barcode_print_history = [];
      return this.state.barcode_print_history;
    }

    recordPrintHistory({ productId, sku, barcode, productName, price, quantity = 1, dimensions = '50x30mm', isReprint = false, reason = 'Inventory Tagging', adminUser = 'Bhanu (Owner)' }) {
      if (!this.state.barcode_print_history) this.state.barcode_print_history = [];
      const prod = this.getProduct(productId);
      if (prod) {
        prod.last_printed_price = price !== undefined ? price : prod.price;
        prod.last_printed_at = new Date().toISOString();
        prod.price_outdated = false;
      }

      const record = {
        id: 'PRT-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        product_id: productId,
        sku: sku || prod?.sku,
        barcode: barcode || prod?.barcode,
        product_name: productName || prod?.name,
        price: price !== undefined ? price : prod?.price,
        quantity: parseInt(quantity, 10) || 1,
        sticker_dimensions: dimensions,
        is_reprint: !!isReprint,
        reason: reason,
        admin_user: adminUser,
        created_at: new Date().toISOString()
      };

      this.state.barcode_print_history.unshift(record);
      this.logAudit(
        isReprint ? 'BARCODE_REPRINT' : 'BARCODE_PRINT',
        'BARCODE',
        record.barcode,
        `Printed ${record.quantity} thermal label(s) [${record.sticker_dimensions}] for ${record.product_name} (${record.sku})`,
        adminUser
      );
      this.commit();
      return record;
    }

    getPrinterConfig() {
      if (!this.state.printer_configuration) {
        this.state.printer_configuration = {
          printer_name: 'Shanmuka Thermal Label Printer (TSC / Zebra / Xprinter)',
          connection_type: 'BROWSER_DIRECT',
          printer_language: 'BROWSER_PDF',
          sticker_width: 50,
          sticker_height: 30,
          label_gap: 3,
          print_darkness: 10,
          print_speed: 3,
          include_branding: true,
          include_price: true,
          include_sku: true,
          include_category: true,
          font_size: 'normal',
          barcode_height: 28
        };
      }
      return this.state.printer_configuration;
    }

    savePrinterConfig(updates, adminUser = 'Bhanu (Owner)') {
      this.state.printer_configuration = {
        ...this.getPrinterConfig(),
        ...updates,
        updated_at: new Date().toISOString()
      };
      this.logAudit('PRINTER_CONFIG_UPDATE', 'SETTINGS', 'PRINTER', 'Updated thermal barcode printer configuration', adminUser);
      this.commit();
      return this.state.printer_configuration;
    }

    getInventoryUnits(productId = null) {
      if (!this.state.inventory_units) this.state.inventory_units = [];
      if (!productId) return this.state.inventory_units;
      return this.state.inventory_units.filter(u => u.product_id === parseInt(productId, 10) || String(u.product_id) === String(productId));
    }

    generateInventoryUnits(productId, count = 1, adminUser = 'Bhanu (Owner)') {
      if (!this.state.inventory_units) this.state.inventory_units = [];
      const prod = this.getProduct(productId);
      if (!prod) throw new Error('Product not found for unit generation');

      const bc = typeof SFBarcode !== 'undefined' ? SFBarcode : (typeof require !== 'undefined' ? require('./sf_barcode') : null);
      const existingUnits = this.getInventoryUnits(productId);
      let nextSerial = existingUnits.length ? Math.max(...existingUnits.map(u => u.serial_number || 0)) + 1 : 1;

      const createdUnits = [];
      for (let i = 0; i < count; i++) {
        const serialNo = nextSerial + i;
        const unitBarcode = bc ? bc.generateUnitBarcode(prod.barcode, serialNo) : `${prod.barcode}-${String(serialNo).padStart(2, '0')}`;
        const unit = {
          id: 'UNIT-' + unitBarcode,
          unit_barcode: unitBarcode,
          product_id: prod.id,
          sku: prod.sku,
          serial_number: serialNo,
          status: 'AVAILABLE',
          received_at: new Date().toISOString(),
          sold_at: null,
          sold_order_id: null
        };
        this.state.inventory_units.push(unit);
        createdUnits.push(unit);
      }

      this.logAudit('UNIT_BARCODES_GENERATED', 'INVENTORY', prod.sku, `Generated ${count} serialized unit barcode(s) for "${prod.name}"`, adminUser);
      this.commit();
      return createdUnits;
    }

    markUnitSold(unitBarcode, orderId, adminUser = 'System') {
      if (!this.state.inventory_units) return null;
      const unit = this.state.inventory_units.find(u => u.unit_barcode === unitBarcode);
      if (!unit) return null;
      if (unit.status === 'SOLD') {
        throw new Error(`Saree unit ${unitBarcode} is already marked as SOLD in order ${unit.sold_order_id}. Physical drape cannot be sold twice.`);
      }
      unit.status = 'SOLD';
      unit.sold_at = new Date().toISOString();
      unit.sold_order_id = orderId;
      this.commit();
      return unit;
    }

    // ── INVENTORY LEDGER & STOCK MOVEMENTS ──
    getInventoryLedger(productId = null) {
      let list = this.state.inventory_ledger || [];
      if (productId) {
        const numId = parseInt(productId, 10);
        list = list.filter(l => l.product_id === numId);
      }
      return list;
    }

    recordLedgerEntry(entry) {
      const record = {
        id: 'LEDG-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        product_id: parseInt(entry.product_id, 10),
        sku: entry.sku || '',
        product_name: entry.product_name || '',
        type: entry.type, // 'STOCK_IN', 'ONLINE_SALE', 'POS_SALE', 'DAMAGE', 'RETURN', 'ADJUSTMENT', 'PURCHASE_RECEIPT'
        prev_qty: parseInt(entry.prev_qty, 10),
        change_qty: parseInt(entry.change_qty, 10),
        new_qty: parseInt(entry.new_qty, 10),
        reason: entry.reason || 'General inventory movement',
        reference_id: String(entry.reference_id || ''),
        channel: entry.channel || 'ADMIN',
        admin_user: entry.admin_user || 'Bhanu (Owner)',
        timestamp: entry.timestamp || new Date().toISOString()
      };
      this.state.inventory_ledger.unshift(record);
      return record;
    }

    adjustStock(productId, changeQty, reason, adminUser = 'Bhanu (Owner)', type = 'ADJUSTMENT') {
      const prod = this.getProduct(productId);
      if (!prod) throw new Error(`Product #${productId} not found`);

      const delta = parseInt(changeQty, 10);
      if (isNaN(delta) || delta === 0) throw new Error('Valid non-zero adjustment quantity required');

      const prevQty = prod.stock_qty;
      const newQty = prevQty + delta;
      if (newQty < 0) {
        throw new Error(`Cannot adjust stock below 0. Current stock: ${prevQty}, Attempted reduction: ${Math.abs(delta)}`);
      }

      prod.stock_qty = newQty;
      prod.stock = newQty <= 0 ? 'Sold Out' : (newQty <= (prod.low_stock_threshold || 2) ? 'Low Stock' : 'In Stock');

      this.recordLedgerEntry({
        product_id: prod.id,
        sku: prod.sku,
        product_name: prod.name,
        type: type,
        prev_qty: prevQty,
        change_qty: delta,
        new_qty: newQty,
        reason: reason || 'Manual stock adjustment by owner',
        reference_id: 'ADJ-' + Date.now(),
        channel: 'ADMIN',
        admin_user: adminUser
      });

      this.logAudit('STOCK_ADJUST', 'INVENTORY', prod.id, `Stock adjusted for "${prod.name}" from ${prevQty} to ${newQty} (${delta > 0 ? '+' : ''}${delta}). Reason: ${reason}`, adminUser);
      this.commit();
      return prod;
    }

    // ── ORDERS, POS BILLING & TRANSACTIONS ──
    getOrders() {
      return this.state.orders || [];
    }

    getOrder(orderId) {
      if (!orderId) return null;
      return this.getOrders().find(o => o.id === orderId || o.order_number === orderId);
    }

    /**
     * ATOMIC SALE TRANSACTION
     * Validates inventory, prevents overselling/negative stock, deducts quantity,
     * updates customer profiles, creates order, and logs ledger entries.
     */
    processSaleTransaction(saleData) {
      // 1. Validation
      if (!saleData.items || !saleData.items.length) {
        throw new Error('Transaction requires at least one saree item.');
      }

      // Check stock availability for all items atomically
      for (const item of saleData.items) {
        const prod = this.getProduct(item.product_id);
        if (!prod) {
          throw new Error(`Product #${item.product_id} does not exist in inventory.`);
        }
        const reqQty = parseInt(item.qty, 10) || 1;
        if (prod.stock_qty < reqQty) {
          throw new Error(`Insufficient stock for "${prod.name}". Available: ${prod.stock_qty}, Requested: ${reqQty}. Overselling prevented.`);
        }
      }

      // 2. Generate unique order IDs
      const channel = saleData.channel === 'POS' ? 'POS' : 'ONLINE';
      const orderPrefix = channel === 'POS' ? (this.state.settings.pos_prefix || 'POS-2026-') : 'SF-ORD-';
      const orderNum = orderPrefix + String(Date.now()).slice(-6);

      const resolvedItems = [];
      let calculatedSubtotal = 0;

      // 3. Deduct stock atomically and record ledger
      for (const item of saleData.items) {
        const prod = this.getProduct(item.product_id);
        const reqQty = parseInt(item.qty, 10) || 1;
        const prevQty = prod.stock_qty;
        const newQty = prevQty - reqQty;

        prod.stock_qty = newQty;
        prod.stock = newQty <= 0 ? 'Sold Out' : (newQty <= (prod.low_stock_threshold || 2) ? 'Low Stock' : 'In Stock');

        const linePrice = parseInt(item.price !== undefined ? item.price : prod.price, 10);
        const lineTotal = linePrice * reqQty;
        calculatedSubtotal += lineTotal;

        resolvedItems.push({
          product_id: prod.id,
          sku: prod.sku,
          name: prod.name,
          price: linePrice,
          purchase_cost: prod.purchase_cost || Math.round(linePrice * 0.58),
          qty: reqQty,
          total: lineTotal
        });

        this.recordLedgerEntry({
          product_id: prod.id,
          sku: prod.sku,
          product_name: prod.name,
          type: channel === 'POS' ? 'POS_SALE' : 'ONLINE_SALE',
          prev_qty: prevQty,
          change_qty: -reqQty,
          new_qty: newQty,
          reason: `${channel} Sale: Order #${orderNum}`,
          reference_id: orderNum,
          channel: channel,
          admin_user: channel === 'POS' ? (saleData.admin_user || 'Bhanu (Owner)') : 'Storefront Customer'
        });
      }

      // 4. Calculate Financials
      const discount = parseInt(saleData.discount || 0, 10);
      const taxable = Math.max(0, calculatedSubtotal - discount);
      const taxRate = parseInt(this.state.settings.default_gst_percent || 5, 10);
      const taxAmount = Math.round(taxable * (taxRate / 100));
      const shipping = channel === 'POS' ? 0 : (taxable >= (this.state.settings.free_shipping_threshold || 15000) ? 0 : (saleData.shipping_charges || 350));
      const netTotal = taxable + taxAmount + shipping;

      // 5. Customer Record Upsert
      let customerId = saleData.customer_id;
      if (saleData.customer_phone || saleData.customer_name) {
        let cust = this.state.customers.find(c => c.phone === (saleData.customer_phone || '').trim());
        if (!cust) {
          cust = {
            id: 'CUST-' + Date.now().toString(36),
            name: saleData.customer_name || 'Walk-in Patron',
            phone: saleData.customer_phone || '',
            email: saleData.customer_email || '',
            street: saleData.delivery_address?.street || 'In-Store',
            city: saleData.delivery_address?.city || 'Hyderabad',
            state: saleData.delivery_address?.state || 'Telangana',
            pincode: saleData.delivery_address?.pincode || '500033',
            total_orders: 1,
            total_spent: netTotal,
            notes: channel === 'POS' ? 'Physical Shop Customer' : 'Online Store Customer',
            created_at: new Date().toISOString()
          };
          this.state.customers.unshift(cust);
          customerId = cust.id;
        } else {
          cust.total_orders = (cust.total_orders || 0) + 1;
          cust.total_spent = (cust.total_spent || 0) + netTotal;
          if (saleData.customer_name && cust.name === 'Walk-in Patron') cust.name = saleData.customer_name;
          customerId = cust.id;
        }
      }

      // 6. Create Order Record
      const newOrder = {
        id: orderNum,
        order_number: orderNum,
        channel,
        customer_id: customerId || 'WALK_IN',
        customer_name: saleData.customer_name || (channel === 'POS' ? 'Walk-in Customer' : 'Online Patron'),
        customer_phone: saleData.customer_phone || '',
        customer_email: saleData.customer_email || '',
        items: resolvedItems,
        subtotal: calculatedSubtotal,
        discount,
        coupon_code: saleData.coupon_code || '',
        tax_rate: taxRate,
        tax_amount: taxAmount,
        shipping_charges: shipping,
        total: netTotal,
        payment_method: saleData.payment_method || (channel === 'POS' ? 'CASH' : 'UPI'),
        payment_status: saleData.payment_status || 'PAID',
        payment_reference: saleData.payment_reference || (channel === 'POS' ? `POS-CASH-${orderNum}` : `ONLINE-PG-${orderNum}`),
        order_status: channel === 'POS' ? 'DELIVERED' : 'NEW',
        delivery_address: saleData.delivery_address || {
          street: channel === 'POS' ? 'Showroom Handover' : '',
          city: channel === 'POS' ? 'Hyderabad' : '',
          state: channel === 'POS' ? 'Telangana' : '',
          pincode: channel === 'POS' ? '500033' : ''
        },
        courier: channel === 'POS' ? 'In-Store Handover' : (saleData.courier || 'Blue Dart Express'),
        tracking_number: channel === 'POS' ? orderNum : (saleData.tracking_number || ''),
        order_notes: saleData.order_notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.state.orders.unshift(newOrder);

      // 7. Coupon Usage count update
      if (saleData.coupon_code) {
        const coupon = this.state.coupons.find(c => c.code.toUpperCase() === saleData.coupon_code.toUpperCase());
        if (coupon) coupon.usage_count = (coupon.usage_count || 0) + 1;
      }

      this.logAudit(
        channel === 'POS' ? 'POS_SALE' : 'ONLINE_SALE',
        'ORDER',
        orderNum,
        `Processed ${channel} sale #${orderNum} for ${moneyFormat(netTotal)} (${resolvedItems.length} drapes)`,
        channel === 'POS' ? (saleData.admin_user || 'Bhanu (Owner)') : 'Storefront Customer'
      );

      this.commit();
      const sbOrder = (typeof SFSupabase !== 'undefined') ? SFSupabase : (typeof window !== 'undefined' && window.SFSupabase ? window.SFSupabase : null);
      if (sbOrder && typeof sbOrder.pushOrderToCloud === 'function') {
        sbOrder.pushOrderToCloud(newOrder).catch(e => console.warn('Supabase order cloud sync:', e));
      }
      return newOrder;
    }

    updateOrderStatus(orderId, newStatus, adminUser = 'Bhanu (Owner)') {
      const order = this.getOrder(orderId);
      if (!order) throw new Error('Order not found');

      const oldStatus = order.order_status;
      order.order_status = newStatus;
      order.updated_at = new Date().toISOString();

      // If order is cancelled or returned, return stock to inventory!
      if ((newStatus === 'CANCELLED' || newStatus === 'RETURNED') && oldStatus !== 'CANCELLED' && oldStatus !== 'RETURNED') {
        for (const item of order.items) {
          const prod = this.getProduct(item.product_id);
          if (prod) {
            const prevQty = prod.stock_qty;
            const newQty = prevQty + item.qty;
            prod.stock_qty = newQty;
            prod.stock = newQty <= 0 ? 'Sold Out' : (newQty <= 2 ? 'Low Stock' : 'In Stock');

            this.recordLedgerEntry({
              product_id: prod.id,
              sku: prod.sku,
              product_name: prod.name,
              type: newStatus === 'CANCELLED' ? 'ADJUSTMENT' : 'RETURN',
              prev_qty: prevQty,
              change_qty: item.qty,
              new_qty: newQty,
              reason: `Order #${order.order_number} marked as ${newStatus} - Restocked`,
              reference_id: order.order_number,
              channel: 'ADMIN',
              admin_user: adminUser
            });
          }
        }
        if (newStatus === 'RETURNED') order.payment_status = 'REFUNDED';
      }

      this.logAudit('ORDER_STATUS', 'ORDER', order.order_number, `Updated order #${order.order_number} status from ${oldStatus} to ${newStatus}`, adminUser);
      this.commit();
      return order;
    }

    updateOrderDetails(orderId, updates, adminUser = 'Bhanu (Owner)') {
      const order = this.getOrder(orderId);
      if (!order) throw new Error('Order not found');

      if (updates.courier !== undefined) order.courier = updates.courier;
      if (updates.tracking_number !== undefined) order.tracking_number = updates.tracking_number;
      if (updates.shipping_status !== undefined) order.shipping_status = updates.shipping_status;
      if (updates.status !== undefined) order.status = updates.status;
      if (updates.order_notes !== undefined) order.order_notes = updates.order_notes;
      if (updates.payment_status !== undefined) order.payment_status = updates.payment_status;
      order.updated_at = new Date().toISOString();

      this.logAudit('ORDER_UPDATE', 'ORDER', order.order_number, `Updated logistics/payment for order #${order.order_number}`, adminUser);
      this.commit();
      return order;
    }

    // ── CUSTOMERS & PATRON MANAGEMENT ──
    getCustomers() {
      const customers = this.state.customers || [];
      // Calculate live order metrics for each customer from real orders
      return customers.map(c => {
        const summary = this.getCustomerSummary(c.id);
        return {
          ...c,
          name: c.name || c.full_name || 'Valued Patron',
          full_name: c.full_name || c.name || 'Valued Patron',
          phone: c.phone || c.mobile_number || '',
          mobile_number: c.mobile_number || c.phone || '',
          account_status: c.account_status || 'Active',
          profile_completed: c.profile_completed !== false,
          total_orders: summary ? summary.total_orders : (c.total_orders || 0),
          total_spent: summary ? summary.completed_spend : (c.total_spent || 0),
          last_order_date: summary ? summary.last_order_date : (c.last_order_date || null)
        };
      });
    }

    getCustomer(id) {
      if (!id) return null;
      const strId = String(id).toLowerCase().trim();
      const customers = this.state.customers || [];
      return customers.find(c => {
        if (!c) return false;
        if (String(c.id).toLowerCase() === strId) return true;
        if (c.auth_user_id && String(c.auth_user_id).toLowerCase() === strId) return true;
        if (c.email && c.email.toLowerCase().trim() === strId) return true;
        if (c.phone && c.phone.replace(/[^0-9]/g, '') === strId.replace(/[^0-9]/g, '')) return true;
        if (c.mobile_number && c.mobile_number.replace(/[^0-9]/g, '') === strId.replace(/[^0-9]/g, '')) return true;
        return false;
      }) || null;
    }

    getCustomerSummary(id) {
      const cust = (this.state.customers || []).find(c => {
        if (!c) return false;
        const strId = String(id).toLowerCase().trim();
        return (
          String(c.id).toLowerCase() === strId ||
          (c.auth_user_id && String(c.auth_user_id).toLowerCase() === strId) ||
          (c.email && c.email.toLowerCase().trim() === strId)
        );
      });
      if (!cust) return null;

      const custEmail = (cust.email || '').toLowerCase().trim();
      const custPhone = (cust.phone || cust.mobile_number || '').replace(/[^0-9]/g, '');
      const custId = String(cust.id);
      const authUserId = cust.auth_user_id ? String(cust.auth_user_id) : null;

      const allOrders = this.getOrders();
      const customerOrders = allOrders.filter(o => {
        const orderEmail = (o.customer_email || (o.customer && o.customer.email) || '').toLowerCase().trim();
        const orderPhone = (o.customer_phone || (o.customer && o.customer.phone) || '').replace(/[^0-9]/g, '');
        const orderCustId = o.customer_id ? String(o.customer_id) : null;

        return (
          (orderCustId && (orderCustId === custId || orderCustId === authUserId)) ||
          (custEmail && orderEmail === custEmail) ||
          (custPhone && orderPhone && (orderPhone.endsWith(custPhone) || custPhone.endsWith(orderPhone)))
        );
      });

      // Sort newest first
      customerOrders.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

      let totalOrders = customerOrders.length;
      let deliveredOrders = 0;
      let completedSpend = 0;
      let pendingOrders = 0;
      let processingOrders = 0;
      let shippedOrders = 0;
      let cancelledOrders = 0;
      let returnedOrders = 0;
      let returnRequestedOrders = 0;
      let refundedOrders = 0;

      customerOrders.forEach(o => {
        const st = (o.order_status || 'Pending').toLowerCase();
        const paySt = (o.payment_status || 'Completed').toLowerCase();
        const amt = Number(o.total || o.total_amount) || 0;

        if (st === 'delivered') {
          deliveredOrders++;
          if (paySt !== 'failed') completedSpend += amt;
        } else if (['shipped', 'dispatched', 'out for delivery'].includes(st)) {
          shippedOrders++;
          if (paySt !== 'failed') completedSpend += amt;
        } else if (['processing', 'confirmed', 'packed'].includes(st)) {
          processingOrders++;
          if (paySt !== 'failed') completedSpend += amt;
        } else if (st === 'pending') {
          pendingOrders++;
        } else if (st === 'cancelled') {
          cancelledOrders++;
          // A cancelled order must NOT be counted as a successful purchase!
        } else if (st === 'returned') {
          returnedOrders++;
          // A returned order must NOT be treated as an ordinary completed sale!
        } else if (st === 'return requested') {
          returnRequestedOrders++;
        } else if (st.includes('refund')) {
          refundedOrders++;
        }
      });

      return {
        customer: cust,
        total_orders: totalOrders,
        delivered_orders: deliveredOrders,
        completed_spend: completedSpend,
        pending_orders: pendingOrders,
        processing_orders: processingOrders,
        shipped_orders: shippedOrders,
        cancelled_orders: cancelledOrders,
        returned_orders: returnedOrders,
        return_requested_orders: returnRequestedOrders,
        refunded_orders: refundedOrders,
        orders: customerOrders,
        last_order_date: customerOrders[0]?.created_at || null,
        first_order_date: customerOrders[customerOrders.length - 1]?.created_at || null
      };
    }

    saveCustomer(custData) {
      if (!custData) throw new Error('Customer data is required');
      const name = (custData.full_name || custData.name || '').trim();
      const phone = (custData.mobile_number || custData.phone || '').trim();
      const email = (custData.email || '').trim().toLowerCase();

      if (!name) throw new Error('Customer name is required');
      if (!phone && !email) throw new Error('Customer phone or email is required');

      const customers = this.state.customers = this.state.customers || [];
      const idx = customers.findIndex(c => {
        if (!c) return false;
        if (custData.id && c.id === custData.id) return true;
        if (custData.auth_user_id && c.auth_user_id === custData.auth_user_id) return true;
        if (email && c.email && c.email.toLowerCase() === email) return true;
        if (phone && (c.phone === phone || c.mobile_number === phone)) return true;
        return false;
      });

      const now = new Date().toISOString();

      if (idx !== -1) {
        customers[idx] = {
          ...customers[idx],
          ...custData,
          name: name,
          full_name: name,
          phone: phone || customers[idx].phone,
          mobile_number: phone || customers[idx].mobile_number,
          email: email || customers[idx].email,
          updated_at: now
        };
        this.commit();

        // Push update to cloud in background
        if (typeof SFSupabase !== 'undefined' && typeof SFSupabase.saveCustomerToCloud === 'function') {
          SFSupabase.saveCustomerToCloud(customers[idx]).catch(e => console.warn('Customer cloud save:', e));
        }
        return customers[idx];
      } else {
        const newCust = {
          id: custData.id || ('CUST-' + Math.floor(100000 + Math.random() * 900000)),
          auth_user_id: custData.auth_user_id || null,
          name: name,
          full_name: name,
          phone: phone,
          mobile_number: phone,
          alternate_mobile: custData.alternate_mobile || null,
          email: email,
          date_of_birth: custData.date_of_birth || null,
          gender: custData.gender || null,
          profile_completed: custData.profile_completed !== false,
          account_status: custData.account_status || 'Active',
          preferred_contact: custData.preferred_contact || 'WhatsApp',
          whatsapp_opt_in: custData.whatsapp_opt_in !== false,
          marketing_consent: !!custData.marketing_consent,
          street: custData.street || '',
          city: custData.city || '',
          district: custData.district || '',
          state: custData.state || '',
          pincode: custData.pincode || '',
          country: custData.country || 'India',
          total_orders: 0,
          total_spent: 0,
          notes: custData.notes || '',
          avatar_url: custData.avatar_url || null,
          created_at: now,
          updated_at: now
        };
        customers.unshift(newCust);
        this.commit();

        // Push new customer to cloud
        if (typeof SFSupabase !== 'undefined' && typeof SFSupabase.saveCustomerToCloud === 'function') {
          SFSupabase.saveCustomerToCloud(newCust).catch(e => console.warn('Customer cloud save:', e));
        }
        return newCust;
      }
    }

    updateCustomerStatus(customerId, status, adminUser = 'Bhanu Prakash Reddy') {
      const cust = (this.state.customers || []).find(c => c.id === customerId);
      if (!cust) return null;
      const oldStatus = cust.account_status || 'Active';
      cust.account_status = status;
      cust.updated_at = new Date().toISOString();
      this.commit();

      this.logAudit(adminUser, 'CUSTOMER_STATUS_UPDATE', 'customers', customerId, {
        previous_status: oldStatus,
        new_status: status
      });

      if (typeof SFSupabase !== 'undefined' && typeof SFSupabase.saveCustomerToCloud === 'function') {
        SFSupabase.saveCustomerToCloud(cust).catch(e => console.warn('Cloud status sync:', e));
      }
      return cust;
    }

    // ── CUSTOMER ADDRESSES ──
    getCustomerAddresses(customerId) {
      if (!customerId) return [];
      const addresses = this.state.customer_addresses || [];
      return addresses.filter(a => a.customer_id === customerId || a.auth_user_id === customerId);
    }

    saveCustomerAddress(customerId, addressData) {
      if (!customerId || !addressData) return null;
      this.state.customer_addresses = this.state.customer_addresses || [];
      const list = this.state.customer_addresses;

      let savedId = addressData.id;
      const now = new Date().toISOString();

      if (savedId) {
        const idx = list.findIndex(a => a.id === savedId);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...addressData, updated_at: now };
          this.commit();
          if (typeof SFSupabase !== 'undefined' && typeof SFSupabase.saveCustomerAddress === 'function') {
            SFSupabase.saveCustomerAddress(list[idx]).catch(e => {});
          }
          return list[idx];
        }
      }

      savedId = 'addr_' + Date.now();
      const existing = list.filter(a => a.customer_id === customerId);
      const isDefault = addressData.is_default || existing.length === 0;

      if (isDefault) {
        existing.forEach(a => { a.is_default = false; });
      }

      const newAddr = {
        id: savedId,
        customer_id: customerId,
        auth_user_id: addressData.auth_user_id || null,
        address_type: addressData.address_type || 'Home',
        full_name: addressData.full_name || '',
        phone: addressData.phone || '',
        house_number: addressData.house_number || '',
        street: addressData.street || '',
        landmark: addressData.landmark || '',
        city: addressData.city || '',
        district: addressData.district || '',
        state: addressData.state || '',
        pincode: addressData.pincode || '',
        country: addressData.country || 'India',
        is_default: isDefault,
        created_at: now,
        updated_at: now
      };

      list.unshift(newAddr);
      this.commit();

      if (typeof SFSupabase !== 'undefined' && typeof SFSupabase.saveCustomerAddress === 'function') {
        SFSupabase.saveCustomerAddress(newAddr).catch(e => {});
      }
      return newAddr;
    }

    deleteCustomerAddress(customerId, addressId) {
      this.state.customer_addresses = this.state.customer_addresses || [];
      const list = this.state.customer_addresses;
      const idx = list.findIndex(a => a.id === addressId && (a.customer_id === customerId || a.auth_user_id === customerId));
      if (idx !== -1) {
        list.splice(idx, 1);
        this.commit();
        if (typeof SFSupabase !== 'undefined' && typeof SFSupabase.deleteCustomerAddress === 'function') {
          SFSupabase.deleteCustomerAddress(addressId).catch(e => {});
        }
        return true;
      }
      return false;
    }

    setDefaultCustomerAddress(customerId, addressId) {
      this.state.customer_addresses = this.state.customer_addresses || [];
      const list = this.state.customer_addresses;
      list.forEach(a => {
        if (a.customer_id === customerId || a.auth_user_id === customerId) {
          a.is_default = (a.id === addressId);
        }
      });
      this.commit();
      return true;
    }

    // ── CUSTOMER INTERNAL NOTES ──
    getCustomerNotes(customerId) {
      if (!customerId) return [];
      const notes = this.state.customer_notes || [];
      return notes.filter(n => n.customer_id === customerId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    addCustomerNote(customerId, noteText, adminUser = 'Bhanu Prakash Reddy') {
      if (!customerId || !noteText) return null;
      this.state.customer_notes = this.state.customer_notes || [];
      const newNote = {
        id: 'note_' + Date.now(),
        customer_id: customerId,
        admin_user: adminUser,
        note: noteText.trim(),
        created_at: new Date().toISOString()
      };
      this.state.customer_notes.unshift(newNote);
      this.commit();

      this.logAudit(adminUser, 'CUSTOMER_NOTE_ADDED', 'customers', customerId, { note: noteText });

      if (typeof SFSupabase !== 'undefined' && typeof SFSupabase.addCustomerNote === 'function') {
        SFSupabase.addCustomerNote(newNote).catch(e => {});
      }
      return newNote;
    }

    // ── AUDIT LOGS ──
    logAudit(actor, action, entity, entityId, details = {}) {
      this.state.audit_logs = this.state.audit_logs || [];
      const log = {
        id: 'aud_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        actor: actor || 'Admin',
        action: action,
        entity: entity,
        entity_id: String(entityId),
        details: details,
        created_at: new Date().toISOString()
      };
      this.state.audit_logs.unshift(log);
      this.commit();

      if (typeof SFSupabase !== 'undefined' && typeof SFSupabase.logAudit === 'function') {
        SFSupabase.logAudit(actor, action, entity, entityId, details).catch(e => {});
      }
      return log;
    }

    getAuditLogs() {
      return this.state.audit_logs || [];
    }

    // ── SUPPLIERS & PURCHASES ──
    getSuppliers() {
      return this.state.suppliers || [];
    }

    saveSupplier(suppData, adminUser = 'Bhanu (Owner)') {
      if (!suppData.name || !suppData.phone) throw new Error('Supplier name and phone are required');
      const suppliers = this.state.suppliers;
      const idx = suppliers.findIndex(s => s.id === suppData.id);
      if (idx !== -1) {
        suppliers[idx] = { ...suppliers[idx], ...suppData };
        this.logAudit('SUPPLIER_UPDATE', 'SUPPLIER', suppData.id, `Updated supplier "${suppData.name}"`, adminUser);
        this.commit();
        return suppliers[idx];
      } else {
        const newSupp = {
          id: 'SUPP-' + Date.now().toString(36),
          name: suppData.name.trim(),
          contact_person: suppData.contact_person || '',
          phone: suppData.phone.trim(),
          email: suppData.email || '',
          city: suppData.city || '',
          gstin: suppData.gstin || '',
          materials_supplied: suppData.materials_supplied || 'Pure Handloom Silk Sarees',
          total_purchased: 0,
          balance_due: parseInt(suppData.balance_due || 0, 10),
          created_at: new Date().toISOString()
        };
        suppliers.unshift(newSupp);
        this.logAudit('SUPPLIER_CREATE', 'SUPPLIER', newSupp.id, `Created supplier profile "${newSupp.name}"`, adminUser);
        this.commit();
        return newSupp;
      }
    }

    getPurchases() {
      return this.state.purchases || [];
    }

    receivePurchaseOrder(poData, adminUser = 'Bhanu (Owner)') {
      if (!poData.supplier_id || !poData.items || !poData.items.length) {
        throw new Error('Valid supplier and itemized sarees required for purchase order.');
      }

      const supp = this.state.suppliers.find(s => s.id === poData.supplier_id);
      const supplierName = supp ? supp.name : (poData.supplier_name || 'Artisan Weavers');
      const poNum = 'PO-2026-' + String(Date.now()).slice(-5);

      let calculatedTotal = 0;
      const receivedItems = [];

      // Increment stock for each item and record in ledger
      for (const item of poData.items) {
        const prod = this.getProduct(item.product_id);
        const qty = parseInt(item.qty, 10) || 1;
        const unitCost = parseInt(item.unit_cost !== undefined ? item.unit_cost : (prod ? prod.purchase_cost : 3000), 10);
        const lineTotal = unitCost * qty;
        calculatedTotal += lineTotal;

        if (prod) {
          const prevQty = prod.stock_qty;
          const newQty = prevQty + qty;
          prod.stock_qty = newQty;
          prod.purchase_cost = unitCost; // Update latest purchase cost
          prod.stock = newQty <= 0 ? 'Sold Out' : (newQty <= 2 ? 'Low Stock' : 'In Stock');

          this.recordLedgerEntry({
            product_id: prod.id,
            sku: prod.sku,
            product_name: prod.name,
            type: 'PURCHASE_RECEIPT',
            prev_qty: prevQty,
            change_qty: qty,
            new_qty: newQty,
            reason: `Stock received via PO #${poNum} from ${supplierName}`,
            reference_id: poNum,
            channel: 'ADMIN',
            admin_user: adminUser
          });

          receivedItems.push({
            product_id: prod.id,
            sku: prod.sku,
            name: prod.name,
            unit_cost: unitCost,
            qty,
            total: lineTotal
          });
        }
      }

      const amountPaid = parseInt(poData.amount_paid !== undefined ? poData.amount_paid : calculatedTotal, 10);
      const balance = calculatedTotal - amountPaid;

      // Update supplier totals
      if (supp) {
        supp.total_purchased = (supp.total_purchased || 0) + calculatedTotal;
        supp.balance_due = (supp.balance_due || 0) + balance;
      }

      const newPo = {
        id: poNum,
        po_number: poNum,
        supplier_id: poData.supplier_id,
        supplier_name: supplierName,
        date: new Date().toISOString(),
        items: receivedItems,
        total_amount: calculatedTotal,
        amount_paid: amountPaid,
        balance,
        status: 'RECEIVED',
        payment_status: balance === 0 ? 'PAID' : (amountPaid > 0 ? 'PARTIAL' : 'UNPAID'),
        invoice_ref: poData.invoice_ref || `INV-${Date.now().toString().slice(-6)}`,
        notes: poData.notes || 'Received and added to central stock.'
      };

      this.state.purchases.unshift(newPo);
      this.logAudit('PURCHASE_RECEIVE', 'PURCHASE', poNum, `Received PO #${poNum} from ${supplierName} for ${moneyFormat(calculatedTotal)}`, adminUser);
      this.commit();
      return newPo;
    }

    // ── EXPENSES ──
    getExpenses() {
      return this.state.expenses || [];
    }

    recordExpense(expData, adminUser = 'Bhanu (Owner)') {
      if (!expData.category || !expData.amount) throw new Error('Expense category and amount are required.');
      const expNum = 'EXP-2026-' + String(Date.now()).slice(-5);
      const newExp = {
        id: expNum,
        category: expData.category,
        amount: parseInt(expData.amount, 10),
        payment_method: expData.payment_method || 'UPI',
        date: expData.date || new Date().toISOString(),
        description: expData.description || `${expData.category} payment`,
        receipt_ref: expData.receipt_ref || `REC-${Date.now().toString().slice(-4)}`
      };
      this.state.expenses.unshift(newExp);
      this.logAudit('EXPENSE_RECORD', 'EXPENSE', expNum, `Recorded expense ${expNum}: ${expData.category} - ${moneyFormat(newExp.amount)}`, adminUser);
      this.commit();
      return newExp;
    }

    deleteExpense(id, adminUser = 'Bhanu (Owner)') {
      this.state.expenses = this.state.expenses.filter(e => e.id !== id);
      this.logAudit('EXPENSE_DELETE', 'EXPENSE', id, `Deleted expense record #${id}`, adminUser);
      this.commit();
      return true;
    }

    // ── COUPONS & OFFERS ──
    getCoupons() {
      return this.state.coupons || [];
    }

    saveCoupon(couponData, adminUser = 'Bhanu (Owner)') {
      if (!couponData.code || !couponData.value) throw new Error('Coupon code and discount value required');
      const code = couponData.code.trim().toUpperCase();
      const idx = this.state.coupons.findIndex(c => c.code === code);
      const couponObj = {
        id: couponData.id || ('COUP-' + Date.now().toString(36)),
        code,
        type: couponData.type || 'PERCENT', // 'PERCENT' or 'FLAT'
        value: parseInt(couponData.value, 10),
        min_order: parseInt(couponData.min_order || 0, 10),
        usage_limit: parseInt(couponData.usage_limit || 100, 10),
        usage_count: couponData.usage_count || 0,
        valid_from: couponData.valid_from || new Date().toISOString().split('T')[0],
        valid_to: couponData.valid_to || '2026-12-31',
        is_active: couponData.is_active !== undefined ? !!couponData.is_active : true
      };
      if (idx !== -1) {
        this.state.coupons[idx] = couponObj;
      } else {
        this.state.coupons.unshift(couponObj);
      }
      this.logAudit('COUPON_SAVE', 'COUPON', code, `Saved coupon code ${code}`, adminUser);
      this.commit();
      return couponObj;
    }

    deleteCoupon(code, adminUser = 'Bhanu (Owner)') {
      this.state.coupons = this.state.coupons.filter(c => c.code.toUpperCase() !== code.toUpperCase());
      this.logAudit('COUPON_DELETE', 'COUPON', code, `Deleted coupon ${code}`, adminUser);
      this.commit();
      return true;
    }

    validateCoupon(code, subtotal) {
      if (!code) return { valid: false, message: 'Please enter a coupon code.' };
      const coupon = this.state.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.is_active);
      if (!coupon) return { valid: false, message: 'Invalid or inactive promotional code.' };
      if (coupon.min_order && subtotal < coupon.min_order) {
        return { valid: false, message: `Minimum order value for ${coupon.code} is ${moneyFormat(coupon.min_order)}.` };
      }
      if (coupon.usage_limit && (coupon.usage_count || 0) >= coupon.usage_limit) {
        return { valid: false, message: 'This coupon usage limit has been reached.' };
      }

      let discount = 0;
      if (coupon.type === 'PERCENT') {
        discount = Math.round(subtotal * (coupon.value / 100));
      } else {
        discount = Math.min(coupon.value, subtotal);
      }

      return {
        valid: true,
        coupon,
        discount,
        message: `Coupon ${coupon.code} applied! Discount: ${moneyFormat(discount)}`
      };
    }

    // ── WEBSITE CONTENT MANAGEMENT (CMS) & CINEMATIC VIDEO ARCHIVE ──
    getCMS() {
      const cms = this.state.cms || {};
      if (!Array.isArray(cms.video_history) || cms.video_history.length === 0) {
        cms.video_history = [
          {
            id: 'VID-ORIGINAL-01',
            name: 'Royal Atelier Loom Weaving (Original Cinematic Drape)',
            url: cms.hero_video || 'gemini_generated_video_e8550a2b.mp4',
            size: '14.8 MB',
            uploaded_at: '2026-11-08T10:00:00Z',
            is_active: true
          }
        ];
        this.state.cms = cms;
      }
      return cms;
    }

    saveCMS(cmsData, adminUser = 'Bhanu (Owner)') {
      this.state.cms = { ...this.state.cms, ...cmsData };
      this.logAudit('CMS_UPDATE', 'WEBSITE_CONTENT', 'ALL', 'Updated public website content & hero video', adminUser);
      this.commit();
      
      const sb = (typeof SFSupabase !== 'undefined') ? SFSupabase : (typeof window !== 'undefined' && window.SFSupabase ? window.SFSupabase : null);
      if (sb && typeof sb.saveCMSToCloud === 'function') {
        sb.saveCMSToCloud(this.state.cms).catch(e => console.warn('Supabase CMS cloud sync note:', e));
      }
      return this.state.cms;
    }

    getVideoHistory() {
      return this.getCMS().video_history || [];
    }

    addVideoToHistory(videoRecord, adminUser = 'Bhanu (Owner)') {
      const cms = this.getCMS();
      const history = cms.video_history || [];
      history.forEach(v => { v.is_active = false; });
      const newEntry = {
        id: videoRecord.id || ('VID-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4)),
        name: videoRecord.name || 'Custom Cinematic Hero Video',
        url: videoRecord.url,
        size: videoRecord.size || 'Web Video',
        uploaded_at: new Date().toISOString(),
        is_active: true
      };
      history.unshift(newEntry);
      cms.video_history = history;
      cms.hero_video = videoRecord.url;
      this.saveCMS(cms, adminUser);
      this.logAudit('HERO_VIDEO_UPLOAD', 'CMS', newEntry.id, `Uploaded new hero video: "${newEntry.name}"`, adminUser);
      return newEntry;
    }

    setActiveVideo(videoId, adminUser = 'Bhanu (Owner)') {
      const cms = this.getCMS();
      const history = cms.video_history || [];
      const target = history.find(v => v.id === videoId);
      if (!target) throw new Error('Video record not found in archive history.');
      history.forEach(v => { v.is_active = (v.id === videoId); });
      cms.hero_video = target.url;
      cms.video_history = history;
      this.saveCMS(cms, adminUser);
      this.logAudit('HERO_VIDEO_RESTORE', 'CMS', videoId, `Switched hero video to "${target.name}" (${target.url})`, adminUser);
      return target;
    }

    deleteVideoFromHistory(videoId, adminUser = 'Bhanu (Owner)') {
      const cms = this.getCMS();
      const history = cms.video_history || [];
      const target = history.find(v => v.id === videoId);
      if (!target) return false;
      if (target.is_active) throw new Error('Cannot delete the currently active hero video. Switch to another video first.');
      cms.video_history = history.filter(v => v.id !== videoId);
      this.saveCMS(cms, adminUser);
      this.logAudit('HERO_VIDEO_DELETE', 'CMS', videoId, `Removed video "${target.name}" from archive`, adminUser);
      return true;
    }

    // ── STORE SETTINGS ──
    getSettings() {
      return this.state.settings || {};
    }

    saveSettings(settingsData, adminUser = 'Bhanu (Owner)') {
      this.state.settings = { ...this.state.settings, ...settingsData };
      this.logAudit('SETTINGS_UPDATE', 'SETTINGS', 'STORE', 'Updated retail business settings & policies', adminUser);
      this.commit();
      return this.state.settings;
    }

    // ── AUTHENTICATION & SECURITY ──
    isAuthenticated() {
      const sess = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('sf_admin_session') : (this._adminSession || null);
      if (sess === 'LOGGED_OUT') return false;
      // By default authenticated for the store owner on local boutique terminal
      if (!sess) {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('sf_admin_session', 'ACTIVE');
          sessionStorage.setItem('sf_admin_user', this.state.auth.owner_name || 'Bhanu Prakash Reddy');
        } else {
          this._adminSession = 'ACTIVE';
        }
      }
      return (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('sf_admin_session') : this._adminSession) !== 'LOGGED_OUT';
    }

    login(username, password) {
      const u = (username || '').trim();
      const p = (password || '').trim();
      if ((u === 'admin' || u === this.state.auth.username) && (p === 'admin123' || p === 'Shanmuka@2026' || p === this.state.auth.password_hash)) {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('sf_admin_session', 'ACTIVE');
          sessionStorage.setItem('sf_admin_user', this.state.auth.owner_name || 'Bhanu Prakash Reddy');
        }
        this._adminSession = 'ACTIVE';
        this.logAudit('LOGIN_SUCCESS', 'AUTH', u, 'Successful administrative login', u);
        return { success: true };
      }
      this.logAudit('LOGIN_FAILED', 'AUTH', u, 'Failed login attempt with invalid credentials', u);
      return { success: false, message: 'Invalid username or password.' };
    }

    logout() {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('sf_admin_session', 'LOGGED_OUT');
        sessionStorage.removeItem('sf_admin_user');
      }
      this._adminSession = 'LOGGED_OUT';
      this.logAudit('LOGOUT', 'AUTH', 'ADMIN', 'Owner logged out of admin session');
      return true;
    }

    changePassword(oldPass, newPass) {
      if (oldPass !== this.state.auth.password_hash && oldPass !== 'admin123' && oldPass !== 'Shanmuka@2026') {
        throw new Error('Current password does not match.');
      }
      if (!newPass || newPass.length < 6) {
        throw new Error('New password must be at least 6 characters.');
      }
      this.state.auth.password_hash = newPass;
      this.logAudit('PASSWORD_CHANGE', 'AUTH', 'ADMIN', 'Owner changed admin password');
      this.commit();
      return true;
    }

    // ── ENQUIRIES & REVIEWS ──
    getEnquiries() {
      return this.state.enquiries || [];
    }

    recordEnquiry(enq) {
      const newEnq = {
        id: 'ENQ-' + Date.now().toString(36),
        name: enq.name || 'Patron',
        phone: enq.phone || '',
        email: enq.email || '',
        saree_id: enq.saree_id || null,
        message: enq.message || '',
        source: enq.source || 'WEBSITE',
        status: 'NEW',
        date: new Date().toISOString()
      };
      this.state.enquiries.unshift(newEnq);
      this.commit();
      return newEnq;
    }

    updateEnquiryStatus(id, status) {
      const enq = this.state.enquiries.find(e => e.id === id);
      if (enq) {
        enq.status = status;
        this.commit();
      }
    }

    getReviews(productId = null) {
      let list = this.state.reviews || [];
      if (productId) {
        const num = parseInt(productId, 10);
        list = list.filter(r => r.product_id === num);
      }
      return list;
    }

    addReview(revData) {
      const rev = {
        id: 'REV-' + Date.now().toString(36),
        product_id: parseInt(revData.product_id, 10),
        customer_name: revData.customer_name || 'Verified Patron',
        rating: parseInt(revData.rating || 5, 10),
        review: revData.review || '',
        status: 'Approved',
        date: new Date().toISOString().split('T')[0]
      };
      this.state.reviews.unshift(rev);
      this.commit();
      return rev;
    }

    // ── EXECUTIVE REPORTING & FINANCIALS ──
    getFinancialReports(timeFilter = 'all') {
      const now = new Date();
      let startEpoch = 0;

      if (timeFilter === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        startEpoch = today.getTime();
      } else if (timeFilter === 'week') {
        startEpoch = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      } else if (timeFilter === 'month') {
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startEpoch = firstOfMonth.getTime();
      }

      const orders = this.getOrders().filter(o => {
        const oTime = new Date(o.created_at).getTime();
        return oTime >= startEpoch && o.order_status !== 'CANCELLED';
      });

      const expenses = this.getExpenses().filter(e => {
        const eTime = new Date(e.date).getTime();
        return eTime >= startEpoch;
      });

      let totalRevenue = 0;
      let totalCogs = 0;
      let onlineRevenue = 0;
      let posRevenue = 0;
      let onlineOrdersCount = 0;
      let posOrdersCount = 0;
      let totalTaxCollected = 0;
      let paymentMethods = { CASH: 0, UPI: 0, CARD: 0, SPLIT: 0, NETBANKING: 0 };
      let categorySales = {};

      for (const order of orders) {
        totalRevenue += (order.total || 0);
        totalTaxCollected += (order.tax_amount || 0);

        if (order.channel === 'POS') {
          posRevenue += (order.total || 0);
          posOrdersCount++;
        } else {
          onlineRevenue += (order.total || 0);
          onlineOrdersCount++;
        }

        const pm = (order.payment_method || 'CASH').toUpperCase();
        paymentMethods[pm] = (paymentMethods[pm] || 0) + (order.total || 0);

        for (const item of (order.items || [])) {
          totalCogs += (item.purchase_cost || Math.round(item.price * 0.58)) * (item.qty || 1);

          const prod = this.getProduct(item.product_id);
          const cat = prod ? prod.category : 'Silk';
          categorySales[cat] = (categorySales[cat] || 0) + (item.total || 0);
        }
      }

      const grossProfit = totalRevenue - totalCogs;
      const totalOperatingExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const netProfit = grossProfit - totalOperatingExpenses;
      const grossMarginPercent = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;

      // Inventory Valuation
      let inventoryUnits = 0;
      let inventoryCostValuation = 0;
      let inventoryRetailValuation = 0;

      for (const prod of this.getProducts()) {
        const q = prod.stock_qty || 0;
        inventoryUnits += q;
        inventoryCostValuation += q * (prod.purchase_cost || Math.round(prod.price * 0.58));
        inventoryRetailValuation += q * (prod.price || 0);
      }

      return {
        timeFilter,
        totalRevenue,
        totalOrders: orders.length,
        onlineRevenue,
        onlineOrdersCount,
        posRevenue,
        posOrdersCount,
        totalCogs,
        grossProfit,
        grossMarginPercent,
        totalOperatingExpenses,
        netProfit,
        totalTaxCollected,
        inventoryUnits,
        inventoryCostValuation,
        inventoryRetailValuation,
        paymentMethods,
        categorySales,
        recentOrders: orders.slice(0, 8),
        expenses
      };
    }

    // ── BACKUP & RESTORE ──
    exportJSON() {
      return JSON.stringify(this.state, null, 2);
    }

    importJSON(jsonStr, adminUser = 'Bhanu (Owner)') {
      try {
        const parsed = JSON.parse(jsonStr);
        if (!parsed.products || !parsed.settings) {
          throw new Error('Invalid Shanmuka Fashions database schema.');
        }
        this.state = parsed;
        this.logAudit('DATABASE_RESTORE', 'DATABASE', 'ALL', 'Restored database from JSON backup file', adminUser);
        this.commit();
        return true;
      } catch (e) {
        throw new Error('Failed to import database: ' + e.message);
      }
    }

    resetToDemoData(adminUser = 'Bhanu (Owner)') {
      this.state = JSON.parse(JSON.stringify(DEMO_SEED));
      this.logAudit('DATABASE_RESET', 'DATABASE', 'ALL', 'Reset database to master demo dataset', adminUser);
      this.commit();
      return true;
    }

    resetToEmptyState(adminUser = 'Bhanu (Owner)') {
      this.state = JSON.parse(JSON.stringify(EMPTY_SEED));
      this.logAudit('DATABASE_RESET', 'DATABASE', 'ALL', 'Reset database to clean production empty state', adminUser);
      this.commit();
      return true;
    }

    // Synchronize local cache with central Supabase Cloud database
    async syncWithCloud() {
      const sb = (typeof SFSupabase !== 'undefined') ? SFSupabase : (typeof window !== 'undefined' && window.SFSupabase ? window.SFSupabase : null);
      if (!sb || typeof sb.fetchProducts !== 'function') return false;

      try {
        const rawProds = await sb.fetchProducts({ publishedOnly: false });
        const cloudProds = Array.isArray(rawProds) ? rawProds : (rawProds && Array.isArray(rawProds.data) ? rawProds.data : []);
        
        const cloudProdsMapped = cloudProds.map(p => ({
          ...p,
          id: typeof p.id === 'string' && /^\d+$/.test(p.id) ? parseInt(p.id, 10) : p.id,
          price: Number(p.price) || 0,
          old: Number(p.old_price || p.old) || 0,
          purchase_cost: Number(p.purchase_cost) || 0,
          stock_qty: Number(p.stock_qty) || 0,
          desc: p.description || p.desc || '',
          images: Array.isArray(p.images) && p.images.length ? p.images : (p.img ? [p.img] : [])
        }));

        // Preserve any locally created products that aren't yet in the cloud
        const cloudIds = new Set(cloudProdsMapped.map(p => String(p.id)));
        const cloudSkus = new Set(cloudProdsMapped.map(p => String(p.sku || '').toUpperCase()));
        const localPending = (this.state.products || []).filter(p => !cloudIds.has(String(p.id)) && !cloudSkus.has(String(p.sku || '').toUpperCase()));

        this.state.products = [...cloudProdsMapped, ...localPending];

        const rawOrders = await sb.fetchOrders();
        const cloudOrders = Array.isArray(rawOrders) ? rawOrders : (rawOrders && Array.isArray(rawOrders.data) ? rawOrders.data : []);
        const cloudOrderIds = new Set(cloudOrders.map(o => String(o.order_number || o.id)));
        const localOrdersPending = (this.state.orders || []).filter(o => !cloudOrderIds.has(String(o.order_number || o.id)));
        this.state.orders = [...cloudOrders, ...localOrdersPending];

        // Sync Customers from cloud
        if (typeof sb.fetchCustomers === 'function') {
          try {
            const rawCustomers = await sb.fetchCustomers();
            const cloudCusts = Array.isArray(rawCustomers) ? rawCustomers : [];
            if (cloudCusts.length) {
              const cloudCustIds = new Set(cloudCusts.map(c => String(c.id)));
              const localPendingCusts = (this.state.customers || []).filter(c => !cloudCustIds.has(String(c.id)));
              this.state.customers = [...cloudCusts, ...localPendingCusts];
            }
          } catch (custErr) {
            console.warn('Customer cloud fetch notice:', custErr);
          }
        }

        // Sync CMS content & video history from cloud
        if (typeof sb.fetchCMSFromCloud === 'function') {
          try {
            const cloudCMS = await sb.fetchCMSFromCloud();
            if (cloudCMS && cloudCMS.hero_video) {
              const currentHistory = this.getVideoHistory();
              const cloudHistory = Array.isArray(cloudCMS.video_history) ? cloudCMS.video_history : [];
              // Merge video histories by URL
              const existingUrls = new Set(currentHistory.map(v => v.url));
              const newFromCloud = cloudHistory.filter(v => !existingUrls.has(v.url));
              const mergedHistory = [...currentHistory, ...newFromCloud];

              this.state.cms = {
                ...this.state.cms,
                hero_video: cloudCMS.hero_video || this.state.cms.hero_video,
                announcement_bar: cloudCMS.announcement_bar || this.state.cms.announcement_bar,
                hero_eyebrow: cloudCMS.hero_eyebrow || this.state.cms.hero_eyebrow,
                hero_heading: cloudCMS.hero_heading || this.state.cms.hero_heading,
                hero_tagline: cloudCMS.hero_tagline || this.state.cms.hero_tagline,
                hero_narrative: cloudCMS.hero_narrative || this.state.cms.hero_narrative,
                video_history: mergedHistory
              };
            }
          } catch (cmsErr) {
            console.warn('CMS cloud fetch notice:', cmsErr);
          }
        }

        this._sanitize(this.state);
        this.commit();
        this.notifyListeners();
        return true;
      } catch (e) {
        console.warn('SFDatabase cloud sync exception:', e);
        return false;
      }
    }
  }

  function moneyFormat(n) {
    return '₹' + (n || 0).toLocaleString('en-IN');
  }

  // Singleton instance
  const instance = new DatabaseEngine();
  return instance;
}));

