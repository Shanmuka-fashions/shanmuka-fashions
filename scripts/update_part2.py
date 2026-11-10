#!/usr/bin/env python3
"""
Update renderHomeView, renderProductCardsHTML, PDP, Contact, and purge emojis in index.html.
"""
import re

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# 1. New renderHomeView implementation
new_render_home = '''// ── VIEW 1: Luxury Homepage (Anti-Slop Editorial Design) ──
function renderHomeView() {
  const app = $('appRoot');
  
  // First 4 sarees for New Arrivals
  const featuredNew = products.slice(0, 4);

  app.innerHTML = `
    <!-- 1. Authentic Luxury Campaign Hero Banner -->
    <section class="hero-campaign-section">
      <div class="hero-campaign-container">
        <div class="hero-text-block">
          <div class="hero-eyebrow-badge">Autumn / Festive 2026 &bull; The Royal Atelier</div>
          <h1 class="hero-main-heading">Heritage Weaves for the Modern Woman</h1>
          <div class="hero-tagline-text">Sarees & More</div>
          <p class="hero-narrative">Discover the splendor of pure handloom silks, authentic Kanchipuram temple weaves, and heritage Banarasi brocades handcrafted across centuries of artisan heritage.</p>
          <div class="hero-button-group">
            <a href="#/catalogue" class="btn-hero-primary">Explore Collections &rarr;</a>
            <a href="#/catalogue?occasion=Bridal" class="btn-hero-secondary">Bridal Trousseau</a>
          </div>
          <div class="hero-trust-micro">Silk Mark Certified &bull; Direct Artisan Weavers &bull; Worldwide Insured Delivery</div>
        </div>
      </div>
      <div class="hero-model-tag">Kanchipuram Silk &bull; Certified Gold Zari &bull; Royal Atelier</div>
    </section>

    <!-- 2. Typographic Atelier Commitments Strip -->
    <section class="commitments-bar">
      <div class="commitments-grid">
        <div class="commitment-item">
          <span class="commitment-num">01</span>
          <h4 class="commitment-title">Silk Mark Certified</h4>
          <p class="commitment-desc">100% pure natural silk assurance verified by genuine Silk Mark standards.</p>
        </div>
        <div class="commitment-item">
          <span class="commitment-num">02</span>
          <h4 class="commitment-title">Direct Artisan Weavers</h4>
          <p class="commitment-desc">Heritage loom provenance sourced ethically from master weaver clusters.</p>
        </div>
        <div class="commitment-item">
          <span class="commitment-num">03</span>
          <h4 class="commitment-title">Insured Worldwide Express</h4>
          <p class="commitment-desc">Doorstep express courier dispatch; complimentary on orders above ₹15,000.</p>
        </div>
        <div class="commitment-item">
          <span class="commitment-num">04</span>
          <h4 class="commitment-title">Live Video Styling Concierge</h4>
          <p class="commitment-desc">Private WhatsApp video drapery consultation with our senior stylists.</p>
        </div>
      </div>
    </section>

    <!-- 3. Curated Collections (Asymmetric Editorial Layout) -->
    <section class="curated-collections-section">
      <div class="editorial-header">
        <span class="eyebrow">Curated Weaves</span>
        <h2>Shop By Collection</h2>
        <p>Explore centuries of Indian handloom heritage through our masterfully curated saree drapes.</p>
      </div>

      <!-- Tier 1: Marquee Feature Duo -->
      <div class="editorial-collections-tier1">
        <div class="editorial-card-featured" onclick="window.location.hash='#/collection/kanchipuram'">
          <img src="assets/kanchipuram.jpg" alt="Kanchipuram Silks" loading="lazy">
          <div class="editorial-card-overlay">
            <span class="cat-label">01 / Marquee Silk</span>
            <h3>Kanchipuram Silks</h3>
            <p>The Queen of Silks. Handwoven mulberry silk with sacred korvai temple borders and tested gold zari.</p>
            <span class="card-link">Explore Collection &rarr;</span>
          </div>
        </div>
        <div class="editorial-card-featured" onclick="window.location.hash='#/collection/banarasi'">
          <img src="assets/banarasi.jpg" alt="Banarasi Heritage" loading="lazy">
          <div class="editorial-card-overlay">
            <span class="cat-label">02 / Heritage Brocade</span>
            <h3>Banarasi Heritage</h3>
            <p>Varanasi Kadwa Weaves. Pure katan silks adorned with opulent gold and silver meenakari jaal.</p>
            <span class="card-link">Explore Collection &rarr;</span>
          </div>
        </div>
      </div>

      <!-- Tier 2: 4-Card Quad -->
      <div class="editorial-collections-tier2">
        <div class="editorial-card-quad" onclick="window.location.hash='#/collection/organza'">
          <img src="assets/organza.jpg" alt="Floral Organza" loading="lazy">
          <div class="editorial-card-overlay">
            <span class="cat-label">03 / Sheer Grace</span>
            <h3>Floral Organza</h3>
            <span class="card-link">View Sarees &rarr;</span>
          </div>
        </div>
        <div class="editorial-card-quad" onclick="window.location.hash='#/collection/silk'">
          <img src="assets/silk.jpg" alt="Festive Pure Silk" loading="lazy">
          <div class="editorial-card-overlay">
            <span class="cat-label">04 / Celebration Drapes</span>
            <h3>Festive Pure Silk</h3>
            <span class="card-link">View Sarees &rarr;</span>
          </div>
        </div>
        <div class="editorial-card-quad" onclick="window.location.hash='#/collection/cotton'">
          <img src="assets/cotton.jpg" alt="Handloom Cotton" loading="lazy">
          <div class="editorial-card-overlay">
            <span class="cat-label">05 / Artisan Combed</span>
            <h3>Handloom Cotton</h3>
            <span class="card-link">View Sarees &rarr;</span>
          </div>
        </div>
        <div class="editorial-card-quad" onclick="window.location.hash='#/collection/designer'">
          <img src="assets/hero-model.jpg" alt="Designer Sarees" loading="lazy">
          <div class="editorial-card-overlay">
            <span class="cat-label">06 / Haute Couture</span>
            <h3>Designer Sarees</h3>
            <span class="card-link">View Sarees &rarr;</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. The Royal Bridal & Trousseau Collection Campaign -->
    <section class="wedding-banner-section">
      <div class="wedding-banner-container">
        <div class="wedding-text-block">
          <span class="wedding-eyebrow">The Royal Bridal Atelier</span>
          <h2 class="wedding-heading">The Royal Bridal & Trousseau Collection</h2>
          <div class="wedding-subheading">Heirloom Silks for Once-in-a-Lifetime Celebrations</div>
          <p class="wedding-description">From the sacred muhurtham to the grand wedding reception, every Shanmuka bridal drape is handwoven with certified zari and pure mulberry silk, customized in heritage colour dyes to grace your wedding day.</p>
          
          <div class="wedding-occasions-row">
            <a href="#/catalogue?occasion=Bridal" class="wedding-occasion-tag">Muhurtham Silks &rarr;</a>
            <a href="#/catalogue?occasion=Party" class="wedding-occasion-tag">Sangeet & Cocktail &rarr;</a>
            <a href="#/catalogue?occasion=Reception" class="wedding-occasion-tag">Reception Glamour &rarr;</a>
            <a href="#/catalogue?occasion=Festive" class="wedding-occasion-tag">Festive Pooja &rarr;</a>
          </div>

          <div class="wedding-actions">
            <a href="#/catalogue?occasion=Bridal" class="btn-wedding-primary">Explore Bridal Trousseau &rarr;</a>
            <a href="https://wa.me/919876543210?text=Hello%20Shanmuka%20Fashions!%20I%20would%20like%20to%20consult%20with%20your%20bridal%20stylist." target="_blank" rel="noopener noreferrer" class="btn-wedding-secondary">Consult Bridal Stylist</a>
          </div>
        </div>
        <div class="wedding-media-block">
          <img src="Shanmuka Fashions Saree Emblem.png" alt="Shanmuka Fashions Royal Bridal Emblem" class="wedding-media-img" style="object-fit: contain; background: rgba(255,255,255,0.03); padding: 16px;">
        </div>
      </div>
    </section>

    <!-- 5. New Arrivals / Masterpiece Weaves -->
    <section class="section-wrapper">
      <div class="editorial-header">
        <span class="eyebrow">Autumn / Festive 2026</span>
        <h2>New Arrivals & Masterpiece Weaves</h2>
        <p>Fresh off the looms: handpicked pure silk sarees, intricate brocades, and contemporary drapes.</p>
      </div>
      <div class="product-grid" id="homeNewArrivalsGrid">
        ${renderProductCardsHTML(featuredNew)}
      </div>
      <div style="text-align: center; margin-top: 40px;">
        <a href="#/catalogue" class="btn-primary">View Full Catalogue &rarr;</a>
      </div>
    </section>

    <!-- 6. Brand Story / Heritage Section -->
    <section class="story-section">
      <div class="story-container">
        <div class="story-image-frame">
          <img src="assets/kanchipuram.jpg" alt="Artisan Weaving Tradition" loading="lazy">
        </div>
        <div class="story-content">
          <span class="eyebrow" style="color: var(--antique-gold); letter-spacing: 3px; font-size: 11px; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 8px;">Heritage & Craftsmanship</span>
          <h2>Elegance Woven Into Every Thread</h2>
          <p>Founded on a profound reverence for Indian textile heritage, Shanmuka Fashions collaborates directly with multi-generational master weaver families across Kanchipuram, Varanasi, Dharmavaram, and Chanderi.</p>
          <p>Every saree in our atelier undergoes meticulous authentication: verified Silk Mark purity, tested gold and silver zari, and ethical artisan compensation that preserves our nation's living handloom treasures.</p>
          <div style="margin-top: 24px;">
            <a href="#/story" class="btn-primary">Discover Our Weaver Story &rarr;</a>
          </div>
        </div>
      </div>
    </section>
  `;

  attachProductCardEvents();
}'''

# Replace renderHomeView
home_pattern = re.compile(r'// ── VIEW 1: Luxury Homepage[\s\S]*?function renderHomeView\(\)\s*\{[\s\S]*?attachProductCardEvents\(\);\s*\}', re.MULTILINE)
if home_pattern.search(content):
    content = home_pattern.sub(new_render_home, content)
    print("renderHomeView successfully replaced.")
else:
    # Alternative match
    home_pattern2 = re.compile(r'function renderHomeView\(\)\s*\{[\s\S]*?attachProductCardEvents\(\);\s*\}', re.MULTILINE)
    if home_pattern2.search(content):
        content = home_pattern2.sub(new_render_home, content)
        print("renderHomeView replaced via pattern 2.")
    else:
        print("Error: Could not find renderHomeView in content!")

# 2. New renderProductCardsHTML
new_product_cards = '''function renderProductCardsHTML(list) {
  return list.map(p => {
    const inWishlist = state.wishlist.includes(p.id);
    return `
      <article class="product-card" data-id="${p.id}">
        <div class="card-media">
          <img src="${p.img}" alt="${p.name}" loading="lazy">
          <span class="card-badge">${p.badge}</span>
          <button class="card-wishlist-btn ${inWishlist ? 'active' : ''}" data-wishlist-id="${p.id}" aria-label="Save to Wishlist">
            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </button>
          <div class="card-quick-actions">
            <button class="quick-view-btn" data-qv-id="${p.id}">Quick View</button>
            <button class="quick-add-btn" data-add-id="${p.id}">Add to Bag</button>
          </div>
        </div>
        <div class="card-details">
          <span class="card-category">${p.category} &bull; ${p.fabric}</span>
          <h3 class="card-title" onclick="window.location.hash='#/product/${p.id}'">${p.name}</h3>
          <div class="card-price-row">
            <span class="current-price">${money(p.price)}</span>
            <del class="original-price">${money(p.old)}</del>
          </div>
          <button class="card-cta-btn" onclick="window.location.hash='#/product/${p.id}'">View Saree &rarr;</button>
        </div>
      </article>
    `;
  }).join('');
}'''

prod_pattern = re.compile(r'function renderProductCardsHTML\(list\)\s*\{[\s\S]*?return list\.map[\s\S]*?\}\.join\(\'\'\);\s*\}', re.MULTILINE)
if prod_pattern.search(content):
    content = prod_pattern.sub(new_product_cards, content)
    print("renderProductCardsHTML successfully replaced.")
else:
    print("Error: Could not find renderProductCardsHTML in content!")

# 3. Clean toggleWishlist: remove .textContent = '♥' or '♡'
content = content.replace("btn.textContent = state.wishlist.includes(id) ? '♥' : '♡';", "// icon styled via svg")
content = content.replace("toast(`Saved \"${p ? p.name : 'Saree'}\" to your Wishlist ♥`);", "toast(`Saved \"${p ? p.name : 'Saree'}\" to your Wishlist`);")

# 4. Clean up PDP emojis & fake discounts
content = content.replace("<span class=\"discount-chip\">${discount}% OFF</span>", "")
content = content.replace("✧ Inclusive of all taxes • Free express shipping across India", "Inclusive of all taxes &bull; Free express delivery across India")
content = content.replace("✓ In Stock — Ready to Dispatch in 24h", "In Stock — Ready to Dispatch in 24h")
content = content.replace("✓ Express Delivery Available! Estimated delivery in 2-3 business days.", "Express Delivery Available. Estimated delivery in 2-3 business days.")
content = content.replace("res.textContent = `✓ Delivery confirmed for PIN ${val}! Express Dispatch in 24 hours.`;", "res.textContent = `Delivery confirmed for PIN ${val}. Express dispatch in 24 hours.`;")
content = content.replace("<span>${inWishlist ? '♥ Saved in Wishlist' : '♡ Add to Wishlist'}</span>", "<span>${inWishlist ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>")

# 5. Clean up Contact View emojis
content = content.replace("📍 <b>Shanmuka Fashions Boutique</b>", "<b>Shanmuka Fashions Flagship Salon</b>")
content = content.replace("📞 Direct Call:", "Direct Call:")
content = content.replace("💬 WhatsApp Concierge:", "WhatsApp Concierge:")
content = content.replace("✉️ Email:", "Email:")
content = content.replace("🕒 Boutique Timings:", "Salon Timings:")

# 6. Clean up JS Toast/Alert Emojis
content = content.replace("to your shopping bag 🛍", "to your shopping bag")
content = content.replace("🎉 You have unlocked Free Express Shipping", "You have unlocked Free Express Shipping")
content = content.replace("Hello ${STORE.name}! 🌸\\n", "Hello ${STORE.name}!\\n")
content = content.replace("Thank you, ${name}! 🌸\\n\\n", "Thank you, ${name}!\\n\\n")
content = content.replace("Welcome to the Shanmuka Fashions VIP Salon! 🌸", "Welcome to the Shanmuka Fashions VIP Salon")
content = content.replace("in catalogue ✓", "in catalogue")

with open("index.html", "w", encoding="utf-8") as f:
    f.write(content)

print("Part 2 complete: JS functions and DOM text cleaned successfully.")

