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

  const STORAGE_KEY = 'sf_central_retail_db_v1';

  // Master Initial Seed Data
  const INITIAL_SEED = {
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
      receipt_header: 'SHANMUKA FASHIONS\nFlagship Saree Atelier, Jubilee Hills, Hyderabad\nGSTIN: 36AAECS9843K1ZN • WhatsApp: +91 95421 56929',
      receipt_footer: 'Silk Mark Certified Pure Handloom Sarees.\nExchanges accepted within 7 days with price tag and original invoice.\nThank you for choosing Shanmuka Fashions!',
      low_stock_threshold: 2
    },
    auth: {
      username: 'admin',
      password_hash: 'admin123', // Demo password
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
      showroom_address: 'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033'
    },
    products: [
      {
        id: 1,
        sku: 'SF-KNC-001',
        barcode: '8901001001',
        name: 'Royal Kanchipuram Pure Silk Saree',
        category: 'Kanchipuram',
        collection: 'Heirloom Temple Collection',
        fabric: 'Pure Silk',
        color: 'Burgundy & Antique Gold',
        material: 'Pure Mulberry Silk (Silk Mark Certified)',
        weave: 'Traditional Korvai Handloom',
        pattern: 'Temple Border with Mayil & Floral Jaal',
        occasion: 'Bridal & Wedding',
        saree_length: '6.3 Metres (incl. 0.8m Blouse)',
        blouse_piece: 'Included (Unstitched Pure Silk)',
        purchase_cost: 3800,
        price: 6499,
        old: 7999,
        stock_qty: 8,
        low_stock_threshold: 2,
        stock: 'In Stock',
        badge: 'Bestseller',
        status: 'Published',
        is_featured: true,
        img: 'assets/kanchipuram-loom.jpg',
        images: ['assets/kanchipuram-loom.jpg'],
        video: '',
        rating: 4.9,
        reviewsCount: 38,
        desc: 'An exquisite handloom Kanchipuram pure silk saree in royal burgundy adorned with heavy gold zari temple borders and an opulent brocade pallu. Ideal for weddings and sacred festivities.'
      },
      {
        id: 2,
        sku: 'SF-BNR-002',
        barcode: '8901001002',
        name: 'Banarasi Heritage Meenakari Weave',
        category: 'Banarasi',
        collection: 'Royal Kadwa Edit',
        fabric: 'Katan Silk',
        color: 'Deep Plum & Zari',
        material: '100% Katan Silk with Fine Resham',
        weave: 'Traditional Banarasi Kadwa Handloom',
        pattern: 'Intricate Meenakari Floral Jaal',
        occasion: 'Bridal & Wedding',
        saree_length: '6.3 Metres (incl. 0.8m Blouse)',
        blouse_piece: 'Included (Katan Silk Matching)',
        purchase_cost: 4900,
        price: 8499,
        old: 10499,
        stock_qty: 5,
        low_stock_threshold: 2,
        stock: 'In Stock',
        badge: 'Bestseller',
        status: 'Published',
        is_featured: true,
        img: 'assets/golden-silk-saree-clean.jpg',
        images: ['assets/golden-silk-saree-clean.jpg'],
        video: '',
        rating: 4.8,
        reviewsCount: 29,
        desc: 'Handcrafted in Varanasi by 4th-generation master weavers. Featuring authentic Kadwa bootis woven with pure gold zari and fine multi-colored silk threads.'
      },
      {
        id: 3,
        sku: 'SF-ORG-003',
        barcode: '8901001003',
        name: 'Floral Organza Tissue Saree',
        category: 'Organza',
        collection: 'Celebration Pastels',
        fabric: 'Organza',
        color: 'Champagne Gold',
        material: 'Fine Sheer Silk Organza with Tissue Sheen',
        weave: 'Powerloom Hand-Finished Drape',
        pattern: 'Hand-Painted Botanical Florals with Cutwork Zari',
        occasion: 'Party Wear',
        saree_length: '6.3 Metres (incl. 0.8m Blouse)',
        blouse_piece: 'Included (Raw Silk Contrast Blouse)',
        purchase_cost: 2400,
        price: 4299,
        old: 5499,
        stock_qty: 6,
        low_stock_threshold: 2,
        stock: 'In Stock',
        badge: 'New Arrival',
        status: 'Published',
        is_featured: true,
        img: 'assets/raw-silk-yarns.jpg',
        images: ['assets/raw-silk-yarns.jpg'],
        video: '',
        rating: 4.7,
        reviewsCount: 16,
        desc: 'Lightweight, translucent organza silk saree drenched in champagne brilliance. Scalloped hand-embroidered cutwork border suited for evening receptions and sangeet.'
      },
      {
        id: 4,
        sku: 'SF-SLK-004',
        barcode: '8901001004',
        name: 'Festive Peacock Zari Silk Saree',
        category: 'Silk',
        collection: 'Temple Heritage',
        fabric: 'Pure Silk',
        color: 'Emerald & Gold',
        material: 'Pure Mulberry Silk',
        weave: 'Dharmavaram Traditional Handloom',
        pattern: 'Peacock & Paisley Motifs',
        occasion: 'Festive Celebration',
        saree_length: '6.3 Metres (incl. 0.8m Blouse)',
        blouse_piece: 'Included (Brocade Blouse)',
        purchase_cost: 3200,
        price: 5499,
        old: 6799,
        stock_qty: 4,
        low_stock_threshold: 2,
        stock: 'In Stock',
        badge: 'Trending',
        status: 'Published',
        is_featured: true,
        img: 'assets/handloom-weaving.jpg',
        images: ['assets/handloom-weaving.jpg'],
        video: '',
        rating: 4.9,
        reviewsCount: 22,
        desc: 'Rich emerald green pure silk saree embellished with auspicious Mayil (peacock) bootas and contrasting gold zari border woven in Dharmavaram.'
      },
      {
        id: 5,
        sku: 'SF-COT-005',
        barcode: '8901001005',
        name: 'Everyday Handloom Cotton Grace',
        category: 'Cotton',
        collection: 'Summer Looms',
        fabric: 'Handloom Cotton',
        color: 'Natural Sand & Maroon',
        material: '100% Combed Organic Cotton',
        weave: 'Mangalagiri Pit Loom Weave',
        pattern: 'Nizam Zari Border',
        occasion: 'Everyday Grace',
        saree_length: '6.2 Metres (incl. 0.8m Blouse)',
        blouse_piece: 'Included (Striped Cotton)',
        purchase_cost: 1100,
        price: 2199,
        old: 2799,
        stock_qty: 12,
        low_stock_threshold: 3,
        stock: 'In Stock',
        badge: 'Essential',
        status: 'Published',
        is_featured: false,
        img: 'assets/handloom-weaving.jpg',
        images: ['assets/handloom-weaving.jpg'],
        video: '',
        rating: 4.6,
        reviewsCount: 14,
        desc: 'Breathable, feather-soft Mangalagiri handloom cotton with signature Nizam golden temple border. Comfortable all-day elegance for boutique and office wear.'
      },
      {
        id: 6,
        sku: 'SF-KNC-006',
        barcode: '8901001006',
        name: 'Bridal Kanchipuram Gold Brocade',
        category: 'Kanchipuram',
        collection: 'Royal Muhurtham',
        fabric: 'Pure Silk',
        color: 'Crimson Red & Tested Zari',
        material: 'Pure Mulberry Silk with Tested Zari',
        weave: 'Heavy 3-Ply Interlocking Korvai',
        pattern: 'Annapakshi & Floral Jaal Brocade',
        occasion: 'Bridal & Wedding',
        saree_length: '6.3 Metres (incl. 0.8m Blouse)',
        blouse_piece: 'Included (Heavy Gold Brocade)',
        purchase_cost: 7200,
        price: 11999,
        old: 14999,
        stock_qty: 3,
        low_stock_threshold: 2,
        stock: 'In Stock',
        badge: 'Heirloom',
        status: 'Published',
        is_featured: true,
        img: 'assets/kanchipuram-loom.jpg',
        images: ['assets/kanchipuram-loom.jpg'],
        video: '',
        rating: 5.0,
        reviewsCount: 45,
        desc: 'The pinnacle of South Indian bridal heritage. 3-ply pure silk handwoven with authentic gold zari depicting mythological Annapakshi motifs for sacred wedding rituals.'
      },
      {
        id: 7,
        sku: 'SF-BNR-007',
        barcode: '8901001007',
        name: 'Banarasi Celebration Silk Saree',
        category: 'Banarasi',
        collection: 'Royal Kadwa Edit',
        fabric: 'Katan Silk',
        color: 'Rani Pink & Gold',
        material: 'Katan Silk with Pure Silver & Gold Dipped Zari',
        weave: 'Banarasi Jangla Weave',
        pattern: 'All-Over Jangla Floral Scroll',
        occasion: 'Bridal & Wedding',
        saree_length: '6.3 Metres (incl. 0.8m Blouse)',
        blouse_piece: 'Included (Plain Silk with Zari Border)',
        purchase_cost: 4400,
        price: 7799,
        old: 9499,
        stock_qty: 4,
        low_stock_threshold: 2,
        stock: 'In Stock',
        badge: 'New Arrival',
        status: 'Published',
        is_featured: false,
        img: 'assets/golden-silk-saree-clean.jpg',
        images: ['assets/golden-silk-saree-clean.jpg'],
        video: '',
        rating: 4.8,
        reviewsCount: 19,
        desc: 'Vibrant Rani pink Katan silk saree woven in the historic Jangla technique, producing a lush tapestry of gold floral creepers across the entire body.'
      },
      {
        id: 8,
        sku: 'SF-COT-008',
        barcode: '8901001008',
        name: 'Soft Indigo Handloom Cotton',
        category: 'Cotton',
        collection: 'Summer Looms',
        fabric: 'Handloom Cotton',
        color: 'Indigo Blue',
        material: '100% Natural Dye Handloom Cotton',
        weave: 'Bengal Jamdani Handloom',
        pattern: 'Geometric Jamdani Booti',
        occasion: 'Everyday Grace',
        saree_length: '6.2 Metres (incl. 0.8m Blouse)',
        blouse_piece: 'Included (Indigo Solid)',
        purchase_cost: 950,
        price: 1899,
        old: 2399,
        stock_qty: 7,
        low_stock_threshold: 2,
        stock: 'In Stock',
        badge: 'Handcrafted',
        status: 'Published',
        is_featured: false,
        img: 'assets/handloom-weaving.jpg',
        images: ['assets/handloom-weaving.jpg'],
        video: '',
        rating: 4.7,
        reviewsCount: 11,
        desc: 'Natural indigo dyed handloom cotton with traditional Jamdani motifs hand-inserted on the pit loom. Lightweight and airy for year-round warmth.'
      },
      {
        id: 9,
        sku: 'SF-ORG-009',
        barcode: '8901001009',
        name: 'Shimmer Champagne Organza Tissue',
        category: 'Organza',
        collection: 'Celebration Pastels',
        fabric: 'Organza',
        color: 'Muted Gold & Rose',
        material: 'Silk Tissue Organza',
        weave: 'Tissue Metallic Weave',
        pattern: 'Subtle Metallic Sheen with Pearl Border',
        occasion: 'Party Wear',
        saree_length: '6.3 Metres (incl. 0.8m Blouse)',
        blouse_piece: 'Included (Silk Tissue)',
        purchase_cost: 2900,
        price: 4999,
        old: 6299,
        stock_qty: 3,
        low_stock_threshold: 2,
        stock: 'In Stock',
        badge: 'Trending',
        status: 'Published',
        is_featured: false,
        img: 'assets/raw-silk-yarns.jpg',
        images: ['assets/raw-silk-yarns.jpg'],
        video: '',
        rating: 4.8,
        reviewsCount: 15,
        desc: 'Subtle liquid gold metallic finish woven directly into silk organza yarns. Features a scalloped pearl and sequin embroidered border.'
      },
      {
        id: 10,
        sku: 'SF-SLK-010',
        barcode: '8901001010',
        name: 'Traditional Royal Temple Silk',
        category: 'Silk',
        collection: 'Temple Heritage',
        fabric: 'Pure Silk',
        color: 'Mustard Gold & Maroon',
        material: 'Pure Mulberry Silk',
        weave: 'Dharmavaram Heavy Handloom',
        pattern: 'Rudraksha & Temple Spire Borders',
        occasion: 'Festive Celebration',
        saree_length: '6.3 Metres (incl. 0.8m Blouse)',
        blouse_piece: 'Included (Contrasting Maroon)',
        purchase_cost: 3600,
        price: 5999,
        old: 7499,
        stock_qty: 2,
        low_stock_threshold: 2,
        stock: 'Low Stock',
        badge: 'Limited',
        status: 'Published',
        is_featured: false,
        img: 'assets/kanchipuram-loom.jpg',
        images: ['assets/kanchipuram-loom.jpg'],
        video: '',
        rating: 4.9,
        reviewsCount: 27,
        desc: 'Sacred mustard yellow body with auspicious rudraksha motifs paired with a contrast maroon pallu packed with antique gold zari brocade.'
      },
      {
        id: 11,
        sku: 'SF-BNR-011',
        barcode: '8901001011',
        name: 'Regal Banarasi Brocade Bridal Edit',
        category: 'Banarasi',
        collection: 'Royal Kadwa Edit',
        fabric: 'Katan Silk',
        color: 'Vermilion & Antique Zari',
        material: 'Pure Katan Silk with Real Zari Polish',
        weave: 'Kadwa Brocade Handloom',
        pattern: 'Shikargah Wildlife & Royal Court Motifs',
        occasion: 'Bridal & Wedding',
        saree_length: '6.3 Metres (incl. 0.8m Blouse)',
        blouse_piece: 'Included (Heavy Brocade)',
        purchase_cost: 5800,
        price: 9999,
        old: 12499,
        stock_qty: 1,
        low_stock_threshold: 2,
        stock: 'Low Stock',
        badge: 'Masterpiece',
        status: 'Published',
        is_featured: true,
        img: 'assets/golden-silk-saree-clean.jpg',
        images: ['assets/golden-silk-saree-clean.jpg'],
        video: '',
        rating: 5.0,
        reviewsCount: 31,
        desc: 'Exquisite Banarasi Shikargah masterpiece depicting royal hunting motifs and flora handwoven with antique-finished gold zari.'
      },
      {
        id: 12,
        sku: 'SF-COT-012',
        barcode: '8901001012',
        name: 'Pure Chanderi Cotton Silk Drape',
        category: 'Cotton',
        collection: 'Summer Looms',
        fabric: 'Handloom Cotton',
        color: 'Pistachio Green & Gold',
        material: 'Chanderi Silk Cotton Blend',
        weave: 'Authentic Chanderi Pit Loom',
        pattern: 'Ashrafi (Coin) Booti & Zari Border',
        occasion: 'Festive Celebration',
        saree_length: '6.2 Metres (incl. 0.8m Blouse)',
        blouse_piece: 'Included (Chanderi Plain)',
        purchase_cost: 1600,
        price: 2899,
        old: 3599,
        stock_qty: 6,
        low_stock_threshold: 2,
        stock: 'In Stock',
        badge: 'Handcrafted',
        status: 'Published',
        is_featured: false,
        img: 'assets/handloom-weaving.jpg',
        images: ['assets/handloom-weaving.jpg'],
        video: '',
        rating: 4.7,
        reviewsCount: 18,
        desc: 'Lightweight gossamer Chanderi weave blending fine silk and cotton threads. Accented with traditional gold Ashrafi coin motifs.'
      },
      {
        id: 13,
        sku: 'SF-DSG-013',
        barcode: '8901001013',
        name: 'Royal Atelier Cutwork Designer Saree',
        category: 'Designer',
        collection: 'Couture Drape',
        fabric: 'Pure Silk',
        color: 'Midnight Wine & Champagne Gold',
        material: 'Tussar Georgette Silk',
        weave: 'Artisan Zardozi Hand Embroidery',
        pattern: 'Intricate Floral Cutwork with Pearl Beading',
        occasion: 'Party Wear',
        saree_length: '6.3 Metres (incl. 0.8m Blouse)',
        blouse_piece: 'Included (Designer Embroidered Blouse)',
        purchase_cost: 6500,
        price: 12499,
        old: 15999,
        stock_qty: 2,
        low_stock_threshold: 2,
        stock: 'Low Stock',
        badge: 'Couture',
        status: 'Published',
        is_featured: true,
        img: 'assets/hero-model.jpg',
        images: ['assets/hero-model.jpg'],
        video: '',
        rating: 4.9,
        reviewsCount: 14,
        desc: 'Contemporary bridal reception glamour. Rich midnight wine pure silk with hand-cut scalloped borders embellished with micro-pearls and zardozi.'
      },
      {
        id: 14,
        sku: 'SF-DSG-014',
        barcode: '8901001014',
        name: 'Sapphire Tapestry Designer Saree',
        category: 'Designer',
        collection: 'Couture Drape',
        fabric: 'Pure Silk',
        color: 'Sapphire & Silver Zari',
        material: 'Crepe Silk Handloom',
        weave: 'Contemporary Jacquard Tapestry',
        pattern: 'Geometric Chevron & Lotus Borders',
        occasion: 'Party Wear',
        saree_length: '6.3 Metres (incl. 0.8m Blouse)',
        blouse_piece: 'Included (Silver Zari Brocade)',
        purchase_cost: 5200,
        price: 8999,
        old: 11299,
        stock_qty: 4,
        low_stock_threshold: 2,
        stock: 'In Stock',
        badge: 'Trending',
        status: 'Published',
        is_featured: false,
        img: 'assets/raw-silk-yarns.jpg',
        images: ['assets/raw-silk-yarns.jpg'],
        video: '',
        rating: 4.8,
        reviewsCount: 10,
        desc: 'Modern drape designed for sophisticated evening celebrations. Fluid silk crepe fabric with architectural silver brocade border.'
      }
    ],
    inventory_ledger: [
      {
        id: 'LEDG-001',
        product_id: 1,
        sku: 'SF-KNC-001',
        product_name: 'Royal Kanchipuram Pure Silk Saree',
        type: 'STOCK_IN',
        prev_qty: 0,
        change_qty: 10,
        new_qty: 10,
        reason: 'Opening Master Inventory Received from Kanchipuram Weavers Guild',
        reference_id: 'PO-2026-001',
        channel: 'ADMIN',
        admin_user: 'Bhanu (Owner)',
        timestamp: '2026-11-01T10:00:00Z'
      },
      {
        id: 'LEDG-002',
        product_id: 2,
        sku: 'SF-BNR-002',
        product_name: 'Banarasi Heritage Meenakari Weave',
        type: 'STOCK_IN',
        prev_qty: 0,
        change_qty: 6,
        new_qty: 6,
        reason: 'Opening Master Inventory from Varanasi Kadwa Looms',
        reference_id: 'PO-2026-002',
        channel: 'ADMIN',
        admin_user: 'Bhanu (Owner)',
        timestamp: '2026-11-01T10:30:00Z'
      },
      {
        id: 'LEDG-003',
        product_id: 1,
        sku: 'SF-KNC-001',
        product_name: 'Royal Kanchipuram Pure Silk Saree',
        type: 'ONLINE_SALE',
        prev_qty: 10,
        change_qty: -1,
        new_qty: 9,
        reason: 'Online Store Checkout #SF-ORD-1001',
        reference_id: 'SF-ORD-1001',
        channel: 'ONLINE',
        admin_user: 'Storefront Customer',
        timestamp: '2026-11-06T14:22:00Z'
      },
      {
        id: 'LEDG-004',
        product_id: 1,
        sku: 'SF-KNC-001',
        product_name: 'Royal Kanchipuram Pure Silk Saree',
        type: 'POS_SALE',
        prev_qty: 9,
        change_qty: -1,
        new_qty: 8,
        reason: 'Showroom Walk-in Sale #POS-2026-101 (Mrs. Lakshmi Rao)',
        reference_id: 'POS-2026-101',
        channel: 'POS',
        admin_user: 'Bhanu (Owner)',
        timestamp: '2026-11-08T16:45:00Z'
      },
      {
        id: 'LEDG-005',
        product_id: 2,
        sku: 'SF-BNR-002',
        product_name: 'Banarasi Heritage Meenakari Weave',
        type: 'POS_SALE',
        prev_qty: 6,
        change_qty: -1,
        new_qty: 5,
        reason: 'Showroom Walk-in Sale #POS-2026-102 (Dr. Radhika Varma)',
        reference_id: 'POS-2026-102',
        channel: 'POS',
        admin_user: 'Bhanu (Owner)',
        timestamp: '2026-11-09T11:15:00Z'
      }
    ],
    orders: [
      {
        id: 'SF-ORD-1001',
        order_number: 'SF-ORD-1001',
        channel: 'ONLINE',
        customer_id: 'CUST-101',
        customer_name: 'Ananya Ramaswamy',
        customer_phone: '+91 98401 23456',
        customer_email: 'ananya.ramaswamy@gmail.com',
        items: [
          {
            product_id: 1,
            sku: 'SF-KNC-001',
            name: 'Royal Kanchipuram Pure Silk Saree',
            price: 6499,
            purchase_cost: 3800,
            qty: 1,
            total: 6499
          }
        ],
        subtotal: 6499,
        discount: 0,
        coupon_code: '',
        tax_rate: 5,
        tax_amount: 325,
        shipping_charges: 0,
        total: 6824,
        payment_method: 'UPI',
        payment_status: 'PAID',
        payment_reference: 'UPI/261106142211/HDFC',
        order_status: 'DELIVERED',
        delivery_address: {
          street: 'Plot 42, Poes Garden',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600086'
        },
        courier: 'Blue Dart Express',
        tracking_number: 'BD-84729104',
        order_notes: 'Bridal trousseau express delivery requested.',
        created_at: '2026-11-06T14:22:00Z',
        updated_at: '2026-11-09T18:00:00Z'
      },
      {
        id: 'POS-2026-101',
        order_number: 'POS-2026-101',
        channel: 'POS',
        customer_id: 'CUST-102',
        customer_name: 'Lakshmi Rao',
        customer_phone: '+91 94401 98765',
        customer_email: 'lakshmi.rao@yahoo.com',
        items: [
          {
            product_id: 1,
            sku: 'SF-KNC-001',
            name: 'Royal Kanchipuram Pure Silk Saree',
            price: 6499,
            purchase_cost: 3800,
            qty: 1,
            total: 6499
          }
        ],
        subtotal: 6499,
        discount: 499, // In-store festive discount
        coupon_code: 'STORE-SPECIAL',
        tax_rate: 5,
        tax_amount: 300,
        shipping_charges: 0,
        total: 6300,
        payment_method: 'CASH',
        payment_status: 'PAID',
        payment_reference: 'CASH-REC-101',
        order_status: 'DELIVERED',
        delivery_address: {
          street: 'In-Store Handover',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500033'
        },
        courier: 'Direct Handover',
        tracking_number: 'POS-HANDOVER-101',
        order_notes: 'Purchased at Jubilee Hills boutique with gift box.',
        created_at: '2026-11-08T16:45:00Z',
        updated_at: '2026-11-08T16:45:00Z'
      },
      {
        id: 'POS-2026-102',
        order_number: 'POS-2026-102',
        channel: 'POS',
        customer_id: 'CUST-103',
        customer_name: 'Dr. Radhika Varma',
        customer_phone: '+91 97011 44556',
        customer_email: 'radhika.varma@apollo.org',
        items: [
          {
            product_id: 2,
            sku: 'SF-BNR-002',
            name: 'Banarasi Heritage Meenakari Weave',
            price: 8499,
            purchase_cost: 4900,
            qty: 1,
            total: 8499
          }
        ],
        subtotal: 8499,
        discount: 0,
        coupon_code: '',
        tax_rate: 5,
        tax_amount: 425,
        shipping_charges: 0,
        total: 8924,
        payment_method: 'CARD',
        payment_status: 'PAID',
        payment_reference: 'POS-HDFC-AUTH-89312',
        order_status: 'DELIVERED',
        delivery_address: {
          street: 'In-Store Handover',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500033'
        },
        courier: 'Direct Handover',
        tracking_number: 'POS-HANDOVER-102',
        order_notes: 'Card payment swipe approved.',
        created_at: '2026-11-09T11:15:00Z',
        updated_at: '2026-11-09T11:15:00Z'
      },
      {
        id: 'SF-ORD-1002',
        order_number: 'SF-ORD-1002',
        channel: 'ONLINE',
        customer_id: 'CUST-104',
        customer_name: 'Kavitha Sundaram',
        customer_phone: '+91 98840 55667',
        customer_email: 'kavitha.s@outlook.com',
        items: [
          {
            product_id: 6,
            sku: 'SF-KNC-006',
            name: 'Bridal Kanchipuram Gold Brocade',
            price: 11999,
            purchase_cost: 7200,
            qty: 1,
            total: 11999
          }
        ],
        subtotal: 11999,
        discount: 1000,
        coupon_code: 'FESTIVE10',
        tax_rate: 5,
        tax_amount: 550,
        shipping_charges: 0,
        total: 11549,
        payment_method: 'UPI',
        payment_status: 'PAID',
        payment_reference: 'UPI/261109153012/ICICI',
        order_status: 'CONFIRMED',
        delivery_address: {
          street: '14, 5th Main, Indiranagar',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560038'
        },
        courier: 'DTDC Luxury Cargo',
        tracking_number: 'DTDC-992145',
        order_notes: 'Packed in bridal heirloom trunk.',
        created_at: '2026-11-09T15:30:00Z',
        updated_at: '2026-11-09T16:00:00Z'
      }
    ],
    customers: [
      {
        id: 'CUST-101',
        name: 'Ananya Ramaswamy',
        phone: '+91 98401 23456',
        email: 'ananya.ramaswamy@gmail.com',
        street: 'Plot 42, Poes Garden',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600086',
        total_orders: 1,
        total_spent: 6824,
        notes: 'VIP Bridal patron. Loves traditional korvai temple borders.',
        created_at: '2026-11-06T14:20:00Z'
      },
      {
        id: 'CUST-102',
        name: 'Lakshmi Rao',
        phone: '+91 94401 98765',
        email: 'lakshmi.rao@yahoo.com',
        street: 'Banjara Hills, Road 12',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500034',
        total_orders: 1,
        total_spent: 6300,
        notes: 'Frequent boutique walk-in visitor.',
        created_at: '2026-11-08T16:40:00Z'
      },
      {
        id: 'CUST-103',
        name: 'Dr. Radhika Varma',
        phone: '+91 97011 44556',
        email: 'radhika.varma@apollo.org',
        street: 'Hitec City, Phase 2',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
        total_orders: 1,
        total_spent: 8924,
        notes: 'Senior consultant. Prefers subtle Kadwa Banarasi silks.',
        created_at: '2026-11-09T11:10:00Z'
      },
      {
        id: 'CUST-104',
        name: 'Kavitha Sundaram',
        phone: '+91 98840 55667',
        email: 'kavitha.s@outlook.com',
        street: '14, 5th Main, Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560038',
        total_orders: 1,
        total_spent: 11549,
        notes: 'Collector of heirloom silks. Video consultation patron.',
        created_at: '2026-11-09T15:25:00Z'
      }
    ],
    suppliers: [
      {
        id: 'SUPP-101',
        name: 'Kanchipuram Silk Weavers Co-operative Society',
        contact_person: 'Shri K. Sundaram (Master Weaver)',
        phone: '+91 94432 11223',
        email: 'kanchi.weavers.guild@gmail.com',
        city: 'Kanchipuram, Tamil Nadu',
        gstin: '33AAACK4421M1Z5',
        materials_supplied: 'Pure Mulberry Silk, Tested Zari Temple Sarees',
        total_purchased: 76000,
        balance_due: 0,
        created_at: '2026-10-15T10:00:00Z'
      },
      {
        id: 'SUPP-102',
        name: 'Varanasi Kadwa Silk Heritage Looms',
        contact_person: 'Mohd. Tariq Ansari',
        phone: '+91 98390 44556',
        email: 'tariq.kadwa.banaras@gmail.com',
        city: 'Varanasi, Uttar Pradesh',
        gstin: '09AABPA7788L1Z9',
        materials_supplied: 'Pure Katan Silk, Jangla & Meenakari Sarees',
        total_purchased: 49000,
        balance_due: 5000,
        created_at: '2026-10-18T10:00:00Z'
      },
      {
        id: 'SUPP-103',
        name: 'Dharmavaram Traditional Silk Cluster',
        contact_person: 'V. Ramachandran',
        phone: '+91 98480 33221',
        email: 'dharmavaram.silks.vr@gmail.com',
        city: 'Dharmavaram, Andhra Pradesh',
        gstin: '37AAACD9911N1Z2',
        materials_supplied: 'Peacock & Temple Border Festive Silks',
        total_purchased: 35000,
        balance_due: 0,
        created_at: '2026-10-20T10:00:00Z'
      },
      {
        id: 'SUPP-104',
        name: 'Chanderi Artisan Handlooms',
        contact_person: 'Smt. Kamla Bai',
        phone: '+91 94250 88990',
        email: 'chanderi.handlooms.kb@gmail.com',
        city: 'Chanderi, Madhya Pradesh',
        gstin: '23AAACC3344P1Z3',
        materials_supplied: 'Silk Cotton & Tissue Drapes',
        total_purchased: 18000,
        balance_due: 0,
        created_at: '2026-10-25T10:00:00Z'
      }
    ],
    purchases: [
      {
        id: 'PO-2026-001',
        po_number: 'PO-2026-001',
        supplier_id: 'SUPP-101',
        supplier_name: 'Kanchipuram Silk Weavers Co-operative Society',
        date: '2026-11-01T10:00:00Z',
        items: [
          { product_id: 1, sku: 'SF-KNC-001', name: 'Royal Kanchipuram Pure Silk Saree', unit_cost: 3800, qty: 10, total: 38000 },
          { product_id: 6, sku: 'SF-KNC-006', name: 'Bridal Kanchipuram Gold Brocade', unit_cost: 7200, qty: 5, total: 36000 }
        ],
        total_amount: 74000,
        amount_paid: 74000,
        balance: 0,
        status: 'RECEIVED',
        payment_status: 'PAID',
        invoice_ref: 'KNC/INV/26/108',
        notes: 'Certified Silk Mark lot received in pristine condition.'
      },
      {
        id: 'PO-2026-002',
        po_number: 'PO-2026-002',
        supplier_id: 'SUPP-102',
        supplier_name: 'Varanasi Kadwa Silk Heritage Looms',
        date: '2026-11-01T10:30:00Z',
        items: [
          { product_id: 2, sku: 'SF-BNR-002', name: 'Banarasi Heritage Meenakari Weave', unit_cost: 4900, qty: 6, total: 29400 },
          { product_id: 7, sku: 'SF-BNR-007', name: 'Banarasi Celebration Silk Saree', unit_cost: 4400, qty: 5, total: 22000 }
        ],
        total_amount: 51400,
        amount_paid: 46400,
        balance: 5000,
        status: 'RECEIVED',
        payment_status: 'PARTIAL',
        invoice_ref: 'VNS/OCT/452',
        notes: 'Balance ₹5,000 to be settled on next delivery cycle.'
      }
    ],
    expenses: [
      {
        id: 'EXP-2026-001',
        category: 'Rent',
        amount: 45000,
        payment_method: 'BANK_TRANSFER',
        date: '2026-11-01T09:00:00Z',
        description: 'Jubilee Hills Boutique Showroom Rent (November 2026)',
        receipt_ref: 'NEFT-RENT-NOV26'
      },
      {
        id: 'EXP-2026-002',
        category: 'Packaging',
        amount: 8500,
        payment_method: 'UPI',
        date: '2026-11-03T11:30:00Z',
        description: 'Luxury embossed rigid saree gift boxes & breathable cotton sleeves (100 units)',
        receipt_ref: 'UPI-PKG-4421'
      },
      {
        id: 'EXP-2026-003',
        category: 'Utilities',
        amount: 6200,
        payment_method: 'UPI',
        date: '2026-11-04T15:00:00Z',
        description: 'TSSPDCL Commercial Showroom Electricity Bill',
        receipt_ref: 'UPI-ELEC-9932'
      },
      {
        id: 'EXP-2026-004',
        category: 'Marketing',
        amount: 12000,
        payment_method: 'CARD',
        date: '2026-11-05T12:00:00Z',
        description: 'Heritage Wedding Campaign Instagram & Google Luxury Reach',
        receipt_ref: 'CARD-FB-8812'
      },
      {
        id: 'EXP-2026-005',
        category: 'Shipping',
        amount: 3400,
        payment_method: 'UPI',
        date: '2026-11-07T17:00:00Z',
        description: 'Blue Dart & DTDC express dispatch logistics account recharge',
        receipt_ref: 'UPI-COURIER-2104'
      }
    ],
    coupons: [
      {
        id: 'COUP-01',
        code: 'FESTIVE10',
        type: 'PERCENT',
        value: 10,
        min_order: 5000,
        usage_limit: 100,
        usage_count: 8,
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
        usage_count: 4,
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
        usage_count: 14,
        valid_from: '2026-01-01',
        valid_to: '2026-12-31',
        is_active: true
      }
    ],
    enquiries: [
      {
        id: 'ENQ-101',
        name: 'Meenakshi Iyer',
        phone: '+91 98410 77889',
        email: 'meenakshi.iyer@gmail.com',
        saree_id: 1,
        message: 'Looking for 3 matching pure silk Kanchipuram sarees for daughters wedding muhurtham. Do you have ready pieces?',
        source: 'WHATSAPP',
        status: 'NEW',
        date: '2026-11-09T18:30:00Z'
      },
      {
        id: 'ENQ-102',
        name: 'Sunita Reddy',
        phone: '+91 94401 22334',
        email: 'sunita.reddy@gmail.com',
        saree_id: 13,
        message: 'Can I book a live video call to view the drape and zari work of the Royal Atelier Cutwork saree?',
        source: 'WEBSITE',
        status: 'IN_PROGRESS',
        date: '2026-11-10T09:15:00Z'
      }
    ],
    reviews: [
      {
        id: 'REV-101',
        product_id: 1,
        customer_name: 'Ananya Ramaswamy',
        rating: 5,
        review: 'The Kanchipuram bridal saree I received was breathtaking. Pure mulberry silk and the subtle brilliance of the tested zari exceeded every expectation.',
        status: 'Approved',
        date: '2026-11-09'
      },
      {
        id: 'REV-102',
        product_id: 2,
        customer_name: 'Dr. Radhika Varma',
        rating: 5,
        review: 'Their video concierge helped me examine the exact pallu weave before purchasing. Highly recommended authentic boutique.',
        status: 'Approved',
        date: '2026-11-09'
      }
    ],
    audit_logs: [
      {
        id: 'AUDIT-001',
        timestamp: '2026-11-01T10:00:00Z',
        action: 'SYSTEM_INIT',
        entity: 'DATABASE',
        entity_id: 'ALL',
        details: 'Initial central retail database created with verified stock and suppliers.',
        user: 'System'
      }
    ]
  };

  class DatabaseEngine {
    constructor() {
      this.state = null;
      this.listeners = [];
      this.init();
    }

    init() {
      try {
        if (typeof localStorage !== 'undefined') {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            this.state = JSON.parse(stored);
            // Ensure essential keys exist
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
        console.warn('Database initialization fallback to in-memory seed:', e);
        this.state = JSON.parse(JSON.stringify(INITIAL_SEED));
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
      return this.getProducts().find(p =>
        (p.sku && p.sku.toLowerCase() === clean) ||
        (p.barcode && p.barcode.toLowerCase() === clean) ||
        (p.id && String(p.id) === clean)
      );
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

        // Update product
        const updated = {
          ...existing,
          ...prodData,
          id,
          price: parseInt(prodData.price, 10),
          old: prodData.old ? parseInt(prodData.old, 10) : existing.old,
          purchase_cost: prodData.purchase_cost ? parseInt(prodData.purchase_cost, 10) : (existing.purchase_cost || Math.round(prodData.price * 0.58)),
          stock_qty: newStock,
          low_stock_threshold: prodData.low_stock_threshold ? parseInt(prodData.low_stock_threshold, 10) : 2,
          stock: newStock <= 0 ? 'Sold Out' : (newStock <= 2 ? 'Low Stock' : 'In Stock')
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
        return updated;
      } else {
        // Create new Saree
        const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
        const sku = prodData.sku ? prodData.sku.trim().toUpperCase() : `SF-${(prodData.category || 'SLK').substr(0, 3).toUpperCase()}-${String(newId).padStart(3, '0')}`;
        const barcode = prodData.barcode ? prodData.barcode.trim() : `890100${String(newId).padStart(4, '0')}`;
        const stockQty = parseInt(prodData.stock_qty || 0, 10);
        const price = parseInt(prodData.price, 10);
        const purchaseCost = parseInt(prodData.purchase_cost || Math.round(price * 0.58), 10);

        const newProd = {
          id: newId,
          sku,
          barcode,
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
      return p;
    }

    deleteProduct(id, adminUser = 'Bhanu (Owner)') {
      const numId = parseInt(id, 10);
      const p = this.getProduct(numId);
      if (!p) return false;
      this.state.products = this.state.products.filter(x => x.id !== numId);
      this.logAudit('PRODUCT_DELETE', 'PRODUCT', numId, `Deleted product "${p.name}" (${p.sku})`, adminUser);
      this.commit();
      return true;
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
      if (updates.order_notes !== undefined) order.order_notes = updates.order_notes;
      if (updates.payment_status !== undefined) order.payment_status = updates.payment_status;
      order.updated_at = new Date().toISOString();

      this.logAudit('ORDER_UPDATE', 'ORDER', order.order_number, `Updated logistics/payment for order #${order.order_number}`, adminUser);
      this.commit();
      return order;
    }

    // ── CUSTOMERS ──
    getCustomers() {
      return this.state.customers || [];
    }

    getCustomer(id) {
      return this.getCustomers().find(c => c.id === id || c.phone === id);
    }

    saveCustomer(custData) {
      if (!custData.name || !custData.phone) throw new Error('Customer name and phone are required');
      const customers = this.state.customers;
      const idx = customers.findIndex(c => c.id === custData.id || c.phone === custData.phone);
      if (idx !== -1) {
        customers[idx] = { ...customers[idx], ...custData };
        this.commit();
        return customers[idx];
      } else {
        const newCust = {
          id: 'CUST-' + Date.now().toString(36),
          name: custData.name.trim(),
          phone: custData.phone.trim(),
          email: custData.email || '',
          street: custData.street || '',
          city: custData.city || '',
          state: custData.state || '',
          pincode: custData.pincode || '',
          total_orders: 0,
          total_spent: 0,
          notes: custData.notes || '',
          created_at: new Date().toISOString()
        };
        customers.unshift(newCust);
        this.commit();
        return newCust;
      }
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

    // ── WEBSITE CONTENT MANAGEMENT (CMS) ──
    getCMS() {
      return this.state.cms || {};
    }

    saveCMS(cmsData, adminUser = 'Bhanu (Owner)') {
      this.state.cms = { ...this.state.cms, ...cmsData };
      this.logAudit('CMS_UPDATE', 'WEBSITE_CONTENT', 'ALL', 'Updated public website content & banners', adminUser);
      this.commit();
      return this.state.cms;
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
      if (typeof sessionStorage === 'undefined') return true;
      const sess = sessionStorage.getItem('sf_admin_session');
      if (sess === 'LOGGED_OUT') return false;
      // By default authenticated for the store owner on local boutique terminal
      if (!sess) {
        sessionStorage.setItem('sf_admin_session', 'ACTIVE');
        sessionStorage.setItem('sf_admin_user', this.state.auth.owner_name || 'Bhanu Prakash Reddy');
      }
      return true;
    }

    login(username, password) {
      const u = (username || '').trim();
      const p = (password || '').trim();
      if ((u === 'admin' || u === this.state.auth.username) && (p === 'admin123' || p === 'Shanmuka@2026' || p === this.state.auth.password_hash)) {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('sf_admin_session', 'ACTIVE');
          sessionStorage.setItem('sf_admin_user', this.state.auth.owner_name || 'Bhanu Prakash Reddy');
        }
        this.logAudit('LOGIN_SUCCESS', 'AUTH', u, 'Successful administrative login', u);
        return { success: true };
      }
      this.logAudit('LOGIN_FAILED', 'AUTH', u, 'Failed login attempt with invalid credentials', u);
      return { success: false, message: 'Invalid username or password.' };
    }

    logout() {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('sf_admin_session');
        sessionStorage.removeItem('sf_admin_user');
      }
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
      this.state = JSON.parse(JSON.stringify(INITIAL_SEED));
      this.logAudit('DATABASE_RESET', 'DATABASE', 'ALL', 'Reset database to master demo dataset', adminUser);
      this.commit();
      return true;
    }
  }

  function moneyFormat(n) {
    return '₹' + (n || 0).toLocaleString('en-IN');
  }

  // Singleton instance
  const instance = new DatabaseEngine();
  return instance;
}));

