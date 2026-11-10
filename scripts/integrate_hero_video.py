#!/usr/bin/env python3
"""
Integrate gemini_generated_video_e8550a2b.mp4 into Shanmuka Fashions Hero Section.
"""
import re

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update CSS for Hero Campaign Section & Video Background
old_hero_css = """/* ── Authentic Luxury Campaign Hero Banner ── */
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
}"""

new_hero_css = """/* ── Authentic Luxury Campaign Hero Banner with Cinematic 21:9 Video ── */
.hero-campaign-section {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid rgba(181, 138, 69, 0.25);
  min-height: calc(100vh - 105px);
  display: flex;
  align-items: center;
  background-color: var(--deep-navy);
}

/* Background Cinematic Video (21:9 Aspect Ratio) */
.hero-video-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: right center; /* keeps the saree model on the right prominently visible */
  z-index: 1;
  pointer-events: none;
}

/* Gradient Overlay on Left Side only for Text Contrast */
.hero-video-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgba(10, 36, 56, 0.88) 0%,
    rgba(10, 36, 56, 0.65) 35%,
    rgba(10, 36, 56, 0.15) 55%,
    transparent 72%
  );
  z-index: 2;
  pointer-events: none;
}

.hero-campaign-container {
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  padding: 60px 48px;
  position: relative;
  z-index: 3;
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
  color: rgba(248, 245, 239, 0.85);
  background: rgba(10, 36, 56, 0.75);
  padding: 6px 14px;
  border: 1px solid rgba(181, 138, 69, 0.3);
  border-radius: 2px;
  z-index: 3;
  backdrop-filter: blur(4px);
}

/* Reduced Motion Fallback */
@media (prefers-reduced-motion: reduce) {
  .hero-video-bg {
    display: none;
  }
  .hero-campaign-section {
    background-image: linear-gradient(
      to right,
      rgba(10, 36, 56, 0.88) 0%,
      rgba(10, 36, 56, 0.65) 35%,
      rgba(10, 36, 56, 0.15) 55%,
      transparent 72%
    ), url('assets/hero-model.jpg');
    background-position: right center;
    background-size: cover;
  }
}"""

if old_hero_css in content:
    content = content.replace(old_hero_css, new_hero_css)
    print("Hero CSS successfully updated.")
else:
    print("Warning: old hero css exact match not found; performing regex replace")
    content = re.sub(
        r'/\* ── Authentic Luxury Campaign Hero Banner ── \*/[\s\S]*?\.hero-model-tag\s*\{[^}]*\}',
        new_hero_css,
        content,
        count=1
    )

# 2. Update media queries for hero-video-bg
old_992_hero = """  .hero-editorial-section {
    min-height: auto;
  }
  .hero-editorial-container {
    grid-template-columns: 1fr;
    text-align: center;
    padding: 36px 24px;
    gap: 28px;
  }
  .hero-text-block {
    max-width: 100%;
    margin: 0 auto;
  }
  .hero-eyebrow-badge {
    justify-content: center;
  }
  .hero-narrative {
    margin: 0 auto 24px;
  }
  .hero-button-group {
    justify-content: center;
  }
  .hero-model-visual {
    justify-content: center;
    min-height: 380px;
  }
  .hero-model-silhouette {
    max-height: 480px;
    margin: 0 auto;
  }
  .hero-floating-badge {
    left: 50%;
    transform: translateX(-50%);
    bottom: 12px;
  }"""

new_992_hero = """  .hero-campaign-section {
    min-height: 560px;
  }
  .hero-video-bg {
    object-position: 70% center;
  }
  .hero-video-overlay {
    background: linear-gradient(
      to right,
      rgba(10, 36, 56, 0.92) 0%,
      rgba(10, 36, 56, 0.78) 50%,
      rgba(10, 36, 56, 0.25) 75%,
      transparent 100%
    );
  }
  .hero-campaign-container {
    padding: 48px 32px;
  }"""

if old_992_hero in content:
    content = content.replace(old_992_hero, new_992_hero)
    print("992px media query updated.")
else:
    print("Notice: old_992_hero not found as exact block.")

old_768_hero = """  .hero-main-heading { font-size: clamp(28px, 7vw, 36px); }
  .hero-tagline-text { font-size: 19px; }
  .hero-button-group {
    flex-direction: column;
    width: 100%;
    gap: 12px;
  }
  .btn-hero-primary, .btn-hero-secondary {
    width: 100%;
    justify-content: center;
  }
  .hero-model-visual { min-height: 300px; }
  .hero-model-silhouette { max-height: 340px; }"""

new_768_hero = """  .hero-campaign-section {
    min-height: calc(100vh - 80px);
    display: flex;
    align-items: flex-end;
    padding-bottom: 24px;
  }
  .hero-video-bg {
    object-position: 75% center;
  }
  .hero-video-overlay {
    background: linear-gradient(
      to top,
      rgba(10, 36, 56, 0.95) 0%,
      rgba(10, 36, 56, 0.82) 45%,
      rgba(10, 36, 56, 0.35) 75%,
      rgba(10, 36, 56, 0.15) 100%
    );
  }
  .hero-campaign-container {
    padding: 32px 20px 16px;
    text-align: left;
  }
  .hero-main-heading { font-size: clamp(28px, 6.5vw, 36px); }
  .hero-tagline-text { font-size: 19px; }
  .hero-button-group {
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }
  .btn-hero-primary, .btn-hero-secondary {
    width: 100%;
    justify-content: center;
  }
  .hero-model-tag { display: none; }"""

if old_768_hero in content:
    content = content.replace(old_768_hero, new_768_hero)
    print("768px media query updated.")
else:
    print("Notice: old_768_hero not found as exact block.")

# 3. Update renderHomeView HTML to include the <video> element
old_hero_markup = """    <!-- 1. Authentic Luxury Campaign Hero Banner -->
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
    </section>"""

new_hero_markup = """    <!-- 1. Authentic Luxury Campaign Hero Banner with Cinematic Video -->
    <section class="hero-campaign-section" aria-label="Haute Couture Campaign">
      <!-- Background Cinematic Video (21:9 Aspect Ratio) -->
      <video
        class="hero-video-bg"
        autoplay
        muted
        loop
        playsinline
        preload="metadata"
        poster="assets/hero-model.jpg"
        aria-hidden="true"
      >
        <source src="gemini_generated_video_e8550a2b.mp4" type="video/mp4">
      </video>

      <!-- Gradient Overlay on Left Side only for Text Contrast -->
      <div class="hero-video-overlay" aria-hidden="true"></div>

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
    </section>"""

if old_hero_markup in content:
    content = content.replace(old_hero_markup, new_hero_markup)
    print("Hero video markup successfully inserted.")
else:
    print("Warning: old_hero_markup exact match not found; performing regex replace.")
    content = re.sub(
        r'<!-- 1\. Authentic Luxury Campaign Hero Banner -->[\s\S]*?</section>',
        new_hero_markup,
        content,
        count=1
    )

# 4. In renderHomeView(), ensure video playback and respect reduced motion
old_attach_events = """  attachProductCardEvents();
}"""

new_attach_events = """  attachProductCardEvents();

  // Ensure hero video playback and respect prefers-reduced-motion
  const heroVid = document.querySelector('.hero-video-bg');
  if (heroVid) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      heroVid.pause();
    } else {
      heroVid.play().catch(() => {
        // Handled silently by muted autoplay
      });
    }
  }
}"""

if old_attach_events in content:
    content = content.replace(old_attach_events, new_attach_events, 1)
    print("Video playback logic added to renderHomeView.")
else:
    print("Notice: old_attach_events not replaced.")

with open("index.html", "w", encoding="utf-8") as f:
    f.write(content)

print("Video integration script complete.")

