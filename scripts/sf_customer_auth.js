/**
 * Shanmuka Fashions — Professional Customer Authentication & Account Engine
 * High-security Supabase Auth integration, session persistence, RLS profile sync,
 * input validation, and route protection.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SFCustomerAuth = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const SESSION_KEY = 'sf_customer_auth_session_v1';
  const PENDING_VERIFICATION_KEY = 'sf_pending_email_verification';
  const CUSTOMER_PROFILES_LOCAL = 'sf_customer_profiles_local_v1';

  let currentCustomer = null;
  let authListeners = [];
  let resendCooldown = 0;
  let resendTimerInterval = null;

  // ── 1. REAL-TIME INPUT VALIDATION SUITE ──
  const Validation = {
    isValidEmail: function (email) {
      if (!email || typeof email !== 'string') return false;
      const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
      return re.test(email.trim());
    },

    isValidIndianPhone: function (phone) {
      if (!phone || typeof phone !== 'string') return false;
      const clean = phone.replace(/[^0-9]/g, '');
      // Accepts 10 digits starting with 6, 7, 8, or 9; or 12 digits starting with 91
      if (clean.length === 10 && /^[6-9]\d{9}$/.test(clean)) return true;
      if (clean.length === 12 && /^91[6-9]\d{9}$/.test(clean)) return true;
      return false;
    },

    formatIndianPhone: function (phone) {
      if (!phone) return '';
      const clean = phone.replace(/[^0-9]/g, '');
      if (clean.length === 10) return '+91 ' + clean.slice(0, 5) + ' ' + clean.slice(5);
      if (clean.length === 12 && clean.startsWith('91')) {
        return '+91 ' + clean.slice(2, 7) + ' ' + clean.slice(7);
      }
      return phone;
    },

    evaluatePasswordStrength: function (password) {
      const p = password || '';
      const errors = [];
      let score = 0;

      if (p.length >= 8) score += 1;
      else errors.push('At least 8 characters');

      if (/[A-Z]/.test(p)) score += 1;
      else errors.push('At least one uppercase letter (A-Z)');

      if (/[a-z]/.test(p)) score += 1;
      else errors.push('At least one lowercase letter (a-z)');

      if (/[0-9]/.test(p)) score += 1;
      else errors.push('At least one number (0-9)');

      if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)) score += 1;
      else errors.push('At least one special character (!@#$...)');

      let label = 'Weak';
      let color = '#C25E5E';
      if (score >= 5) {
        label = 'Strong';
        color = '#388E3C';
      } else if (score >= 3) {
        label = 'Moderate';
        color = '#B58A45';
      }

      return {
        score: score,
        maxScore: 5,
        isValid: score >= 4 && p.length >= 8,
        label: label,
        color: color,
        errors: errors
      };
    }
  };

  // ── 2. SESSION STORE & LOCAL RECOVERY ──
  const _memoryStorage = {};
  function hashPassword(pwd) {
    if (!pwd) return '';
    let hash = 0;
    for (let i = 0; i < pwd.length; i++) {
      const char = pwd.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash | 0;
    }
    return 'sf_h_' + Math.abs(hash) + '_' + pwd.length;
  }

  function getStorageItem(k) {
    try {
      if (typeof localStorage !== 'undefined') return localStorage.getItem(k);
      return _memoryStorage[k] || null;
    } catch (e) {
      return _memoryStorage[k] || null;
    }
  }

  function setStorageItem(k, v) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(k, v);
      else _memoryStorage[k] = v;
    } catch (e) {
      _memoryStorage[k] = v;
    }
  }

  function removeStorageItem(k) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(k);
      else delete _memoryStorage[k];
    } catch (e) {
      delete _memoryStorage[k];
    }
  }

  function loadSessionFromStorage() {
    try {
      const data = getStorageItem(SESSION_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && parsed.email) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Session parse error:', e);
    }
    return null;
  }

  function saveSessionToStorage(cust) {
    try {
      if (cust) {
        setStorageItem(SESSION_KEY, JSON.stringify(cust));
      } else {
        removeStorageItem(SESSION_KEY);
      }
    } catch (e) {
      console.warn('Session save error:', e);
    }
  }

  function getLocalProfiles() {
    try {
      const data = getStorageItem(CUSTOMER_PROFILES_LOCAL);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  function saveLocalProfile(profile) {
    try {
      const profiles = getLocalProfiles();
      profiles[profile.email.toLowerCase()] = profile;
      setStorageItem(CUSTOMER_PROFILES_LOCAL, JSON.stringify(profiles));
    } catch (e) {}
  }

  // ── 3. CORE CUSTOMER AUTHENTICATION METHODS ──
  const SFCustomerAuth = {
    validation: Validation,

    init: function () {
      currentCustomer = loadSessionFromStorage();
      
      // Wire Supabase onAuthStateChange if client is available
      if (typeof window !== 'undefined' && typeof SFSupabase !== 'undefined') {
        const sb = SFSupabase.getClient();
        if (sb && sb.auth && typeof sb.auth.onAuthStateChange === 'function') {
          try {
            sb.auth.onAuthStateChange(async (event, session) => {
              if (event === 'SIGNED_IN' && session && session.user) {
                await this._syncUserFromSession(session.user);
              } else if (event === 'SIGNED_OUT') {
                this._clearSession();
              }
            });
          } catch (e) {
            console.warn('Supabase auth state listener note:', e);
          }
        }
      }
    },

    subscribe: function (listener) {
      if (typeof listener === 'function') {
        authListeners.push(listener);
      }
      return () => {
        authListeners = authListeners.filter(l => l !== listener);
      };
    },

    notifyListeners: function (event, data) {
      authListeners.forEach(fn => {
        try { fn(event, data); } catch (e) { console.error(e); }
      });
      // Trigger header UI update if available
      if (typeof updateHeaderAuthUI === 'function') {
        updateHeaderAuthUI();
      }
    },

    isAuthenticated: function () {
      return !!(currentCustomer && currentCustomer.id && currentCustomer.email);
    },

    isEmailVerified: function () {
      if (!this.isAuthenticated()) return false;
      return currentCustomer.email_verified !== false;
    },

    getCurrentCustomer: function () {
      if (!currentCustomer) {
        currentCustomer = loadSessionFromStorage();
      }
      return currentCustomer;
    },

    // ── REGISTER NEW CUSTOMER ──
    register: async function ({ fullName, email, phone, password }) {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanName = (fullName || '').trim();
      const cleanPhone = (phone || '').trim();

      // Client-side validations
      if (!cleanName || cleanName.length < 2) {
        return { success: false, message: 'Please provide your complete full name.' };
      }
      if (!Validation.isValidEmail(cleanEmail)) {
        return { success: false, message: 'Please enter a valid email address.' };
      }
      if (!Validation.isValidIndianPhone(cleanPhone)) {
        return { success: false, message: 'Please enter a valid 10-digit Indian mobile number.' };
      }
      const pwdCheck = Validation.evaluatePasswordStrength(password);
      if (!pwdCheck.isValid) {
        return { success: false, message: 'Password is too weak. ' + pwdCheck.errors.join(', ') + '.' };
      }

      // Check existing local accounts first
      const profiles = getLocalProfiles();
      if (profiles[cleanEmail]) {
        return { success: false, message: 'An account with this email address already exists. Please sign in instead.' };
      }

      let supabaseRegistered = false;
      let newUserId = 'cust_' + Date.now();
      let needsEmailVerification = true;

      // Try Supabase Auth
      if (typeof SFSupabase !== 'undefined') {
        const sb = SFSupabase.getClient();
        if (sb && sb.auth) {
          try {
            const { data, error } = await sb.auth.signUp({
              email: cleanEmail,
              password: password,
              options: {
                data: {
                  full_name: cleanName,
                  phone: cleanPhone
                }
              }
            });

            if (error) {
              if (error.message && error.message.toLowerCase().includes('already registered')) {
                return { success: false, message: 'An account with this email already exists. Please sign in.' };
              }
              console.warn('Supabase Auth signUp note:', error.message);
            } else if (data && data.user) {
              supabaseRegistered = true;
              newUserId = data.user.id;
              // If email confirmation is enabled, data.session will be null until verified
              needsEmailVerification = !data.session;
            }
          } catch (err) {
            console.warn('Supabase Auth signUp exception:', err);
          }
        }
      }

      // Create Customer Profile Record
      const newCustomer = {
        id: newUserId,
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password_hash: hashPassword(password),
        avatar_url: null,
        email_verified: !needsEmailVerification,
        addresses: [],
        default_address_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      saveLocalProfile(newCustomer);

      if (needsEmailVerification) {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify({
            email: cleanEmail,
            name: cleanName,
            timestamp: Date.now()
          }));
        }
        return {
          success: true,
          needsEmailVerification: true,
          email: cleanEmail,
          message: 'Account created! Please verify your email to continue.'
        };
      } else {
        currentCustomer = newCustomer;
        saveSessionToStorage(newCustomer);
        this.notifyListeners('REGISTER_SUCCESS', newCustomer);
        return {
          success: true,
          needsEmailVerification: false,
          customer: newCustomer,
          message: 'Welcome to Shanmuka Fashions!'
        };
      }
    },

    // ── RESEND VERIFICATION EMAIL ──
    resendVerificationEmail: async function (email) {
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail) return { success: false, message: 'Email address missing.' };

      if (typeof SFSupabase !== 'undefined') {
        const sb = SFSupabase.getClient();
        if (sb && sb.auth && typeof sb.auth.resend === 'function') {
          try {
            const { error } = await sb.auth.resend({
              type: 'signup',
              email: cleanEmail
            });
            if (error) {
              console.warn('Supabase resend note:', error.message);
            }
          } catch (e) {
            console.warn('Resend exception:', e);
          }
        }
      }

      return {
        success: true,
        message: 'A fresh verification link has been dispatched to ' + cleanEmail + '.'
      };
    },

    // ── LOGIN CUSTOMER ──
    login: async function ({ email, password, rememberMe = true }) {
      const cleanEmail = (email || '').trim().toLowerCase();
      const p = (password || '').trim();

      if (!cleanEmail || !Validation.isValidEmail(cleanEmail)) {
        return { success: false, message: 'Please enter a valid email address.' };
      }
      if (!p) {
        return { success: false, message: 'Please enter your password.' };
      }

      let authSuccess = false;
      let authenticatedUser = null;

      // 1. Authenticate with Supabase Auth
      if (typeof SFSupabase !== 'undefined') {
        const sb = SFSupabase.getClient();
        if (sb && sb.auth) {
          try {
            const { data, error } = await sb.auth.signInWithPassword({
              email: cleanEmail,
              password: p
            });

            if (error) {
              if (error.message && error.message.toLowerCase().includes('email not confirmed')) {
                return {
                  success: false,
                  needsEmailVerification: true,
                  email: cleanEmail,
                  message: 'Your email address is not yet verified. Please inspect your inbox for the confirmation link.'
                };
              }
              if (error.message && (error.message.toLowerCase().includes('invalid login credentials') || error.message.toLowerCase().includes('invalid credentials'))) {
                return { success: false, message: 'Incorrect email address or password. Please recheck your credentials.' };
              }
              console.warn('Supabase signInWithPassword note:', error.message);
            } else if (data && data.user) {
              authSuccess = true;
              authenticatedUser = data.user;
            }
          } catch (err) {
            console.warn('Supabase login exception:', err);
          }
        }
      }

      // 2. Fallback / Local Profile check
      const profiles = getLocalProfiles();
      const localProfile = profiles[cleanEmail];

      if (!authSuccess && localProfile) {
        if (localProfile.password_hash && localProfile.password_hash !== hashPassword(p)) {
          return { success: false, message: 'Incorrect email address or password. Please recheck your credentials.' };
        }
        if (p.length >= 8) {
          authSuccess = true;
          authenticatedUser = {
            id: localProfile.id,
            email: cleanEmail,
            user_metadata: {
              full_name: localProfile.full_name,
              phone: localProfile.phone
            }
          };
        }
      }

      if (!authSuccess) {
        return { success: false, message: 'Incorrect email address or password. Please recheck your credentials.' };
      }

      // Build customer object
      const customer = {
        id: authenticatedUser.id,
        email: cleanEmail,
        full_name: localProfile?.full_name || authenticatedUser.user_metadata?.full_name || cleanEmail.split('@')[0],
        phone: localProfile?.phone || authenticatedUser.user_metadata?.phone || '',
        avatar_url: localProfile?.avatar_url || null,
        addresses: localProfile?.addresses || [],
        default_address_id: localProfile?.default_address_id || null,
        created_at: localProfile?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      currentCustomer = customer;
      saveLocalProfile(customer);
      if (rememberMe) {
        saveSessionToStorage(customer);
      } else {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(customer));
        }
      }

      // Link any orders placed previously with this email
      if (typeof SFDatabase !== 'undefined') {
        const orders = SFDatabase.getOrders();
        orders.forEach(o => {
          if (o.customer_email && o.customer_email.toLowerCase() === cleanEmail && !o.customer_id) {
            o.customer_id = customer.id;
          }
        });
        SFDatabase.commit();
      }

      this.notifyListeners('LOGIN_SUCCESS', customer);
      return { success: true, customer: customer };
    },

    // ── FORGOT PASSWORD (SAFE RECOVERY) ──
    forgotPassword: async function (email) {
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!Validation.isValidEmail(cleanEmail)) {
        return { success: false, message: 'Please enter a valid email address.' };
      }

      if (typeof SFSupabase !== 'undefined') {
        const sb = SFSupabase.getClient();
        if (sb && sb.auth) {
          try {
            const redirectUrl = window.location.origin + window.location.pathname + '#/reset-password';
            await sb.auth.resetPasswordForEmail(cleanEmail, { redirectTo: redirectUrl });
          } catch (e) {
            console.warn('resetPasswordForEmail note:', e);
          }
        }
      }

      // Strict security: Never reveal whether an email is registered or not
      return {
        success: true,
        message: 'If an account exists for ' + cleanEmail + ', a secure password reset link has been dispatched to your inbox.'
      };
    },

    // ── RESET PASSWORD ──
    resetPassword: async function (newPassword) {
      const p = (newPassword || '').trim();
      const check = Validation.evaluatePasswordStrength(p);
      if (!check.isValid) {
        return { success: false, message: 'Password is too weak. ' + check.errors.join(', ') };
      }

      if (typeof SFSupabase !== 'undefined') {
        const sb = SFSupabase.getClient();
        if (sb && sb.auth) {
          try {
            const { error } = await sb.auth.updateUser({ password: p });
            if (error) {
              return { success: false, message: error.message };
            }
          } catch (e) {
            console.warn('resetPassword exception:', e);
          }
        }
      }

      if (currentCustomer && currentCustomer.email) {
        const profiles = getLocalProfiles();
        const loc = profiles[currentCustomer.email.toLowerCase()];
        if (loc) {
          loc.password_hash = hashPassword(p);
          saveLocalProfile(loc);
        }
      }

      return {
        success: true,
        message: 'Your password has been successfully updated. You may now sign in with your new password.'
      };
    },

    // ── LOGOUT ──
    logout: async function () {
      if (typeof SFSupabase !== 'undefined') {
        const sb = SFSupabase.getClient();
        if (sb && sb.auth) {
          try {
            await sb.auth.signOut();
          } catch (e) {}
        }
      }

      this._clearSession();
      this.notifyListeners('LOGOUT', null);
      return { success: true };
    },

    _clearSession: function () {
      currentCustomer = null;
      saveSessionToStorage(null);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(SESSION_KEY);
      }
    },

    _syncUserFromSession: async function (user) {
      if (!user) return;
      const cleanEmail = (user.email || '').toLowerCase();
      const profiles = getLocalProfiles();
      const local = profiles[cleanEmail] || {};

      const cust = {
        id: user.id,
        email: cleanEmail,
        full_name: user.user_metadata?.full_name || local.full_name || cleanEmail.split('@')[0],
        phone: user.user_metadata?.phone || local.phone || '',
        avatar_url: local.avatar_url || null,
        addresses: local.addresses || [],
        default_address_id: local.default_address_id || null,
        created_at: local.created_at || user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      currentCustomer = cust;
      saveSessionToStorage(cust);
      saveLocalProfile(cust);
      this.notifyListeners('SESSION_SYNC', cust);
    },

    // ── 4. CUSTOMER PROFILE & ADDRESS BOOK MANAGEMENT ──
    updateProfile: async function ({ fullName, phone }) {
      if (!this.isAuthenticated()) return { success: false, message: 'Unauthorized' };

      const cleanName = (fullName || '').trim();
      const cleanPhone = (phone || '').trim();

      if (cleanName.length < 2) {
        return { success: false, message: 'Please provide a valid full name.' };
      }
      if (cleanPhone && !Validation.isValidIndianPhone(cleanPhone)) {
        return { success: false, message: 'Please provide a valid 10-digit Indian mobile number.' };
      }

      currentCustomer.full_name = cleanName;
      if (cleanPhone) currentCustomer.phone = cleanPhone;
      currentCustomer.updated_at = new Date().toISOString();

      saveSessionToStorage(currentCustomer);
      saveLocalProfile(currentCustomer);

      // Sync with Supabase Auth and customer_profiles
      if (typeof SFSupabase !== 'undefined') {
        const sb = SFSupabase.getClient();
        if (sb) {
          try {
            if (sb.auth) {
              await sb.auth.updateUser({
                data: { full_name: cleanName, phone: cleanPhone }
              });
            }
            await sb.from('customer_profiles').upsert({
              id: currentCustomer.id,
              full_name: cleanName,
              phone: cleanPhone,
              updated_at: new Date().toISOString()
            });
          } catch (e) {
            console.warn('Cloud profile sync note:', e);
          }
        }
      }

      this.notifyListeners('PROFILE_UPDATED', currentCustomer);
      return { success: true, message: 'Profile updated successfully!', customer: currentCustomer };
    },

    // ── ADDRESS MANAGEMENT ──
    getAddresses: function () {
      if (!this.isAuthenticated()) return [];
      return currentCustomer.addresses || [];
    },

    saveAddress: function (addressData) {
      if (!this.isAuthenticated()) return { success: false, message: 'Unauthorized' };

      if (!addressData.full_name || !addressData.phone || !addressData.street || !addressData.city || !addressData.pincode) {
        return { success: false, message: 'Please fill in all mandatory address fields marked with *.' };
      }

      if (!currentCustomer.addresses) currentCustomer.addresses = [];

      let savedId = addressData.id;
      if (savedId) {
        // Edit existing
        const idx = currentCustomer.addresses.findIndex(a => a.id === savedId);
        if (idx !== -1) {
          currentCustomer.addresses[idx] = { ...addressData, id: savedId, updated_at: new Date().toISOString() };
        }
      } else {
        // Add new
        savedId = 'addr_' + Date.now();
        const isFirst = currentCustomer.addresses.length === 0;
        const newAddr = {
          ...addressData,
          id: savedId,
          is_default: addressData.is_default || isFirst,
          created_at: new Date().toISOString()
        };
        currentCustomer.addresses.push(newAddr);
        if (newAddr.is_default) {
          currentCustomer.default_address_id = savedId;
        }
      }

      saveSessionToStorage(currentCustomer);
      saveLocalProfile(currentCustomer);
      this.notifyListeners('ADDRESS_SAVED', currentCustomer.addresses);
      return { success: true, addressId: savedId };
    },

    deleteAddress: function (addressId) {
      if (!this.isAuthenticated() || !currentCustomer.addresses) return false;
      currentCustomer.addresses = currentCustomer.addresses.filter(a => a.id !== addressId);
      if (currentCustomer.default_address_id === addressId) {
        currentCustomer.default_address_id = currentCustomer.addresses[0]?.id || null;
      }
      saveSessionToStorage(currentCustomer);
      saveLocalProfile(currentCustomer);
      this.notifyListeners('ADDRESS_DELETED', currentCustomer.addresses);
      return true;
    },

    setDefaultAddress: function (addressId) {
      if (!this.isAuthenticated() || !currentCustomer.addresses) return false;
      currentCustomer.addresses.forEach(a => {
        a.is_default = (a.id === addressId);
      });
      currentCustomer.default_address_id = addressId;
      saveSessionToStorage(currentCustomer);
      saveLocalProfile(currentCustomer);
      this.notifyListeners('ADDRESS_DEFAULT_CHANGED', addressId);
      return true;
    },

    // ── 5. ORDER HISTORY FOR AUTHENTICATED CUSTOMER ──
    getCustomerOrders: function () {
      if (!this.isAuthenticated()) return [];
      const email = currentCustomer.email.toLowerCase();
      const custId = currentCustomer.id;

      let allOrders = [];
      const db = typeof SFDatabase !== 'undefined' ? SFDatabase : (typeof require !== 'undefined' ? require('./sf_database') : null);
      if (db && typeof db.getOrders === 'function') {
        allOrders = db.getOrders();
      }

      // Filter orders where customer_email matches or customer_id matches
      return allOrders.filter(o => {
        const orderEmail = (o.customer_email || (o.customer && o.customer.email) || '').toLowerCase();
        const orderCustId = o.customer_id;
        return (orderEmail && orderEmail === email) || (orderCustId && orderCustId === custId);
      });
    }
  };

  // Auto-init
  if (typeof window !== 'undefined') {
    SFCustomerAuth.init();
  }

  return SFCustomerAuth;
}));
