/**
 * Shanmuka Fashions — Supabase Cloud Database Integration
 * Project URL: https://htnwmwzqhqyjwkdcxpez.supabase.co
 * Key: sb_publishable_d48TInDmZNvKxO1IZdQSVA_CoX2Q46-
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SFSupabase = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const CONFIG = {
    url: 'https://htnwmwzqhqyjwkdcxpez.supabase.co',
    anonKey: 'sb_publishable_d48TInDmZNvKxO1IZdQSVA_CoX2Q46-',
    projectRef: 'htnwmwzqhqyjwkdcxpez'
  };

  let client = null;
  let isConnected = false;

  function initClient() {
    if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        client = window.supabase.createClient(CONFIG.url, CONFIG.anonKey);
        isConnected = true;
        console.log(' Shanmuka Fashions: Supabase client initialized successfully.');
      } catch (err) {
        console.warn(' Shanmuka Fashions: Supabase client init warning:', err);
      }
    }
  }

  // Initialize immediately if supabase sdk is already loaded
  initClient();

  const SFSupabase = {
    config: CONFIG,

    getClient: function () {
      if (!client) initClient();
      return client;
    },

    isReady: function () {
      return !!client;
    },

    // Check connectivity to Supabase Auth / REST health
    checkHealth: async function () {
      try {
        const res = await fetch(`${CONFIG.url}/auth/v1/health`, {
          headers: { 'apikey': CONFIG.anonKey }
        });
        return res.ok;
      } catch (e) {
        return false;
      }
    },

    // Sync remote products into local SFDatabase
    syncProductsFromCloud: async function () {
      const sb = this.getClient();
      if (!sb) return false;
      try {
        const { data, error } = await sb
          .from('products')
          .select('*')
          .eq('status', 'published');
        
        if (error) {
          console.warn('Supabase products fetch note:', error.message);
          return false;
        }

        if (data && data.length > 0 && typeof SFDatabase !== 'undefined') {
          console.log(` Synced ${data.length} products from Supabase cloud.`);
          data.forEach(p => SFDatabase.saveProduct(p));
          return true;
        }
      } catch (err) {
        console.warn('Supabase sync skipped:', err);
      }
      return false;
    },

    // Push newly placed order to Supabase cloud
    pushOrderToCloud: async function (order) {
      const sb = this.getClient();
      if (!sb) return null;
      try {
        const payload = {
          id: order.id,
          order_number: order.order_number,
          channel: order.channel || 'ONLINE',
          customer_id: order.customer_id || null,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          customer_email: order.customer_email || null,
          items: order.items,
          subtotal: order.subtotal,
          discount: order.discount || 0,
          coupon_code: order.coupon_code || null,
          tax_rate: order.tax_rate || 5,
          tax_amount: order.tax_amount || 0,
          shipping_charges: order.shipping_charges || 0,
          total: order.total,
          payment_method: order.payment_method,
          payment_status: order.payment_status || 'Completed',
          payment_reference: order.payment_reference || null,
          order_status: order.order_status || 'Pending',
          delivery_address: order.delivery_address || null,
          order_notes: order.order_notes || null,
          created_at: order.created_at || new Date().toISOString()
        };

        const { data, error } = await sb.from('orders').insert([payload]);
        if (error) {
          console.warn('Supabase order cloud backup note:', error.message);
        } else {
          console.log(' Order synced to Supabase Cloud:', order.order_number);
        }
        return data;
      } catch (e) {
        console.warn('Supabase pushOrder exception:', e);
      }
      return null;
    },

    // Record customer VIP concierge enquiry in Supabase
    recordEnquiry: async function (enquiry) {
      const sb = this.getClient();
      if (!sb) return false;
      try {
        const { error } = await sb.from('enquiries').insert([{
          id: enquiry.id || ('enq_' + Date.now()),
          name: enquiry.name,
          phone: enquiry.phone,
          email: enquiry.email || null,
          saree_id: enquiry.saree_id || null,
          message: enquiry.message,
          source: enquiry.source || 'WEBSITE_CONCIERGE'
        }]);
        if (error) {
          console.warn('Supabase enquiry note:', error.message);
          return false;
        }
        return true;
      } catch (e) {
        return false;
      }
    },

    // Setup auto-sync hooks with SFDatabase
    setupHooks: function () {
      if (typeof SFDatabase === 'undefined') return;

      // Listen for database changes to sync to cloud
      SFDatabase.subscribe((action, entity, data) => {
        if (action === 'CREATE' && entity === 'ORDER') {
          SFSupabase.pushOrderToCloud(data);
        }
      });
    }
  };

  // Auto-setup when window loads
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
      initClient();
      SFSupabase.setupHooks();
      SFSupabase.syncProductsFromCloud();
    });
  }

  return SFSupabase;
}));

