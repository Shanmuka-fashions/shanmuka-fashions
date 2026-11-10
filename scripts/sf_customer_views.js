/**
 * Shanmuka Fashions — Luxury Customer Authentication & Portal Views
 * Implements Split-Screen Login, Registration with Email Verification,
 * Password Recovery, and the Protected Patron Account Area.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SFCustomerViews = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  let resendInterval = null;
  let cooldownSeconds = 0;

  function getQueryParam(key) {
    try {
      const hash = window.location.hash || '';
      const qIndex = hash.indexOf('?');
      if (qIndex === -1) return null;
      const params = new URLSearchParams(hash.slice(qIndex + 1));
      return params.get(key);
    } catch (e) {
      return null;
    }
  }

  const SFCustomerViews = {

    // ── 1. CUSTOMER LOGIN VIEW (SPLIT-SCREEN) ──
    renderLogin: function (containerId = 'appRoot') {
      const container = document.getElementById(containerId);
      if (!container) return;

      const redirectTarget = getQueryParam('redirect') || '#/account';

      // If already logged in, redirect to target
      if (typeof SFCustomerAuth !== 'undefined' && SFCustomerAuth.isAuthenticated()) {
        window.location.hash = redirectTarget;
        return;
      }

      container.innerHTML = `
        <div class="sf-auth-split-wrapper">
          <!-- Left Editorial Visual Pane -->
          <div class="sf-auth-visual-pane" style="background-image: url('assets/hero-model.jpg');">
            <div class="sf-auth-visual-overlay"></div>
            <div class="sf-auth-visual-content">
              <span class="sf-auth-visual-badge">✨ Heritage Atelier Patron</span>
            </div>
            <div class="sf-auth-visual-content">
              <blockquote class="sf-auth-visual-quote">
                &ldquo;A tapestry of timeless heritage, woven with devotion for the discerning woman.&rdquo;
              </blockquote>
              <div class="sf-auth-visual-subquote">Silk Mark Certified Pure Silks &bull; Handloom Provenance</div>
            </div>
          </div>

          <!-- Right Form Pane -->
          <div class="sf-auth-form-pane">
            <div class="sf-auth-card">
              <div class="sf-auth-brand-header">
                <img src="logo.png" alt="Shanmuka Fashions Emblem" class="sf-auth-logo">
                <h1 class="sf-auth-title">Welcome Back</h1>
                <p class="sf-auth-subtitle">Sign in to continue your journey with Shanmuka Fashions.</p>
              </div>

              <div id="loginAlertBox"></div>

              <form id="sfLoginForm" onsubmit="SFCustomerViews.handleLoginSubmit(event, '${encodeURIComponent(redirectTarget)}')">
                <div class="sf-auth-group">
                  <label class="sf-auth-label" for="loginEmail">Email Address *</label>
                  <div class="sf-auth-input-wrap">
                    <input type="email" id="loginEmail" required class="sf-auth-input" placeholder="name@domain.com" autocomplete="email">
                  </div>
                </div>

                <div class="sf-auth-group">
                  <label class="sf-auth-label" for="loginPassword">Password *</label>
                  <div class="sf-auth-input-wrap">
                    <input type="password" id="loginPassword" required class="sf-auth-input" placeholder="Enter your password" autocomplete="current-password">
                    <button type="button" class="sf-pwd-toggle-btn" onclick="SFCustomerViews.togglePasswordVisibility('loginPassword', this)" title="Show / Hide Password">
                      👁️
                    </button>
                  </div>
                </div>

                <div class="sf-auth-row-options">
                  <label class="sf-auth-checkbox-label">
                    <input type="checkbox" id="loginRemember" checked>
                    <span>Remember me</span>
                  </label>
                  <a href="#/forgot-password" class="sf-auth-link">Forgot Password?</a>
                </div>

                <button type="submit" id="loginSubmitBtn" class="sf-auth-btn-primary">
                  <span>Sign In to Atelier</span>
                </button>
              </form>

              <div class="sf-auth-footer-nav">
                New to Shanmuka Fashions? 
                <a href="#/register?redirect=${encodeURIComponent(redirectTarget)}" class="sf-auth-link">Create an Account &rarr;</a>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    handleLoginSubmit: async function (e, encodedRedirect) {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const rememberMe = document.getElementById('loginRemember').checked;
      const alertBox = document.getElementById('loginAlertBox');
      const submitBtn = document.getElementById('loginSubmitBtn');

      alertBox.innerHTML = '';
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Verifying Credentials...</span>';

      const res = await SFCustomerAuth.login({ email, password, rememberMe });
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Sign In to Atelier</span>';

      if (res.success) {
        const dest = decodeURIComponent(encodedRedirect || '#/account');
        window.location.hash = dest;
      } else if (res.needsEmailVerification) {
        SFCustomerViews.renderVerificationNotice(email);
      } else {
        alertBox.innerHTML = `
          <div class="sf-auth-error-alert">
            <span>⚠️</span>
            <span>${res.message || 'Invalid email or password.'}</span>
          </div>
        `;
      }
    },

    // ── 2. CUSTOMER REGISTRATION VIEW ──
    renderRegister: function (containerId = 'appRoot') {
      const container = document.getElementById(containerId);
      if (!container) return;

      const redirectTarget = getQueryParam('redirect') || '#/account';

      container.innerHTML = `
        <div class="sf-auth-split-wrapper">
          <!-- Left Editorial Visual Pane -->
          <div class="sf-auth-visual-pane" style="background-image: url('assets/golden-silk-saree-clean.jpg');">
            <div class="sf-auth-visual-overlay"></div>
            <div class="sf-auth-visual-content">
              <span class="sf-auth-visual-badge">✨ Bespoke Saree Salon</span>
            </div>
            <div class="sf-auth-visual-content">
              <blockquote class="sf-auth-visual-quote">
                &ldquo;Join our patron circle for private bridal edits, silk mark authenticity, and bespoke drapes.&rdquo;
              </blockquote>
              <div class="sf-auth-visual-subquote">Generational Handlooms &bull; Kanchipuram & Varanasi Provenance</div>
            </div>
          </div>

          <!-- Right Form Pane -->
          <div class="sf-auth-form-pane">
            <div class="sf-auth-card">
              <div class="sf-auth-brand-header">
                <img src="logo.png" alt="Shanmuka Fashions Emblem" class="sf-auth-logo">
                <h1 class="sf-auth-title">Create Account</h1>
                <p class="sf-auth-subtitle">Join the Shanmuka Fashions luxury patron circle.</p>
              </div>

              <div id="registerAlertBox"></div>

              <form id="sfRegisterForm" onsubmit="SFCustomerViews.handleRegisterSubmit(event, '${encodeURIComponent(redirectTarget)}')">
                <div class="sf-auth-group">
                  <label class="sf-auth-label" for="regName">Full Name *</label>
                  <div class="sf-auth-input-wrap">
                    <input type="text" id="regName" required class="sf-auth-input" placeholder="e.g. Sravani Rao" autocomplete="name">
                  </div>
                </div>

                <div class="sf-auth-group">
                  <label class="sf-auth-label" for="regEmail">Email Address *</label>
                  <div class="sf-auth-input-wrap">
                    <input type="email" id="regEmail" required class="sf-auth-input" placeholder="sravani@domain.com" autocomplete="email">
                  </div>
                </div>

                <div class="sf-auth-group">
                  <label class="sf-auth-label" for="regPhone">Mobile Number (For Dispatch & WhatsApp) *</label>
                  <div class="sf-auth-input-wrap">
                    <span class="sf-auth-prefix">+91</span>
                    <input type="tel" id="regPhone" required class="sf-auth-input has-prefix" placeholder="98765 43210" maxlength="10">
                  </div>
                </div>

                <div class="sf-auth-group">
                  <label class="sf-auth-label" for="regPassword">Create Password *</label>
                  <div class="sf-auth-input-wrap">
                    <input type="password" id="regPassword" required class="sf-auth-input" placeholder="Minimum 8 characters" oninput="SFCustomerViews.onPasswordInput(this.value)">
                    <button type="button" class="sf-pwd-toggle-btn" onclick="SFCustomerViews.togglePasswordVisibility('regPassword', this)">
                      👁️
                    </button>
                  </div>
                  <!-- Password Strength Bar -->
                  <div class="sf-pwd-meter" id="pwdMeterWrap">
                    <div class="sf-meter-track">
                      <div class="sf-meter-fill" id="meter1"></div>
                      <div class="sf-meter-fill" id="meter2"></div>
                      <div class="sf-meter-fill" id="meter3"></div>
                      <div class="sf-meter-fill" id="meter4"></div>
                    </div>
                    <div class="sf-meter-label">
                      <span id="pwdStrengthLabel">Strength: Required</span>
                      <span>Min 8 chars, 1 uppercase, 1 number</span>
                    </div>
                  </div>
                </div>

                <div class="sf-auth-group">
                  <label class="sf-auth-label" for="regConfirmPassword">Confirm Password *</label>
                  <div class="sf-auth-input-wrap">
                    <input type="password" id="regConfirmPassword" required class="sf-auth-input" placeholder="Re-enter password">
                    <button type="button" class="sf-pwd-toggle-btn" onclick="SFCustomerViews.togglePasswordVisibility('regConfirmPassword', this)">
                      👁️
                    </button>
                  </div>
                </div>

                <div class="sf-auth-group" style="margin-bottom: 22px;">
                  <label class="sf-auth-checkbox-label" style="font-size: 12px; line-height: 1.5;">
                    <input type="checkbox" id="regTerms" required>
                    <span>I agree to Shanmuka Fashions' <a href="#/story" class="sf-auth-link">Terms of Service</a> &amp; <a href="#/contact" class="sf-auth-link">Privacy Policy</a>.</span>
                  </label>
                </div>

                <button type="submit" id="regSubmitBtn" class="sf-auth-btn-primary">
                  <span>Create Atelier Account</span>
                </button>
              </form>

              <div class="sf-auth-footer-nav">
                Already have an account? 
                <a href="#/login?redirect=${encodeURIComponent(redirectTarget)}" class="sf-auth-link">Sign In &rarr;</a>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    onPasswordInput: function (val) {
      if (!val) {
        document.getElementById('meter1').className = 'sf-meter-fill';
        document.getElementById('meter2').className = 'sf-meter-fill';
        document.getElementById('meter3').className = 'sf-meter-fill';
        document.getElementById('meter4').className = 'sf-meter-fill';
        document.getElementById('pwdStrengthLabel').textContent = 'Strength: Required';
        return;
      }
      const evalResult = SFCustomerAuth.validation.evaluatePasswordStrength(val);
      const m1 = document.getElementById('meter1');
      const m2 = document.getElementById('meter2');
      const m3 = document.getElementById('meter3');
      const m4 = document.getElementById('meter4');
      const lbl = document.getElementById('pwdStrengthLabel');

      [m1, m2, m3, m4].forEach(m => m.className = 'sf-meter-fill');

      if (evalResult.score >= 1) m1.classList.add('active');
      if (evalResult.score >= 2) m2.classList.add('active');
      if (evalResult.score >= 3) {
        m3.classList.add('active', 'mod');
        m1.classList.add('mod');
        m2.classList.add('mod');
      }
      if (evalResult.score >= 4) {
        m4.classList.add('active', 'str');
        m1.classList.add('str');
        m2.classList.add('str');
        m3.classList.add('str');
      }

      lbl.textContent = 'Strength: ' + evalResult.label;
      lbl.style.color = evalResult.color;
    },

    handleRegisterSubmit: async function (e, encodedRedirect) {
      e.preventDefault();
      const fullName = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const phone = document.getElementById('regPhone').value.trim();
      const password = document.getElementById('regPassword').value;
      const confirmPassword = document.getElementById('regConfirmPassword').value;
      const terms = document.getElementById('regTerms').checked;
      const alertBox = document.getElementById('registerAlertBox');
      const submitBtn = document.getElementById('regSubmitBtn');

      alertBox.innerHTML = '';

      if (password !== confirmPassword) {
        alertBox.innerHTML = `
          <div class="sf-auth-error-alert">
            <span>⚠️</span>
            <span>Passwords do not match. Please re-enter identical passwords.</span>
          </div>
        `;
        return;
      }

      if (!terms) {
        alertBox.innerHTML = `
          <div class="sf-auth-error-alert">
            <span>⚠️</span>
            <span>Please accept the Terms of Service to create your account.</span>
          </div>
        `;
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Creating Account...</span>';

      const res = await SFCustomerAuth.register({ fullName, email, phone, password });
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Create Atelier Account</span>';

      if (res.success) {
        if (res.needsEmailVerification) {
          SFCustomerViews.renderVerificationNotice(email);
        } else {
          window.location.hash = decodeURIComponent(encodedRedirect || '#/account');
        }
      } else {
        alertBox.innerHTML = `
          <div class="sf-auth-error-alert">
            <span>⚠️</span>
            <span>${res.message}</span>
          </div>
        `;
      }
    },

    // ── 3. EMAIL VERIFICATION CONFIRMATION SCREEN ──
    renderVerificationNotice: function (email) {
      const container = document.getElementById('appRoot');
      if (!container) return;

      container.innerHTML = `
        <div style="max-width: 540px; margin: 60px auto 100px; padding: 20px;">
          <div class="sf-verify-card">
            <div class="sf-verify-icon-box">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>

            <h2 class="sf-verify-title">Verify Your Email Address</h2>
            <p class="sf-verify-desc">
              We have dispatched an activation link to <strong style="color: #3B2B25;">${email}</strong>.<br>
              Please inspect your inbox and click the link to activate your patron profile.
            </p>

            <div id="resendAlertBox"></div>

            <button type="button" id="resendVerificationBtn" class="sf-auth-btn-primary" style="margin-bottom: 14px;" onclick="SFCustomerViews.handleResendVerification('${email}')">
              <span>Resend Verification Email</span>
            </button>

            <div class="sf-cooldown-text" id="cooldownLabel"></div>

            <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #E8DFD8; font-size: 13px;">
              Already verified? <a href="#/login" class="sf-auth-link">Sign In to your account &rarr;</a>
            </div>
          </div>
        </div>
      `;
    },

    handleResendVerification: async function (email) {
      const btn = document.getElementById('resendVerificationBtn');
      const box = document.getElementById('resendAlertBox');
      const cooldownLbl = document.getElementById('cooldownLabel');

      if (cooldownSeconds > 0) return;

      btn.disabled = true;
      const res = await SFCustomerAuth.resendVerificationEmail(email);

      box.innerHTML = `
        <div class="sf-auth-success-alert">
          <span>✓</span>
          <span>${res.message}</span>
        </div>
      `;

      // 60-second cooldown
      cooldownSeconds = 60;
      clearInterval(resendInterval);
      resendInterval = setInterval(() => {
        cooldownSeconds -= 1;
        if (cooldownSeconds <= 0) {
          clearInterval(resendInterval);
          btn.disabled = false;
          cooldownLbl.textContent = '';
        } else {
          cooldownLbl.textContent = `You can request another link in ${cooldownSeconds}s`;
        }
      }, 1000);
    },

    // ── 4. FORGOT PASSWORD VIEW ──
    renderForgotPassword: function (containerId = 'appRoot') {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = `
        <div class="sf-auth-split-wrapper">
          <div class="sf-auth-visual-pane" style="background-image: url('assets/hero-model.jpg');">
            <div class="sf-auth-visual-overlay"></div>
            <div class="sf-auth-visual-content">
              <span class="sf-auth-visual-badge">Security &amp; Privacy</span>
            </div>
            <div class="sf-auth-visual-content">
              <blockquote class="sf-auth-visual-quote">
                &ldquo;Your security and patronage remain our utmost priority.&rdquo;
              </blockquote>
            </div>
          </div>

          <div class="sf-auth-form-pane">
            <div class="sf-auth-card">
              <div class="sf-auth-brand-header">
                <img src="logo.png" alt="Shanmuka Logo" class="sf-auth-logo">
                <h1 class="sf-auth-title">Reset Password</h1>
                <p class="sf-auth-subtitle">Enter your registered email address to receive password reset instructions.</p>
              </div>

              <div id="forgotAlertBox"></div>

              <form onsubmit="SFCustomerViews.handleForgotSubmit(event)">
                <div class="sf-auth-group">
                  <label class="sf-auth-label" for="forgotEmail">Email Address *</label>
                  <input type="email" id="forgotEmail" required class="sf-auth-input" placeholder="name@domain.com">
                </div>

                <button type="submit" id="forgotSubmitBtn" class="sf-auth-btn-primary" style="margin-top: 10px;">
                  <span>Send Recovery Link</span>
                </button>
              </form>

              <div class="sf-auth-footer-nav">
                Remember your password? <a href="#/login" class="sf-auth-link">Return to Sign In &rarr;</a>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    handleForgotSubmit: async function (e) {
      e.preventDefault();
      const email = document.getElementById('forgotEmail').value.trim();
      const alertBox = document.getElementById('forgotAlertBox');
      const btn = document.getElementById('forgotSubmitBtn');

      btn.disabled = true;
      btn.innerHTML = '<span>Dispatching Link...</span>';

      const res = await SFCustomerAuth.forgotPassword(email);
      btn.disabled = false;
      btn.innerHTML = '<span>Send Recovery Link</span>';

      alertBox.innerHTML = `
        <div class="sf-auth-success-alert">
          <span>✓</span>
          <span>${res.message}</span>
        </div>
      `;
    },

    // ── 5. RESET PASSWORD VIEW ──
    renderResetPassword: function (containerId = 'appRoot') {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = `
        <div style="max-width: 480px; margin: 60px auto 100px; padding: 20px;">
          <div class="sf-auth-card" style="background: white; border: 1px solid #D8C3A5; padding: 36px 28px; border-radius: 4px; box-shadow: 0 4px 16px rgba(59,43,37,0.06);">
            <div class="sf-auth-brand-header">
              <img src="logo.png" alt="Shanmuka Logo" class="sf-auth-logo">
              <h1 class="sf-auth-title" style="font-size: 24px;">New Password</h1>
              <p class="sf-auth-subtitle">Create a secure new password for your account.</p>
            </div>

            <div id="resetAlertBox"></div>

            <form onsubmit="SFCustomerViews.handleResetSubmit(event)">
              <div class="sf-auth-group">
                <label class="sf-auth-label">New Password *</label>
                <input type="password" id="newPwdInput" required class="sf-auth-input" placeholder="Min 8 chars, 1 uppercase, 1 number">
              </div>

              <div class="sf-auth-group">
                <label class="sf-auth-label">Confirm New Password *</label>
                <input type="password" id="confirmNewPwdInput" required class="sf-auth-input" placeholder="Re-enter new password">
              </div>

              <button type="submit" id="resetSubmitBtn" class="sf-auth-btn-primary" style="margin-top: 14px;">
                <span>Update Password</span>
              </button>
            </form>
          </div>
        </div>
      `;
    },

    handleResetSubmit: async function (e) {
      e.preventDefault();
      const p1 = document.getElementById('newPwdInput').value;
      const p2 = document.getElementById('confirmNewPwdInput').value;
      const alertBox = document.getElementById('resetAlertBox');
      const btn = document.getElementById('resetSubmitBtn');

      if (p1 !== p2) {
        alertBox.innerHTML = `
          <div class="sf-auth-error-alert">
            <span>⚠️</span>
            <span>Passwords do not match. Please re-enter.</span>
          </div>
        `;
        return;
      }

      btn.disabled = true;
      const res = await SFCustomerAuth.resetPassword(p1);
      btn.disabled = false;

      if (res.success) {
        alertBox.innerHTML = `
          <div class="sf-auth-success-alert">
            <span>✓</span>
            <span>${res.message}</span>
          </div>
        `;
        setTimeout(() => {
          window.location.hash = '#/login';
        }, 2000);
      } else {
        alertBox.innerHTML = `
          <div class="sf-auth-error-alert">
            <span>⚠️</span>
            <span>${res.message}</span>
          </div>
        `;
      }
    },

    // ── 6. CUSTOMER ACCOUNT PORTAL VIEW (#/account/*) ──
    renderAccountPortal: function (subtab = 'profile', containerId = 'appRoot') {
      const container = document.getElementById(containerId);
      if (!container) return;

      // Route Guard: Require Customer Authentication
      if (!SFCustomerAuth.isAuthenticated()) {
        window.location.hash = `#/login?redirect=${encodeURIComponent(window.location.hash || '#/account')}`;
        return;
      }

      const customer = SFCustomerAuth.getCurrentCustomer();
      const initials = (customer.full_name || 'P')
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      container.innerHTML = `
        <div class="sf-portal-wrapper">
          <!-- Top Patron Profile Meta Banner -->
          <div class="sf-portal-header-banner">
            <div class="sf-patron-profile-meta">
              <div class="sf-patron-avatar">${initials}</div>
              <div>
                <h1 class="sf-patron-name">Namaste, ${customer.full_name}</h1>
                <div class="sf-patron-email">${customer.email} &bull; ${customer.phone ? SFCustomerAuth.validation.formatIndianPhone(customer.phone) : 'Mobile not set'}</div>
                <span class="sf-patron-badge">Verified Atelier Patron</span>
              </div>
            </div>
            <div>
              <button onclick="SFCustomerViews.handleLogoutClick()" class="btn-outline-gold" style="padding: 9px 18px; font-size: 12.5px; color: #F5EBDD; border-color: #A77950;">
                Sign Out
              </button>
            </div>
          </div>

          <!-- Navigation Pills Bar -->
          <nav class="sf-portal-nav-bar">
            <button class="sf-portal-tab-btn ${subtab === 'profile' ? 'active' : ''}" onclick="SFCustomerViews.switchPortalTab('profile')">
              👤 Personal Information
            </button>
            <button class="sf-portal-tab-btn ${subtab === 'orders' ? 'active' : ''}" onclick="SFCustomerViews.switchPortalTab('orders')">
              🛍️ My Orders (${SFCustomerAuth.getCustomerOrders().length})
            </button>
            <button class="sf-portal-tab-btn ${subtab === 'addresses' ? 'active' : ''}" onclick="SFCustomerViews.switchPortalTab('addresses')">
              📍 Saved Addresses (${SFCustomerAuth.getAddresses().length})
            </button>
            <button class="sf-portal-tab-btn ${subtab === 'wishlist' ? 'active' : ''}" onclick="SFCustomerViews.switchPortalTab('wishlist')">
              ❤️ Saved Drapes (${(window.state && window.state.wishlist) ? Object.keys(window.state.wishlist).length : 0})
            </button>
            <button class="sf-portal-tab-btn ${subtab === 'security' ? 'active' : ''}" onclick="SFCustomerViews.switchPortalTab('security')">
              🔒 Account Security
            </button>
          </nav>

          <!-- Tab Content Display -->
          <div id="portalTabContent">
            ${SFCustomerViews.renderPortalTabContentHTML(subtab, customer)}
          </div>
        </div>
      `;
    },

    switchPortalTab: function (tab) {
      window.location.hash = '#/account/' + tab;
    },

    renderPortalTabContentHTML: function (subtab, customer) {
      if (subtab === 'orders') {
        return SFCustomerViews.renderOrdersTabHTML();
      } else if (subtab === 'addresses') {
        return SFCustomerViews.renderAddressesTabHTML();
      } else if (subtab === 'wishlist') {
        return SFCustomerViews.renderWishlistTabHTML();
      } else if (subtab === 'security') {
        return SFCustomerViews.renderSecurityTabHTML();
      } else {
        return SFCustomerViews.renderProfileTabHTML(customer);
      }
    },

    // Subtab: Profile
    renderProfileTabHTML: function (customer) {
      return `
        <div class="sf-portal-card">
          <h2 class="sf-portal-card-title">Personal Information</h2>
          <p class="sf-portal-card-subtitle">Manage your personal credentials, contact numbers, and delivery preferences.</p>

          <div id="profileAlertBox"></div>

          <form onsubmit="SFCustomerViews.handleProfileSave(event)" style="max-width: 540px;">
            <div class="sf-auth-group">
              <label class="sf-auth-label">Full Name *</label>
              <input type="text" id="profName" class="sf-auth-input" value="${customer.full_name || ''}" required>
            </div>

            <div class="sf-auth-group">
              <label class="sf-auth-label">Registered Email Address</label>
              <input type="email" class="sf-auth-input" value="${customer.email || ''}" disabled style="background: #F5EBDD; cursor: not-allowed; color: #76675D;">
              <span style="font-size: 11.5px; color: #76675D; display: block; margin-top: 4px;">Email address is linked to your Supabase Auth account.</span>
            </div>

            <div class="sf-auth-group">
              <label class="sf-auth-label">Mobile Number *</label>
              <div class="sf-auth-input-wrap">
                <span class="sf-auth-prefix">+91</span>
                <input type="tel" id="profPhone" class="sf-auth-input has-prefix" value="${(customer.phone || '').replace(/[^0-9]/g, '').slice(-10)}" required maxlength="10">
              </div>
            </div>

            <button type="submit" class="sf-auth-btn-primary" style="width: auto; padding: 12px 28px; margin-top: 14px;">
              <span>Save Profile Updates</span>
            </button>
          </form>
        </div>
      `;
    },

    handleProfileSave: async function (e) {
      e.preventDefault();
      const fullName = document.getElementById('profName').value.trim();
      const phone = document.getElementById('profPhone').value.trim();
      const box = document.getElementById('profileAlertBox');

      const res = await SFCustomerAuth.updateProfile({ fullName, phone });
      if (res.success) {
        box.innerHTML = `
          <div class="sf-auth-success-alert">
            <span>✓</span>
            <span>Profile details updated successfully.</span>
          </div>
        `;
        if (typeof updateHeaderAuthUI === 'function') updateHeaderAuthUI();
      } else {
        box.innerHTML = `
          <div class="sf-auth-error-alert">
            <span>⚠️</span>
            <span>${res.message}</span>
          </div>
        `;
      }
    },

    // Subtab: Orders
    renderOrdersTabHTML: function () {
      const orders = SFCustomerAuth.getCustomerOrders();

      if (!orders || orders.length === 0) {
        return `
          <div class="sf-portal-card" style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 44px; margin-bottom: 12px;">🛍️</div>
            <h3 style="font-family: 'Playfair Display', serif; font-size: 20px; color: #3B2B25; margin-bottom: 8px;">No Orders Placed Yet</h3>
            <p style="color: #76675D; font-size: 13.5px; margin-bottom: 24px; max-width: 400px; margin-left: auto; margin-right: auto;">
              Explore our masterloom Kanchipuram and Banarasi collections to find your heirloom drape.
            </p>
            <a href="#/catalogue" class="sf-auth-btn-primary" style="display: inline-flex; width: auto; padding: 12px 28px;">
              Explore Collections &rarr;
            </a>
          </div>
        `;
      }

      return `
        <div class="sf-portal-card">
          <h2 class="sf-portal-card-title">Order History (${orders.length})</h2>
          <p class="sf-portal-card-subtitle">Review real-time dispatch progress, carrier tracking, and tax invoices.</p>

          <div style="display: flex; flex-direction: column; gap: 18px;">
            ${orders.map(o => {
              const statusClass = (o.order_status || o.status || 'Pending').toLowerCase();
              return `
                <div class="sf-order-item-card">
                  <div class="sf-order-header">
                    <div>
                      <strong style="color: #3B2B25; font-size: 14px;">Order #${o.order_number || o.id}</strong>
                      <span style="color: #76675D; margin-left: 10px;">${o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : (o.date || '—')}</span>
                    </div>
                    <div>
                      <span class="sf-status-badge ${statusClass}">${o.order_status || o.status || 'Pending'}</span>
                    </div>
                  </div>

                  <div class="sf-order-body">
                    <div style="margin-bottom: 16px;">
                      ${(o.items || []).map(it => `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 13.5px;">
                          <div>
                            <span style="font-weight: 600; color: #3B2B25;">${it.name || it.product_name || 'Pure Silk Saree'}</span>
                            <span style="color: #76675D; font-size: 12px; margin-left: 6px;">Qty: ${it.qty || 1}</span>
                          </div>
                          <div style="font-weight: 600; color: #672D46;">
                            ₹${((it.price || it.unit_price || 0) * (it.qty || 1)).toLocaleString('en-IN')}
                          </div>
                        </div>
                      `).join('')}
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px dashed #D8C3A5; flex-wrap: wrap; gap: 10px;">
                      <div style="font-size: 12.5px; color: #76675D;">
                        Payment: <b>${(o.payment_method || o.payment || 'UPI').toUpperCase()}</b> &bull; Status: <b>${o.payment_status || 'Completed'}</b>
                        ${o.tracking_number ? `<br>Tracking AWB: <strong style="color: #3B2B25;">${o.tracking_number}</strong> (${o.courier || 'Express'})` : ''}
                      </div>
                      <div style="text-align: right;">
                        <span style="font-size: 12px; color: #76675D;">Total Amount:</span>
                        <div style="font-size: 18px; font-weight: 700; color: #3B2B25;">₹${(o.total || 0).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    },

    // Subtab: Addresses
    renderAddressesTabHTML: function () {
      const addresses = SFCustomerAuth.getAddresses();

      return `
        <div class="sf-portal-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 class="sf-portal-card-title">Delivery Addresses</h2>
              <p class="sf-portal-card-subtitle" style="margin-bottom: 0;">Saved shipping destinations for expedited express checkout.</p>
            </div>
            <button onclick="SFCustomerViews.openAddressModal()" class="btn-primary" style="padding: 10px 18px; font-size: 12.5px;">
              + Add New Address
            </button>
          </div>

          ${addresses.length === 0 ? `
            <div style="text-align: center; padding: 40px; background: #FDFBF7; border: 1px dashed #D8C3A5; border-radius: 4px;">
              <p style="color: #76675D; font-size: 13.5px; margin-bottom: 12px;">No delivery addresses saved yet.</p>
              <button onclick="SFCustomerViews.openAddressModal()" class="sf-auth-link">+ Add your first address</button>
            </div>
          ` : `
            <div class="sf-addresses-grid">
              ${addresses.map(a => `
                <div class="sf-address-card ${a.is_default ? 'is-default' : ''}">
                  <div>
                    ${a.is_default ? `<span class="sf-default-pill">Default</span>` : ''}
                    <h4 style="font-family: 'Playfair Display', serif; font-size: 16px; color: #3B2B25; margin-bottom: 4px;">
                      ${a.full_name} <span style="font-size: 12px; font-weight: normal; color: #76675D;">(${a.address_type || 'Home'})</span>
                    </h4>
                    <p style="font-size: 13px; color: #76675D; line-height: 1.6; margin-bottom: 10px;">
                      ${a.street}<br>
                      ${a.landmark ? a.landmark + '<br>' : ''}
                      ${a.city}, ${a.state} — <b>${a.pincode}</b><br>
                      Phone: ${a.phone}
                    </p>
                  </div>
                  <div style="display: flex; gap: 10px; margin-top: 14px; padding-top: 10px; border-top: 1px solid #E8DFD8;">
                    ${!a.is_default ? `<button onclick="SFCustomerViews.handleSetDefaultAddress('${a.id}')" style="background: none; border: none; font-size: 12px; color: #A77950; font-weight: 600; cursor: pointer; padding: 0;">Set as Default</button> &bull;` : ''}
                    <button onclick="SFCustomerViews.handleDeleteAddress('${a.id}')" style="background: none; border: none; font-size: 12px; color: #C25E5E; cursor: pointer; padding: 0;">Delete</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Address Modal -->
        <div class="modal-overlay" id="sfAddressModal">
          <div class="modal-box" style="max-width: 520px; text-align: left;">
            <button class="modal-close" onclick="SFCustomerViews.closeAddressModal()">✕</button>
            <h3 style="font-family: 'Playfair Display', serif; font-size: 20px; color: #3B2B25; margin-bottom: 4px;">Add Delivery Address</h3>
            <p style="font-size: 12.5px; color: #76675D; margin-bottom: 20px;">Saved to your customer profile for one-click checkout.</p>

            <form onsubmit="SFCustomerViews.handleAddressFormSubmit(event)">
              <div class="sf-auth-group">
                <label class="sf-auth-label">Recipient Full Name *</label>
                <input type="text" id="addrName" required class="sf-auth-input" placeholder="e.g. Sravani Rao">
              </div>

              <div class="sf-auth-group">
                <label class="sf-auth-label">Mobile Number *</label>
                <input type="tel" id="addrPhone" required class="sf-auth-input" placeholder="10-digit mobile number" maxlength="10">
              </div>

              <div class="sf-auth-group">
                <label class="sf-auth-label">House / Flat / Street Address *</label>
                <input type="text" id="addrStreet" required class="sf-auth-input" placeholder="Flat 402, Royal Palms, Road 36">
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="sf-auth-group">
                  <label class="sf-auth-label">City *</label>
                  <input type="text" id="addrCity" required class="sf-auth-input" placeholder="Hyderabad">
                </div>
                <div class="sf-auth-group">
                  <label class="sf-auth-label">State *</label>
                  <input type="text" id="addrState" required class="sf-auth-input" placeholder="Telangana">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="sf-auth-group">
                  <label class="sf-auth-label">Pincode *</label>
                  <input type="text" id="addrPin" required class="sf-auth-input" placeholder="500033" maxlength="6">
                </div>
                <div class="sf-auth-group">
                  <label class="sf-auth-label">Address Type</label>
                  <select id="addrType" class="sf-auth-input">
                    <option value="Home">Home</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px;">
                <button type="button" onclick="SFCustomerViews.closeAddressModal()" class="btn-outline-gold" style="padding: 10px 18px; font-size: 13px;">Cancel</button>
                <button type="submit" class="btn-primary" style="padding: 10px 22px; font-size: 13px;">Save Address</button>
              </div>
            </form>
          </div>
        </div>
      `;
    },

    openAddressModal: function () {
      const modal = document.getElementById('sfAddressModal');
      if (modal) modal.classList.add('active');
    },

    closeAddressModal: function () {
      const modal = document.getElementById('sfAddressModal');
      if (modal) modal.classList.remove('active');
    },

    handleAddressFormSubmit: function (e) {
      e.preventDefault();
      const full_name = document.getElementById('addrName').value.trim();
      const phone = document.getElementById('addrPhone').value.trim();
      const street = document.getElementById('addrStreet').value.trim();
      const city = document.getElementById('addrCity').value.trim();
      const state = document.getElementById('addrState').value.trim();
      const pincode = document.getElementById('addrPin').value.trim();
      const address_type = document.getElementById('addrType').value;

      const res = SFCustomerAuth.saveAddress({
        full_name,
        phone,
        street,
        city,
        state,
        pincode,
        address_type
      });

      if (res.success) {
        SFCustomerViews.closeAddressModal();
        SFCustomerViews.renderAccountPortal('addresses');
      } else {
        alert(res.message);
      }
    },

    handleSetDefaultAddress: function (id) {
      SFCustomerAuth.setDefaultAddress(id);
      SFCustomerViews.renderAccountPortal('addresses');
    },

    handleDeleteAddress: function (id) {
      if (confirm('Delete this delivery address?')) {
        SFCustomerAuth.deleteAddress(id);
        SFCustomerViews.renderAccountPortal('addresses');
      }
    },

    // Subtab: Wishlist
    renderWishlistTabHTML: function () {
      let savedItems = [];
      if (window.state && window.state.wishlist && window.products) {
        const ids = Object.keys(window.state.wishlist).map(x => parseInt(x, 10));
        savedItems = window.products.filter(p => ids.includes(p.id));
      }

      if (!savedItems.length) {
        return `
          <div class="sf-portal-card" style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 44px; margin-bottom: 12px;">❤️</div>
            <h3 style="font-family: 'Playfair Display', serif; font-size: 20px; color: #3B2B25; margin-bottom: 8px;">Your Wishlist is Empty</h3>
            <p style="color: #76675D; font-size: 13.5px; margin-bottom: 24px;">
              Save your favourite silk and handloom sarees to view them later.
            </p>
            <a href="#/catalogue" class="sf-auth-btn-primary" style="display: inline-flex; width: auto; padding: 12px 28px;">
              Explore Catalogue &rarr;
            </a>
          </div>
        `;
      }

      return `
        <div class="sf-portal-card">
          <h2 class="sf-portal-card-title">Saved Drapes (${savedItems.length})</h2>
          <p class="sf-portal-card-subtitle">Your personal edit of curated handloom drapes.</p>

          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px;">
            ${savedItems.map(p => `
              <div style="border: 1px solid #D8C3A5; border-radius: 4px; overflow: hidden; background: #FFFFFF; display: flex; flex-direction: column;">
                <div style="height: 320px; overflow: hidden;">
                  <img src="${p.img}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div style="padding: 16px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #A77950;">${p.category}</span>
                    <h4 style="font-family: 'Playfair Display', serif; font-size: 15px; color: #3B2B25; margin: 4px 0 8px;">${p.name}</h4>
                    <div style="font-weight: 700; color: #672D46; font-size: 15px;">₹${(p.price || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <div style="display: flex; gap: 8px; margin-top: 14px;">
                    <button onclick="addToCart(${p.id}); removeFromWishlist(${p.id}); SFCustomerViews.renderAccountPortal('wishlist');" class="btn-primary" style="flex: 1; justify-content: center; font-size: 12px; padding: 8px 12px;">Move to Bag</button>
                    <button onclick="removeFromWishlist(${p.id}); SFCustomerViews.renderAccountPortal('wishlist');" class="btn-outline-gold" style="padding: 8px 12px; font-size: 12px;">✕</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    },

    // Subtab: Security
    renderSecurityTabHTML: function () {
      return `
        <div class="sf-portal-card">
          <h2 class="sf-portal-card-title">Account Security</h2>
          <p class="sf-portal-card-subtitle">Update your password and maintain authenticated sessions.</p>

          <div id="securityAlertBox"></div>

          <form onsubmit="SFCustomerViews.handlePasswordUpdate(event)" style="max-width: 440px;">
            <div class="sf-auth-group">
              <label class="sf-auth-label">New Password *</label>
              <input type="password" id="secNewPwd" required class="sf-auth-input" placeholder="Minimum 8 characters">
            </div>

            <div class="sf-auth-group">
              <label class="sf-auth-label">Confirm New Password *</label>
              <input type="password" id="secConfirmPwd" required class="sf-auth-input" placeholder="Re-enter password">
            </div>

            <button type="submit" class="sf-auth-btn-primary" style="width: auto; padding: 12px 28px; margin-top: 10px;">
              <span>Update Password</span>
            </button>
          </form>

          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #D8C3A5;">
            <h3 style="font-family: 'Playfair Display', serif; font-size: 17px; color: #3B2B25; margin-bottom: 8px;">Active Session</h3>
            <p style="font-size: 13px; color: #76675D; margin-bottom: 14px;">You are securely authenticated via Supabase Auth on this device.</p>
            <button onclick="SFCustomerViews.handleLogoutClick()" class="btn-outline-gold" style="padding: 9px 20px; font-size: 12.5px; color: #C25E5E; border-color: #C25E5E;">
              Sign Out from Device
            </button>
          </div>
        </div>
      `;
    },

    handlePasswordUpdate: async function (e) {
      e.preventDefault();
      const p1 = document.getElementById('secNewPwd').value;
      const p2 = document.getElementById('secConfirmPwd').value;
      const box = document.getElementById('securityAlertBox');

      if (p1 !== p2) {
        box.innerHTML = `
          <div class="sf-auth-error-alert">
            <span>⚠️</span>
            <span>New passwords do not match.</span>
          </div>
        `;
        return;
      }

      const res = await SFCustomerAuth.resetPassword(p1);
      if (res.success) {
        box.innerHTML = `
          <div class="sf-auth-success-alert">
            <span>✓</span>
            <span>Password updated successfully.</span>
          </div>
        `;
        document.getElementById('secNewPwd').value = '';
        document.getElementById('secConfirmPwd').value = '';
      } else {
        box.innerHTML = `
          <div class="sf-auth-error-alert">
            <span>⚠️</span>
            <span>${res.message}</span>
          </div>
        `;
      }
    },

    handleLogoutClick: async function () {
      await SFCustomerAuth.logout();
      window.location.hash = '#/';
      if (typeof updateHeaderAuthUI === 'function') updateHeaderAuthUI();
    },

    togglePasswordVisibility: function (inputId, btn) {
      const input = document.getElementById(inputId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    }
  };

  return SFCustomerViews;
}));
