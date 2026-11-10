#!/usr/bin/env python3
"""
Cleanly structure CSS so that all Base Styles are declared before Media Queries.
"""
import re

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# Separate the style content
style_start = content.find("<style>") + len("<style>")
style_end = content.find("</style>")
css = content[style_start:style_end]

# Extract the base block that was mistakenly appended after media queries:
base_block_start = css.find("/* ── Authentic Luxury Campaign Hero Banner with Cinematic 21:9 Video ── */")
if base_block_start != -1:
    base_block = css[base_block_start:]
    css_before_base = css[:base_block_start]
else:
    print("Base block not found by exact string, checking alternative")
    base_block_start = css.find(".hero-campaign-section {")
    base_block = css[base_block_start:]
    css_before_base = css[:base_block_start]

# Also remove the media query for prefers-reduced-motion if it was inside base_block:
reduced_motion_css = """
/* ── Reduced Motion Fallback ── */
@media (prefers-reduced-motion: reduce) {
  .hero-video-bg {
    display: none !important;
  }
  .hero-campaign-section {
    background-image: linear-gradient(
      to right,
      rgba(248, 245, 239, 0.95) 0%,
      rgba(248, 245, 239, 0.88) 32%,
      rgba(248, 245, 239, 0.5) 50%,
      transparent 68%
    ), url('assets/hero-model.jpg') !important;
    background-position: right center !important;
    background-size: cover !important;
  }
}"""

# Clean base block from any media queries
base_block_clean = re.sub(r'@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\}\s*\}', '', base_block)

# Locate responsive adaptations in css_before_base
resp_idx = css_before_base.find("/* ── Responsive Adaptations ── */")
main_base = css_before_base[:resp_idx].strip()
resp_block = css_before_base[resp_idx:].strip()

# Clean resp_block of obsolete classes (.hero-editorial-section, etc.) and update hero responsive rules
clean_resp = """/* ── Responsive Adaptations ── */
@media (max-width: 1200px) {
  .editorial-collections-tier1 { grid-template-columns: 1fr 1fr; }
  .editorial-collections-tier2 { grid-template-columns: repeat(3, 1fr); }
  .product-grid { grid-template-columns: repeat(3, 1fr); }
  .footer-inner { grid-template-columns: 1fr 1fr; gap: 32px; }
  .hero-campaign-container { padding: 48px 36px; }
  .wedding-banner-container { gap: 32px; }
  .admin-kpis { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 992px) {
  .catalogue-layout { grid-template-columns: 1fr; }
  .filter-sidebar {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 320;
    overflow-y: auto;
    border-radius: 0;
    max-width: 340px;
  }
  .filter-sidebar.open { display: block; }
  .mobile-filter-btn { display: inline-flex; }
  .pdp-grid { grid-template-columns: 1fr; gap: 32px; }
  .story-container { grid-template-columns: 1fr; gap: 36px; }
  .commitments-grid { grid-template-columns: repeat(2, 1fr); gap: 24px; }
  .editorial-collections-tier1 { grid-template-columns: 1fr; }
  .editorial-collections-tier2 { grid-template-columns: repeat(2, 1fr); }
  .wedding-banner-container { grid-template-columns: 1fr; text-align: center; }
  .wedding-description { margin: 0 auto 24px; }
  .wedding-actions { justify-content: center; }

  /* Hero adjustments for Tablet */
  .hero-campaign-section {
    min-height: 600px;
  }
  .hero-video-bg {
    top: -8%;
    height: 116%;
    object-position: 88% center;
  }
  .hero-video-overlay {
    background: linear-gradient(
      to right,
      rgba(248, 245, 239, 0.97) 0%,
      rgba(248, 245, 239, 0.90) 48%,
      rgba(248, 245, 239, 0.35) 70%,
      transparent 90%
    );
  }
  .hero-campaign-container {
    padding: 48px 32px;
  }
  .hero-campaign-container .hero-text-block {
    max-width: 440px;
  }
  .admin-kpis { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .header-inner { padding: 10px 16px; }
  .nav-menu { display: none; }
  .menu-toggle { display: flex; }
  .search-expandable { display: none; }

  /* Mobile Slide Navigation */
  .mobile-nav-drawer {
    position: fixed;
    inset: 0;
    background: var(--deep-navy);
    z-index: 250;
    display: none;
    flex-direction: column;
    padding: 30px 24px;
    overflow-y: auto;
  }
  .mobile-nav-drawer.open { display: flex; }
  .mobile-nav-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(181, 138, 69, 0.2);
    padding-bottom: 16px;
    margin-bottom: 20px;
  }
  .mobile-nav-links a {
    color: var(--warm-ivory);
    font-size: 16px;
    padding: 12px 0;
    display: block;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .floating-wa-concierge {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 14px;
    font-size: 11px;
  }
  .floating-wa-concierge span { display: none; }

  /* Hero adjustments for Mobile */
  .hero-campaign-section {
    min-height: calc(100vh - 80px);
    display: flex;
    align-items: flex-end;
    padding-bottom: 24px;
    background-color: var(--warm-ivory);
  }
  .hero-video-bg {
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-position: 78% center;
  }
  .hero-video-overlay {
    background: linear-gradient(
      to top,
      rgba(248, 245, 239, 1) 0%,
      rgba(248, 245, 239, 0.94) 52%,
      rgba(248, 245, 239, 0.4) 75%,
      transparent 100%
    );
  }
  .hero-campaign-container {
    padding: 24px 20px 16px;
    text-align: left;
    width: 100%;
  }
  .hero-campaign-container .hero-text-block {
    max-width: 100%;
  }
  .hero-main-heading { font-size: clamp(26px, 6.8vw, 34px); line-height: 1.18; margin-bottom: 8px; }
  .hero-tagline-text { font-size: 18px; margin-bottom: 12px; }
  .hero-narrative { font-size: 13.5px; line-height: 1.6; margin-bottom: 20px; }
  .hero-button-group {
    flex-direction: column;
    width: 100%;
    gap: 10px;
    margin-bottom: 16px;
  }
  .btn-hero-primary, .btn-hero-secondary {
    width: 100%;
    justify-content: center;
  }
  .hero-model-tag { display: none; }

  .commitments-grid { grid-template-columns: 1fr; gap: 18px; }
  .commitment-item { border-left: none; padding-left: 0; border-top: 1px solid rgba(181, 138, 69, 0.2); padding-top: 14px; }
  .commitment-item:first-child { border-top: none; padding-top: 0; }
  .editorial-collections-tier2 { grid-template-columns: 1fr; }
  .product-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .card-media { aspect-ratio: 3 / 4; }
  .card-title { font-size: 14px; }
  .current-price { font-size: 15px; }

  .quick-view-card { grid-template-columns: 1fr; }
  .quick-view-media { height: 220px; }
  .footer-inner { grid-template-columns: 1fr; gap: 28px; }
  .admin-kpis { grid-template-columns: 1fr; }
}"""

# Assemble new CSS: main base + base block + clean responsive + reduced motion
new_css = "\n\n" + main_base + "\n\n" + base_block_clean.strip() + "\n\n" + clean_resp.strip() + "\n\n" + reduced_motion_css.strip() + "\n"

new_content = content[:style_start] + new_css + content[style_end:]

with open("index.html", "w", encoding="utf-8") as f:
    f.write(new_content)

print("CSS reordered and cleaned up successfully.")

