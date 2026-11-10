import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update Mega Menu
html = html.replace(
    '<img src="assets/banarasi.jpg" alt="Banarasi Collection">',
    '<img src="assets/golden-silk-saree-clean.jpg" alt="Banarasi Collection">'
)

# 2. Update Admin placeholder and defaults
html = html.replace(
    '<input type="text" id="adminProdImg" required placeholder="assets/kanchipuram.jpg">',
    '<input type="text" id="adminProdImg" required placeholder="assets/kanchipuram-loom.jpg">'
)
html = html.replace(
    "$('adminProdImg').value = 'assets/kanchipuram.jpg';",
    "$('adminProdImg').value = 'assets/kanchipuram-loom.jpg';"
)
html = html.replace(
    "const img = $('adminProdImg').value.trim() || 'assets/kanchipuram.jpg';",
    "const img = $('adminProdImg').value.trim() || 'assets/kanchipuram-loom.jpg';"
)

# 3. Update Curated Collections in renderHomeView()
html = html.replace(
    '<img src="assets/kanchipuram.jpg" alt="Kanchipuram Silks" loading="lazy">',
    '<img src="assets/kanchipuram-loom.jpg" alt="Kanchipuram Silks" loading="lazy">'
)
html = html.replace(
    '<img src="assets/banarasi.jpg" alt="Banarasi Heritage" loading="lazy">',
    '<img src="assets/golden-silk-saree-clean.jpg" alt="Banarasi Heritage" loading="lazy">'
)
html = html.replace(
    '<img src="assets/organza.jpg" alt="Floral Organza" loading="lazy">',
    '<img src="assets/golden-silk-saree-clean.jpg" alt="Floral Organza" loading="lazy">'
)
html = html.replace(
    '<img src="assets/silk.jpg" alt="Festive Pure Silk" loading="lazy">',
    '<img src="assets/raw-silk-yarns.jpg" alt="Festive Pure Silk" loading="lazy">'
)
html = html.replace(
    '<img src="assets/cotton.jpg" alt="Handloom Cotton" loading="lazy">',
    '<img src="assets/handloom-weaving.jpg" alt="Handloom Cotton" loading="lazy">'
)

# 4. Update Story Section in renderHomeView()
html = html.replace(
    '<img src="assets/kanchipuram.jpg" alt="Artisan Weaving Tradition" loading="lazy">',
    '<img src="assets/kanchipuram-loom.jpg" alt="Artisan Weaving Tradition" loading="lazy">'
)

# 5. Update COLLECTION_INFO
html = html.replace(
    "'kanchipuram': { name: 'Kanchipuram Sarees', category: 'Kanchipuram', banner: 'assets/kanchipuram.jpg'",
    "'kanchipuram': { name: 'Kanchipuram Sarees', category: 'Kanchipuram', banner: 'assets/kanchipuram-loom.jpg'"
)
html = html.replace(
    "'banarasi': { name: 'Banarasi Sarees', category: 'Banarasi', banner: 'assets/banarasi.jpg'",
    "'banarasi': { name: 'Banarasi Sarees', category: 'Banarasi', banner: 'assets/golden-silk-saree-clean.jpg'"
)
html = html.replace(
    "'organza': { name: 'Organza Sarees', category: 'Organza', banner: 'assets/organza.jpg'",
    "'organza': { name: 'Organza Sarees', category: 'Organza', banner: 'assets/golden-silk-saree-clean.jpg'"
)
html = html.replace(
    "'silk': { name: 'Festive Silk Sarees', category: 'Silk', banner: 'assets/silk.jpg'",
    "'silk': { name: 'Festive Silk Sarees', category: 'Silk', banner: 'assets/raw-silk-yarns.jpg'"
)
html = html.replace(
    "'cotton': { name: 'Handloom Cotton Sarees', category: 'Cotton', banner: 'assets/cotton.jpg'",
    "'cotton': { name: 'Handloom Cotton Sarees', category: 'Cotton', banner: 'assets/handloom-weaving.jpg'"
)

# 6. Update categoriesList in renderCollectionsIndexView
html = html.replace(
    "{ name: 'Kanchipuram Sarees', cat: 'Kanchipuram', slug: 'kanchipuram', img: 'assets/kanchipuram.jpg'",
    "{ name: 'Kanchipuram Sarees', cat: 'Kanchipuram', slug: 'kanchipuram', img: 'assets/kanchipuram-loom.jpg'"
)
html = html.replace(
    "{ name: 'Banarasi Sarees', cat: 'Banarasi', slug: 'banarasi', img: 'assets/banarasi.jpg'",
    "{ name: 'Banarasi Sarees', cat: 'Banarasi', slug: 'banarasi', img: 'assets/golden-silk-saree-clean.jpg'"
)
html = html.replace(
    "{ name: 'Organza Sarees', cat: 'Organza', slug: 'organza', img: 'assets/organza.jpg'",
    "{ name: 'Organza Sarees', cat: 'Organza', slug: 'organza', img: 'assets/golden-silk-saree-clean.jpg'"
)
html = html.replace(
    "{ name: 'Pure Silk Sarees', cat: 'Pure Silk', slug: 'silk', img: 'assets/silk.jpg'",
    "{ name: 'Pure Silk Sarees', cat: 'Pure Silk', slug: 'silk', img: 'assets/raw-silk-yarns.jpg'"
)
html = html.replace(
    "{ name: 'Handloom Cotton Sarees', cat: 'Handloom Cotton', slug: 'cotton', img: 'assets/cotton.jpg'",
    "{ name: 'Handloom Cotton Sarees', cat: 'Handloom Cotton', slug: 'cotton', img: 'assets/handloom-weaving.jpg'"
)

# 7. Update DEFAULT_PRODUCTS individual items
# id: 1
html = html.replace(
    "id: 1,\n    name: 'Royal Kanchipuram Pure Silk Saree',\n    category: 'Kanchipuram',\n    fabric: 'Pure Silk',\n    color: 'Burgundy',\n    price: 6499,\n    old: 7999,\n    badge: 'Bestseller',\n    img: 'assets/kanchipuram.jpg'",
    "id: 1,\n    name: 'Royal Kanchipuram Pure Silk Saree',\n    category: 'Kanchipuram',\n    fabric: 'Pure Silk',\n    color: 'Burgundy',\n    price: 6499,\n    old: 7999,\n    badge: 'Bestseller',\n    img: 'assets/kanchipuram-loom.jpg'"
)
# id: 2
html = html.replace(
    "id: 2,\n    name: 'Banarasi Heritage Meenakari Weave',\n    category: 'Banarasi',\n    fabric: 'Katan Silk',\n    color: 'Emerald Green',\n    price: 5299,\n    old: 6499,\n    badge: 'New Arrival',\n    img: 'assets/banarasi.jpg'",
    "id: 2,\n    name: 'Banarasi Heritage Meenakari Weave',\n    category: 'Banarasi',\n    fabric: 'Katan Silk',\n    color: 'Emerald Green',\n    price: 5299,\n    old: 6499,\n    badge: 'New Arrival',\n    img: 'assets/golden-silk-saree-clean.jpg'"
)
# id: 3
html = html.replace(
    "id: 3,\n    name: 'Floral Organza Tissue Saree',\n    category: 'Organza',\n    fabric: 'Organza',\n    color: 'Pastel Pink',\n    price: 2899,\n    old: 3499,\n    badge: 'Trending',\n    img: 'assets/organza.jpg'",
    "id: 3,\n    name: 'Floral Organza Tissue Saree',\n    category: 'Organza',\n    fabric: 'Organza',\n    color: 'Pastel Pink',\n    price: 2899,\n    old: 3499,\n    badge: 'Trending',\n    img: 'assets/raw-silk-yarns.jpg'"
)
# id: 4
html = html.replace(
    "id: 4,\n    name: 'Festive Peacock Zari Silk Saree',\n    category: 'Silk',\n    fabric: 'Pure Silk',\n    color: 'Magenta Pink',\n    price: 4199,\n    old: 4999,\n    badge: 'Featured',\n    img: 'assets/silk.jpg'",
    "id: 4,\n    name: 'Festive Peacock Zari Silk Saree',\n    category: 'Silk',\n    fabric: 'Pure Silk',\n    color: 'Magenta Pink',\n    price: 4199,\n    old: 4999,\n    badge: 'Featured',\n    img: 'assets/raw-silk-yarns.jpg'"
)
# id: 5
html = html.replace(
    "id: 5,\n    name: 'Everyday Handloom Cotton Grace',\n    category: 'Cotton',\n    fabric: 'Handloom Cotton',\n    color: 'Indigo Blue',\n    price: 1499,\n    old: 1899,\n    badge: 'Everyday Grace',\n    img: 'assets/cotton.jpg'",
    "id: 5,\n    name: 'Everyday Handloom Cotton Grace',\n    category: 'Cotton',\n    fabric: 'Handloom Cotton',\n    color: 'Indigo Blue',\n    price: 1499,\n    old: 1899,\n    badge: 'Everyday Grace',\n    img: 'assets/handloom-weaving.jpg'"
)
# id: 6
html = html.replace(
    "id: 6,\n    name: 'Bridal Kanchipuram Gold Brocade',\n    category: 'Kanchipuram',\n    fabric: 'Pure Silk',\n    color: 'Burgundy',\n    price: 8999,\n    old: 10999,\n    badge: 'Bestseller',\n    img: 'assets/kanchipuram.jpg'",
    "id: 6,\n    name: 'Bridal Kanchipuram Gold Brocade',\n    category: 'Kanchipuram',\n    fabric: 'Pure Silk',\n    color: 'Burgundy',\n    price: 8999,\n    old: 10999,\n    badge: 'Bestseller',\n    img: 'assets/kanchipuram-loom.jpg'"
)
# id: 7
html = html.replace(
    "id: 7,\n    name: 'Banarasi Celebration Silk Saree',\n    category: 'Banarasi',\n    fabric: 'Katan Silk',\n    color: 'Emerald Green',\n    price: 5799,\n    old: 6999,\n    badge: 'Popular',\n    img: 'assets/banarasi.jpg'",
    "id: 7,\n    name: 'Banarasi Celebration Silk Saree',\n    category: 'Banarasi',\n    fabric: 'Katan Silk',\n    color: 'Emerald Green',\n    price: 5799,\n    old: 6999,\n    badge: 'Popular',\n    img: 'assets/golden-silk-saree-clean.jpg'"
)
# id: 8
html = html.replace(
    "id: 8,\n    name: 'Soft Indigo Handloom Cotton',\n    category: 'Cotton',\n    fabric: 'Handloom Cotton',\n    color: 'Indigo Blue',\n    price: 1799,\n    old: 2199,\n    badge: 'Comfort Pick',\n    img: 'assets/cotton.jpg'",
    "id: 8,\n    name: 'Soft Indigo Handloom Cotton',\n    category: 'Cotton',\n    fabric: 'Handloom Cotton',\n    color: 'Indigo Blue',\n    price: 1799,\n    old: 2199,\n    badge: 'Comfort Pick',\n    img: 'assets/handloom-weaving.jpg'"
)
# id: 9
html = html.replace(
    "id: 9,\n    name: 'Shimmer Champagne Organza Tissue',\n    category: 'Organza',\n    fabric: 'Organza',\n    color: 'Champagne Gold',\n    price: 3499,\n    old: 4199,\n    badge: 'New Arrival',\n    img: 'assets/organza.jpg'",
    "id: 9,\n    name: 'Shimmer Champagne Organza Tissue',\n    category: 'Organza',\n    fabric: 'Organza',\n    color: 'Champagne Gold',\n    price: 3499,\n    old: 4199,\n    badge: 'New Arrival',\n    img: 'assets/golden-silk-saree-clean.jpg'"
)
# id: 10
html = html.replace(
    "id: 10,\n    name: 'Traditional Royal Temple Silk',\n    category: 'Silk',\n    fabric: 'Pure Silk',\n    color: 'Burgundy',\n    price: 4899,\n    old: 5999,\n    badge: 'Festive Edit',\n    img: 'assets/silk.jpg'",
    "id: 10,\n    name: 'Traditional Royal Temple Silk',\n    category: 'Silk',\n    fabric: 'Pure Silk',\n    color: 'Burgundy',\n    price: 4899,\n    old: 5999,\n    badge: 'Festive Edit',\n    img: 'assets/kanchipuram-loom.jpg'"
)
# id: 11
html = html.replace(
    "id: 11,\n    name: 'Regal Banarasi Brocade Bridal Edit',\n    category: 'Banarasi',\n    fabric: 'Katan Silk',\n    color: 'Champagne Gold',\n    price: 7499,\n    old: 8999,\n    badge: 'Bestseller',\n    img: 'assets/banarasi.jpg'",
    "id: 11,\n    name: 'Regal Banarasi Brocade Bridal Edit',\n    category: 'Banarasi',\n    fabric: 'Katan Silk',\n    color: 'Champagne Gold',\n    price: 7499,\n    old: 8999,\n    badge: 'Bestseller',\n    img: 'assets/golden-silk-saree-clean.jpg'"
)
# id: 12
html = html.replace(
    "id: 12,\n    name: 'Pure Chanderi Cotton Silk Drape',\n    category: 'Cotton',\n    fabric: 'Handloom Cotton',\n    color: 'Indigo Blue',\n    price: 2199,\n    old: 2699,\n    badge: 'Artisan Pick',\n    img: 'assets/cotton.jpg'",
    "id: 12,\n    name: 'Pure Chanderi Cotton Silk Drape',\n    category: 'Cotton',\n    fabric: 'Handloom Cotton',\n    color: 'Indigo Blue',\n    price: 2199,\n    old: 2699,\n    badge: 'Artisan Pick',\n    img: 'assets/handloom-weaving.jpg'"
)

# 8. Update localStorage caching to sf_products_tw_v3 so client browsers don't use stale cached products
html = html.replace("sf_products_tw", "sf_products_tw_v3")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Successfully updated index.html with new high-resolution saree images!")

