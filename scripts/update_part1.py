#!/usr/bin/env python3
"""
Overhaul index.html to 100% conform to the SHANMUKA FASHIONS ANTI-SLOP LUXURY GUIDELINES.
"""
import re

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Purge all Cinzel font occurrences and replace with Playfair Display / var(--font-serif)
content = re.sub(r"font-family:\s*'Cinzel',[^;]+;", "font-family: var(--font-serif);", content)
content = re.sub(r"font-family:\s*'Cinzel'[^;]*;", "font-family: var(--font-serif);", content)

# 2. Announcement bar in static HTML
old_announcement = """<!-- ── Announcement Bar ── -->
<div class="announcement-bar">
  <span class="announcement-text">✦ COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹15,000 | <b>SHANMUKA FASHIONS</b> | WHATSAPP CONCIERGE ✦</span>
</div>"""

new_announcement = """<!-- ── Minimal Luxury Announcement Bar ── -->
<div class="announcement-bar">
  <span class="announcement-text">COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹15,000 &bull; <b>SHANMUKA FASHIONS</b> &bull; WHATSAPP CONCIERGE</span>
</div>"""

if old_announcement in content:
    content = content.replace(old_announcement, new_announcement)
else:
    print("Warning: old announcement exact match not found; performing regex replace")
    content = re.sub(
        r'<div class="announcement-bar">[\s\S]*?</div>',
        '<div class="announcement-bar">\n  <span class="announcement-text">COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹15,000 &bull; <b>SHANMUKA FASHIONS</b> &bull; WHATSAPP CONCIERGE</span>\n</div>',
        content,
        count=1
    )

# 3. Update Search Bar CSS (remove 20px pill)
content = re.sub(
    r'\.search-input-field\s*\{[^}]*\}',
    """.search-input-field {
  width: 190px;
  height: 38px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(181, 138, 69, 0.35);
  border-radius: 2px;
  padding: 0 14px 0 34px;
  color: var(--warm-ivory);
  font-size: 12.5px;
  outline: none;
  transition: all 0.3s ease;
}
.search-input-field:focus {
  width: 240px;
  background: rgba(255, 255, 255, 0.12);
  border-color: var(--antique-gold);
}
.search-input-field::placeholder { color: rgba(232, 213, 181, 0.7); }""",
    content
)

# 4. Update Header CSS (remove blur, solid deep navy)
content = re.sub(
    r'\.site-header\s*\{[^}]*\}',
    """.site-header {
  background: var(--deep-navy);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(181, 138, 69, 0.25);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  transition: var(--transition);
}""",
    content
)

# 5. Update .btn-primary and .btn-wedding-primary (remove yellow gradient)
content = re.sub(
    r'\.btn-primary\s*\{[^}]*\}',
    """.btn-primary {
  background: var(--antique-gold);
  color: var(--deep-navy);
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 14px 30px;
  border-radius: 2px;
  border: 1px solid var(--antique-gold);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: var(--transition);
}
.btn-primary:hover {
  background: #C79D56;
  border-color: #C79D56;
  transform: translateY(-2px);
}""",
    content
)

content = re.sub(
    r'\.btn-wedding-primary\s*\{[^}]*\}',
    """.btn-wedding-primary {
  background: var(--antique-gold);
  color: var(--deep-navy);
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 14px 28px;
  border-radius: 2px;
  border: 1px solid var(--antique-gold);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: var(--transition);
}
.btn-wedding-primary:hover {
  background: #C79D56;
  border-color: #C79D56;
  transform: translateY(-2px);
}""",
    content
)

# 6. Update Floating WhatsApp Concierge CSS
content = re.sub(
    r'\.floating-wa-concierge\s*\{[^}]*\}',
    """.floating-wa-concierge {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--deep-navy);
  color: var(--pearl-white);
  border: 1px solid var(--antique-gold);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  border-radius: 2px;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  text-decoration: none;
  box-shadow: 0 4px 18px rgba(10, 36, 56, 0.35);
  z-index: 90;
  transition: var(--transition);
}
.floating-wa-concierge:hover {
  background: var(--midnight-navy);
  color: var(--champagne);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(10, 36, 56, 0.5);
}""",
    content
)

# 7. Add Luxury Campaign Hero, Commitments Bar, and Editorial Category styles to CSS
additional_luxury_css = """
/* ── Authentic Luxury Campaign Hero Banner ── */
.hero-campaign-section {
  background-color: var(--deep-navy);
  background-image: linear-gradient(to right, #0A2438 0%, rgba(10, 36, 56, 0.96) 35%, rgba(10, 36, 56, 0.72) 48%, rgba(10, 36, 56, 0.15) 70%, transparent 85%), url('assets/hero-model.jpg');
  background-position: right center;
  background-size: cover;
  background-repeat: no-repeat;
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid rgba(181, 138, 69, 0.25);
  min-height: calc(100vh - 105px);
  display: flex;
  align-items: center;
}
.hero-campaign-container {
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  padding: 60px 48px;
  position: relative;
  z-index: 2;
}
.hero-campaign-container .hero-text-block {
  max-width: 620px;
}
.hero-trust-micro {
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(232, 213, 181, 0.75);
  font-weight: 500;
}
.hero-model-tag {
  position: absolute;
  bottom: 24px;
  right: 36px;
  font-size: 10.5px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(248, 245, 239, 0.75);
  background: rgba(10, 36, 56, 0.75);
  padding: 6px 14px;
  border: 1px solid rgba(181, 138, 69, 0.3);
  border-radius: 2px;
  z-index: 3;
}

/* ── Typographic Atelier Commitments Strip ── */
.commitments-bar {
  background: var(--deep-navy);
  color: var(--warm-ivory);
  border-bottom: 1px solid rgba(181, 138, 69, 0.2);
  padding: 32px 48px;
}
.commitments-grid {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
}
.commitment-item {
  border-left: 1px solid rgba(181, 138, 69, 0.25);
  padding-left: 20px;
  display: flex;
  flex-direction: column;
}
.commitment-item:first-child {
  border-left: none;
  padding-left: 0;
}
.commitment-num {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--antique-gold);
  margin-bottom: 6px;
  text-transform: uppercase;
}
.commitment-title {
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 600;
  color: var(--pearl-white);
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}
.commitment-desc {
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--champagne);
  opacity: 0.85;
}

/* ── Asymmetric Editorial Categories ── */
.curated-collections-section {
  max-width: 1400px;
  margin: 0 auto;
  padding: 80px 32px 40px;
}
.editorial-collections-tier1 {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}
.editorial-collections-tier2 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
.editorial-card-featured {
  height: 380px;
  border-radius: 2px;
  overflow: hidden;
  position: relative;
  background: var(--deep-navy);
  border: 1px solid rgba(181, 138, 69, 0.25);
  cursor: pointer;
  transition: var(--transition);
}
.editorial-card-featured:hover {
  border-color: var(--antique-gold);
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}
.editorial-card-featured img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}
.editorial-card-featured:hover img {
  transform: scale(1.06);
}
.editorial-card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(10, 36, 56, 0.95) 100%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 28px;
  color: var(--pearl-white);
}
.editorial-card-overlay .cat-label {
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--antique-gold);
  font-weight: 600;
  margin-bottom: 4px;
}
.editorial-card-overlay h3 {
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 600;
  color: var(--pearl-white);
  margin-bottom: 6px;
}
.editorial-card-overlay p {
  font-size: 13px;
  color: var(--champagne);
  margin-bottom: 12px;
  max-width: 440px;
}
.editorial-card-overlay .card-link {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--antique-gold);
}
.editorial-card-quad {
  height: 290px;
  border-radius: 2px;
  overflow: hidden;
  position: relative;
  background: var(--deep-navy);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: var(--transition);
}
.editorial-card-quad:hover {
  border-color: var(--antique-gold);
  box-shadow: var(--shadow-md);
  transform: translateY(-4px);
}
.editorial-card-quad img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}
.editorial-card-quad:hover img {
  transform: scale(1.06);
}
.editorial-card-quad .editorial-card-overlay {
  padding: 20px;
}
.editorial-card-quad .editorial-card-overlay h3 {
  font-size: 18px;
  margin-bottom: 4px;
}

/* ── Wedding Banner Occasions Row ── */
.wedding-occasions-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.wedding-occasion-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid rgba(181, 138, 69, 0.4);
  border-radius: 2px;
  font-size: 12px;
  letter-spacing: 1px;
  color: var(--champagne);
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.04);
  transition: var(--transition);
  text-decoration: none;
}
.wedding-occasion-tag:hover {
  border-color: var(--antique-gold);
  color: var(--pearl-white);
  background: rgba(181, 138, 69, 0.15);
}

/* ── Product Card 3:4 Portrait Ratio & SVG Wishlist ── */
.product-card .card-media {
  aspect-ratio: 3 / 4;
  height: auto;
  position: relative;
  background: var(--deep-navy);
  overflow: hidden;
}
.card-wishlist-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.92);
  width: 32px;
  height: 32px;
  border-radius: 2px;
  display: grid;
  place-items: center;
  color: var(--charcoal);
  z-index: 2;
  transition: all 0.2s ease;
  border: 1px solid rgba(0,0,0,0.06);
}
.card-wishlist-btn svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}
.card-wishlist-btn.active {
  background: var(--deep-navy);
  color: var(--antique-gold);
}
.card-wishlist-btn.active svg {
  fill: var(--antique-gold);
  stroke: var(--antique-gold);
}
"""

content = content.replace("</style>", additional_luxury_css + "\n</style>", 1)

# 8. Clean up Footer static HTML (remove emojis, replace Cinzel)
old_footer = """<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-col">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <img src="logo.png" alt="Shanmuka Emblem" style="width: 48px; height: 48px; border-radius: 50%; border: 1px solid var(--champagne-gold);">
        <strong style="color: var(--champagne-gold); font-family: 'Cinzel', serif; font-size: 16px; letter-spacing: 1px;">SHANMUKA FASHIONS</strong>
      </div>
      <p>A premier luxury destination for traditional Indian handlooms and contemporary celebration drapes. Curating timeless elegance across Kanchipuram, Banarasi, Organza, and pure festive silks.</p>
      <p style="color: var(--champagne-gold); font-size: 12.5px;">✧ Authentic Handloom Mark • Certified Zari</p>
    </div>

    <div class="footer-col">
      <h3>Saree Weaves</h3>
      <ul>
        <li><a href="#/catalogue?category=Kanchipuram">Kanchipuram Silks</a></li>
        <li><a href="#/catalogue?category=Banarasi">Banarasi Brocades</a></li>
        <li><a href="#/catalogue?category=Organza">Floral Organza</a></li>
        <li><a href="#/catalogue?category=Silk">Festive Silk Sarees</a></li>
        <li><a href="#/catalogue?category=Cotton">Handloom Cottons</a></li>
      </ul>
    </div>

    <div class="footer-col">
      <h3>Occasions & Edits</h3>
      <ul>
        <li><a href="#/catalogue?occasion=Bridal">Bridal & Wedding</a></li>
        <li><a href="#/catalogue?occasion=Festive">Festive Celebrations</a></li>
        <li><a href="#/catalogue?occasion=Party">Cocktail & Party</a></li>
        <li><a href="#/catalogue?filter=bestseller">Most Loved Bestsellers</a></li>
        <li><a href="#/story">Artisan Craft & Story</a></li>
      </ul>
    </div>

    <div class="footer-col">
      <h3>Concierge & Boutique</h3>
      <p>📞 Phone: <b>+91 98765 43210</b></p>
      <p>💬 WhatsApp: <b>+91 98765 43210</b></p>
      <p>🕒 Hours: 10:00 AM – 9:00 PM (IST)</p>
      <p>📍 Hyderabad Boutique Showroom</p>
      <a href="https://wa.me/919876543210?text=Hello%20Shanmuka%20Fashions,%20I%20would%20like%20to%20book%20a%20video%20shopping%20consultation." target="_blank" rel="noopener noreferrer" style="color: var(--champagne-gold); font-weight: 600; text-decoration: underline;">Book WhatsApp Video Call →</a>
    </div>
  </div>

  <div class="footer-bottom">
    <div>© <span id="currentYear"></span> SHANMUKA FASHIONS. All Rights Reserved. | <a href="#/admin" style="color: var(--champagne-gold); text-decoration: underline;">Atelier Admin Portal</a></div>
    <div>Secure UPI, Cards & Netbanking | Authentic Silk Mark Guarantee</div>
  </div>
</footer>"""

new_footer = """<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-col">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <img src="logo.png" alt="Shanmuka Emblem" style="width: 48px; height: 48px; border-radius: 50%; border: 1px solid var(--antique-gold);">
        <strong style="color: var(--antique-gold); font-family: var(--font-serif); font-size: 16px; letter-spacing: 1px;">SHANMUKA FASHIONS</strong>
      </div>
      <p>A premier luxury destination for traditional Indian handlooms and contemporary celebration drapes. Curating timeless elegance across Kanchipuram, Banarasi, Organza, and pure festive silks.</p>
      <p style="color: var(--antique-gold); font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Silk Mark Certified &bull; Generational Handloom Heritage</p>
    </div>

    <div class="footer-col">
      <h3>Saree Weaves</h3>
      <ul>
        <li><a href="#/catalogue?category=Kanchipuram">Kanchipuram Silks</a></li>
        <li><a href="#/catalogue?category=Banarasi">Banarasi Brocades</a></li>
        <li><a href="#/catalogue?category=Organza">Floral Organza</a></li>
        <li><a href="#/catalogue?category=Silk">Festive Silk Sarees</a></li>
        <li><a href="#/catalogue?category=Cotton">Handloom Cottons</a></li>
      </ul>
    </div>

    <div class="footer-col">
      <h3>Occasions & Edits</h3>
      <ul>
        <li><a href="#/catalogue?occasion=Bridal">Bridal & Wedding</a></li>
        <li><a href="#/catalogue?occasion=Festive">Festive Celebrations</a></li>
        <li><a href="#/catalogue?occasion=Party">Cocktail & Party</a></li>
        <li><a href="#/catalogue?filter=bestseller">Most Loved Bestsellers</a></li>
        <li><a href="#/story">Artisan Craft & Story</a></li>
      </ul>
    </div>

    <div class="footer-col">
      <h3>Concierge & Boutique</h3>
      <p>Direct Call: <b>+91 98765 43210</b></p>
      <p>WhatsApp Concierge: <b>+91 98765 43210</b></p>
      <p>Salon Hours: 10:00 AM – 9:00 PM (IST)</p>
      <p>Flagship Showroom: Jubilee Hills, Hyderabad</p>
      <a href="https://wa.me/919876543210?text=Hello%20Shanmuka%20Fashions,%20I%20would%20like%20to%20book%20a%20video%20shopping%20consultation." target="_blank" rel="noopener noreferrer" style="color: var(--antique-gold); font-weight: 600; text-decoration: underline;">Book WhatsApp Video Styling &rarr;</a>
    </div>
  </div>

  <div class="footer-bottom">
    <div>&copy; <span id="currentYear"></span> SHANMUKA FASHIONS. All Rights Reserved. | <a href="#/admin" style="color: var(--antique-gold); text-decoration: underline;">Atelier Admin Portal</a></div>
    <div>Silk Mark Certified &bull; Insured Worldwide Express Delivery</div>
  </div>
</footer>"""

if old_footer in content:
    content = content.replace(old_footer, new_footer)
else:
    print("Warning: old footer exact match not found; performing regex replace")
    content = re.sub(r'<footer class="site-footer">[\s\S]*?</footer>', new_footer, content, count=1)

# 9. Clean up Drawer & Modal Emojis
content = content.replace('Order via WhatsApp 💬', 'Order via WhatsApp')
content = content.replace('Enquire on WhatsApp 💬', 'Enquire on WhatsApp')
content = content.replace('Enquire / Buy Now via WhatsApp 💬', 'Enquire / Buy Now via WhatsApp')
content = content.replace('⚙ Filters', 'Filters')

with open("index.html", "w", encoding="utf-8") as f:
    f.write(content)

print("Part 1 complete: CSS and static HTML updated successfully.")

