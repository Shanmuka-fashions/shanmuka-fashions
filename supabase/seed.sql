-- ==============================================================================
-- SHANMUKA FASHIONS — SEED DATA FOR SUPABASE
-- Handloom Sarees, Customers, Suppliers & Inventory
-- ==============================================================================

INSERT INTO products (id, sku, barcode, name, category, collection, fabric, color, material, weave, pattern, occasion, saree_length, blouse_piece, purchase_cost, price, old_price, stock_qty, low_stock_threshold, badge, status, is_featured, img, images, rating, reviews_count, description)
VALUES (
  '1', 'SF-KNC-001', '8901001001', 'Royal Kanchipuram Pure Silk Saree', 'Kanchipuram', 'Heirloom Temple Collection', 'Pure Silk', 'Burgundy & Antique Gold', 'Pure Mulberry Silk (Silk Mark Certified)', 'Traditional Korvai Handloom', 'Temple Border with Mayil & Floral Jaal', 'Bridal & Wedding', '6.3 Metres (incl. 0.8m Blouse)', 'Included (Unstitched Pure Silk)', 3800, 6499, 7999, 8, 2, 'Bestseller', 'Published', true, 'assets/kanchipuram-loom.jpg', '["assets/kanchipuram-loom.jpg"]'::jsonb, 4.9, 38, 'An exquisite handloom Kanchipuram pure silk saree in royal burgundy adorned with heavy gold zari temple borders and an opulent brocade pallu. Ideal for weddings and sacred festivities.'
) ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock_qty = EXCLUDED.stock_qty;

INSERT INTO products (id, sku, barcode, name, category, collection, fabric, color, material, weave, pattern, occasion, saree_length, blouse_piece, purchase_cost, price, old_price, stock_qty, low_stock_threshold, badge, status, is_featured, img, images, rating, reviews_count, description)
VALUES (
  '2', 'SF-BNR-002', '8901001002', 'Banarasi Heritage Meenakari Weave', 'Banarasi', 'Royal Kadwa Edit', 'Katan Silk', 'Deep Plum & Zari', '100% Katan Silk with Fine Resham', 'Traditional Banarasi Kadwa Handloom', 'Intricate Meenakari Floral Jaal', 'Bridal & Wedding', '6.3 Metres (incl. 0.8m Blouse)', 'Included (Katan Silk Matching)', 4900, 8499, 10499, 5, 2, 'Bestseller', 'Published', true, 'assets/golden-silk-saree-clean.jpg', '["assets/golden-silk-saree-clean.jpg"]'::jsonb, 4.8, 29, 'Handcrafted in Varanasi by 4th-generation master weavers. Featuring authentic Kadwa bootis woven with pure gold zari and fine multi-colored silk threads.'
) ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock_qty = EXCLUDED.stock_qty;

INSERT INTO products (id, sku, barcode, name, category, collection, fabric, color, material, weave, pattern, occasion, saree_length, blouse_piece, purchase_cost, price, old_price, stock_qty, low_stock_threshold, badge, status, is_featured, img, images, rating, reviews_count, description)
VALUES (
  '3', 'SF-ORG-003', '8901001003', 'Floral Organza Tissue Saree', 'Organza', 'Celebration Pastels', 'Organza', 'Champagne Gold', 'Fine Sheer Silk Organza with Tissue Sheen', 'Powerloom Hand-Finished Drape', 'Hand-Painted Botanical Florals with Cutwork Zari', 'Party Wear', '6.3 Metres (incl. 0.8m Blouse)', 'Included (Raw Silk Contrast Blouse)', 2400, 4299, 5499, 6, 2, 'New Arrival', 'Published', true, 'assets/raw-silk-yarns.jpg', '["assets/raw-silk-yarns.jpg"]'::jsonb, 4.7, 16, 'Lightweight, translucent organza silk saree drenched in champagne brilliance. Scalloped hand-embroidered cutwork border suited for evening receptions and sangeet.'
) ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock_qty = EXCLUDED.stock_qty;

INSERT INTO products (id, sku, barcode, name, category, collection, fabric, color, material, weave, pattern, occasion, saree_length, blouse_piece, purchase_cost, price, old_price, stock_qty, low_stock_threshold, badge, status, is_featured, img, images, rating, reviews_count, description)
VALUES (
  '4', 'SF-SLK-004', '8901001004', 'Festive Peacock Zari Silk Saree', 'Silk', 'Temple Heritage', 'Pure Silk', 'Emerald & Gold', 'Pure Mulberry Silk', 'Dharmavaram Traditional Handloom', 'Peacock & Paisley Motifs', 'Festive Celebration', '6.3 Metres (incl. 0.8m Blouse)', 'Included (Brocade Blouse)', 3200, 5499, 6799, 4, 2, 'Trending', 'Published', true, 'assets/handloom-weaving.jpg', '["assets/handloom-weaving.jpg"]'::jsonb, 4.9, 22, 'Rich emerald green pure silk saree embellished with auspicious Mayil (peacock) bootas and contrasting gold zari border woven in Dharmavaram.'
) ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock_qty = EXCLUDED.stock_qty;

INSERT INTO products (id, sku, barcode, name, category, collection, fabric, color, material, weave, pattern, occasion, saree_length, blouse_piece, purchase_cost, price, old_price, stock_qty, low_stock_threshold, badge, status, is_featured, img, images, rating, reviews_count, description)
VALUES (
  '5', 'SF-COT-005', '8901001005', 'Everyday Handloom Cotton Grace', 'Cotton', 'Summer Looms', 'Handloom Cotton', 'Natural Sand & Maroon', '100% Combed Organic Cotton', 'Mangalagiri Pit Loom Weave', 'Nizam Zari Border', 'Everyday Grace', '6.2 Metres (incl. 0.8m Blouse)', 'Included (Striped Cotton)', 1100, 2199, 2799, 12, 3, 'Essential', 'Published', false, 'assets/handloom-weaving.jpg', '["assets/handloom-weaving.jpg"]'::jsonb, 4.6, 14, 'Breathable, feather-soft Mangalagiri handloom cotton with signature Nizam golden temple border. Comfortable all-day elegance for boutique and office wear.'
) ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock_qty = EXCLUDED.stock_qty;

INSERT INTO products (id, sku, barcode, name, category, collection, fabric, color, material, weave, pattern, occasion, saree_length, blouse_piece, purchase_cost, price, old_price, stock_qty, low_stock_threshold, badge, status, is_featured, img, images, rating, reviews_count, description)
VALUES (
  '6', 'SF-KNC-006', '8901001006', 'Bridal Kanchipuram Gold Brocade', 'Kanchipuram', 'Royal Muhurtham', 'Pure Silk', 'Crimson Red & Tested Zari', 'Pure Mulberry Silk with Tested Zari', 'Heavy 3-Ply Interlocking Korvai', 'Annapakshi & Floral Jaal Brocade', 'Bridal & Wedding', '6.3 Metres (incl. 0.8m Blouse)', 'Included (Heavy Gold Brocade)', 7200, 11999, 14999, 3, 2, 'Heirloom', 'Published', true, 'assets/kanchipuram-loom.jpg', '["assets/kanchipuram-loom.jpg"]'::jsonb, 5, 45, 'The pinnacle of South Indian bridal heritage. 3-ply pure silk handwoven with authentic gold zari depicting mythological Annapakshi motifs for sacred wedding rituals.'
) ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock_qty = EXCLUDED.stock_qty;

INSERT INTO products (id, sku, barcode, name, category, collection, fabric, color, material, weave, pattern, occasion, saree_length, blouse_piece, purchase_cost, price, old_price, stock_qty, low_stock_threshold, badge, status, is_featured, img, images, rating, reviews_count, description)
VALUES (
  '7', 'SF-BNR-007', '8901001007', 'Banarasi Celebration Silk Saree', 'Banarasi', 'Royal Kadwa Edit', 'Katan Silk', 'Rani Pink & Gold', 'Katan Silk with Pure Silver & Gold Dipped Zari', 'Banarasi Jangla Weave', 'All-Over Jangla Floral Scroll', 'Bridal & Wedding', '6.3 Metres (incl. 0.8m Blouse)', 'Included (Plain Silk with Zari Border)', 4400, 7799, 9499, 4, 2, 'New Arrival', 'Published', false, 'assets/golden-silk-saree-clean.jpg', '["assets/golden-silk-saree-clean.jpg"]'::jsonb, 4.8, 19, 'Vibrant Rani pink Katan silk saree woven in the historic Jangla technique, producing a lush tapestry of gold floral creepers across the entire body.'
) ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock_qty = EXCLUDED.stock_qty;

INSERT INTO products (id, sku, barcode, name, category, collection, fabric, color, material, weave, pattern, occasion, saree_length, blouse_piece, purchase_cost, price, old_price, stock_qty, low_stock_threshold, badge, status, is_featured, img, images, rating, reviews_count, description)
VALUES (
  '8', 'SF-COT-008', '8901001008', 'Soft Indigo Handloom Cotton', 'Cotton', 'Summer Looms', 'Handloom Cotton', 'Indigo Blue', '100% Natural Dye Handloom Cotton', 'Bengal Jamdani Handloom', 'Geometric Jamdani Booti', 'Everyday Grace', '6.2 Metres (incl. 0.8m Blouse)', 'Included (Indigo Solid)', 950, 1899, 2399, 7, 2, 'Handcrafted', 'Published', false, 'assets/handloom-weaving.jpg', '["assets/handloom-weaving.jpg"]'::jsonb, 4.7, 11, 'Natural indigo dyed handloom cotton with traditional Jamdani motifs hand-inserted on the pit loom. Lightweight and airy for year-round warmth.'
) ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock_qty = EXCLUDED.stock_qty;

INSERT INTO products (id, sku, barcode, name, category, collection, fabric, color, material, weave, pattern, occasion, saree_length, blouse_piece, purchase_cost, price, old_price, stock_qty, low_stock_threshold, badge, status, is_featured, img, images, rating, reviews_count, description)
VALUES (
  '9', 'SF-ORG-009', '8901001009', 'Shimmer Champagne Organza Tissue', 'Organza', 'Celebration Pastels', 'Organza', 'Muted Gold & Rose', 'Silk Tissue Organza', 'Tissue Metallic Weave', 'Subtle Metallic Sheen with Pearl Border', 'Party Wear', '6.3 Metres (incl. 0.8m Blouse)', 'Included (Silk Tissue)', 2900, 4999, 6299, 3, 2, 'Trending', 'Published', false, 'assets/raw-silk-yarns.jpg', '["assets/raw-silk-yarns.jpg"]'::jsonb, 4.8, 15, 'Subtle liquid gold metallic finish woven directly into silk organza yarns. Features a scalloped pearl and sequin embroidered border.'
) ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock_qty = EXCLUDED.stock_qty;

INSERT INTO products (id, sku, barcode, name, category, collection, fabric, color, material, weave, pattern, occasion, saree_length, blouse_piece, purchase_cost, price, old_price, stock_qty, low_stock_threshold, badge, status, is_featured, img, images, rating, reviews_count, description)
VALUES (
  '10', 'SF-SLK-010', '8901001010', 'Traditional Royal Temple Silk', 'Silk', 'Temple Heritage', 'Pure Silk', 'Mustard Gold & Maroon', 'Pure Mulberry Silk', 'Dharmavaram Heavy Handloom', 'Rudraksha & Temple Spire Borders', 'Festive Celebration', '6.3 Metres (incl. 0.8m Blouse)', 'Included (Contrasting Maroon)', 3600, 5999, 7499, 2, 2, 'Limited', 'Published', false, 'assets/kanchipuram-loom.jpg', '["assets/kanchipuram-loom.jpg"]'::jsonb, 4.9, 27, 'Sacred mustard yellow body with auspicious rudraksha motifs paired with a contrast maroon pallu packed with antique gold zari brocade.'
) ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock_qty = EXCLUDED.stock_qty;

INSERT INTO products (id, sku, barcode, name, category, collection, fabric, color, material, weave, pattern, occasion, saree_length, blouse_piece, purchase_cost, price, old_price, stock_qty, low_stock_threshold, badge, status, is_featured, img, images, rating, reviews_count, description)
VALUES (
  '11', 'SF-BNR-011', '8901001011', 'Regal Banarasi Brocade Bridal Edit', 'Banarasi', 'Royal Kadwa Edit', 'Katan Silk', 'Vermilion & Antique Zari', 'Pure Katan Silk with Real Zari Polish', 'Kadwa Brocade Handloom', 'Shikargah Wildlife & Royal Court Motifs', 'Bridal & Wedding', '6.3 Metres (incl. 0.8m Blouse)', 'Included (Heavy Brocade)', 5800, 9999, 12499, 1, 2, 'Masterpiece', 'Published', true, 'assets/golden-silk-saree-clean.jpg', '["assets/golden-silk-saree-clean.jpg"]'::jsonb, 5, 31, 'Exquisite Banarasi Shikargah masterpiece depicting royal hunting motifs and flora handwoven with antique-finished gold zari.'
) ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock_qty = EXCLUDED.stock_qty;

INSERT INTO products (id, sku, barcode, name, category, collection, fabric, color, material, weave, pattern, occasion, saree_length, blouse_piece, purchase_cost, price, old_price, stock_qty, low_stock_threshold, badge, status, is_featured, img, images, rating, reviews_count, description)
VALUES (
  '12', 'SF-COT-012', '8901001012', 'Pure Chanderi Cotton Silk Drape', 'Cotton', 'Summer Looms', 'Handloom Cotton', 'Pistachio Green & Gold', 'Chanderi Silk Cotton Blend', 'Authentic Chanderi Pit Loom', 'Ashrafi (Coin) Booti & Zari Border', 'Festive Celebration', '6.2 Metres (incl. 0.8m Blouse)', 'Included (Chanderi Plain)', 1600, 2899, 3599, 6, 2, 'Handcrafted', 'Published', false, 'assets/handloom-weaving.jpg', '["assets/handloom-weaving.jpg"]'::jsonb, 4.7, 18, 'Lightweight gossamer Chanderi weave blending fine silk and cotton threads. Accented with traditional gold Ashrafi coin motifs.'
) ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock_qty = EXCLUDED.stock_qty;

INSERT INTO products (id, sku, barcode, name, category, collection, fabric, color, material, weave, pattern, occasion, saree_length, blouse_piece, purchase_cost, price, old_price, stock_qty, low_stock_threshold, badge, status, is_featured, img, images, rating, reviews_count, description)
VALUES (
  '13', 'SF-DSG-013', '8901001013', 'Royal Atelier Cutwork Designer Saree', 'Designer', 'Couture Drape', 'Pure Silk', 'Midnight Wine & Champagne Gold', 'Tussar Georgette Silk', 'Artisan Zardozi Hand Embroidery', 'Intricate Floral Cutwork with Pearl Beading', 'Party Wear', '6.3 Metres (incl. 0.8m Blouse)', 'Included (Designer Embroidered Blouse)', 6500, 12499, 15999, 2, 2, 'Couture', 'Published', true, 'assets/hero-model.jpg', '["assets/hero-model.jpg"]'::jsonb, 4.9, 14, 'Contemporary bridal reception glamour. Rich midnight wine pure silk with hand-cut scalloped borders embellished with micro-pearls and zardozi.'
) ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock_qty = EXCLUDED.stock_qty;

INSERT INTO products (id, sku, barcode, name, category, collection, fabric, color, material, weave, pattern, occasion, saree_length, blouse_piece, purchase_cost, price, old_price, stock_qty, low_stock_threshold, badge, status, is_featured, img, images, rating, reviews_count, description)
VALUES (
  '14', 'SF-DSG-014', '8901001014', 'Sapphire Tapestry Designer Saree', 'Designer', 'Couture Drape', 'Pure Silk', 'Sapphire & Silver Zari', 'Crepe Silk Handloom', 'Contemporary Jacquard Tapestry', 'Geometric Chevron & Lotus Borders', 'Party Wear', '6.3 Metres (incl. 0.8m Blouse)', 'Included (Silver Zari Brocade)', 5200, 8999, 11299, 4, 2, 'Trending', 'Published', false, 'assets/raw-silk-yarns.jpg', '["assets/raw-silk-yarns.jpg"]'::jsonb, 4.8, 10, 'Modern drape designed for sophisticated evening celebrations. Fluid silk crepe fabric with architectural silver brocade border.'
) ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock_qty = EXCLUDED.stock_qty;

INSERT INTO customers (id, name, phone, email, street, city, state, pincode, total_orders, total_spent, notes)
VALUES (
  'CUST-101', 'Ananya Ramaswamy', '+91 98401 23456', 'ananya.ramaswamy@gmail.com', 'Plot 42, Poes Garden', 'Chennai', 'Tamil Nadu', '600086', 1, 6824, 'VIP Bridal patron. Loves traditional korvai temple borders.'
) ON CONFLICT (id) DO NOTHING;
INSERT INTO customers (id, name, phone, email, street, city, state, pincode, total_orders, total_spent, notes)
VALUES (
  'CUST-102', 'Lakshmi Rao', '+91 94401 98765', 'lakshmi.rao@yahoo.com', 'Banjara Hills, Road 12', 'Hyderabad', 'Telangana', '500034', 1, 6300, 'Frequent boutique walk-in visitor.'
) ON CONFLICT (id) DO NOTHING;
INSERT INTO customers (id, name, phone, email, street, city, state, pincode, total_orders, total_spent, notes)
VALUES (
  'CUST-103', 'Dr. Radhika Varma', '+91 97011 44556', 'radhika.varma@apollo.org', 'Hitec City, Phase 2', 'Hyderabad', 'Telangana', '500081', 1, 8924, 'Senior consultant. Prefers subtle Kadwa Banarasi silks.'
) ON CONFLICT (id) DO NOTHING;
INSERT INTO customers (id, name, phone, email, street, city, state, pincode, total_orders, total_spent, notes)
VALUES (
  'CUST-104', 'Kavitha Sundaram', '+91 98840 55667', 'kavitha.s@outlook.com', '14, 5th Main, Indiranagar', 'Bangalore', 'Karnataka', '560038', 1, 11549, 'Collector of heirloom silks. Video consultation patron.'
) ON CONFLICT (id) DO NOTHING;
INSERT INTO suppliers (id, name, contact_person, phone, email, city, gstin, materials_supplied, total_purchased, balance_due)
VALUES (
  'SUPP-101', 'Kanchipuram Silk Weavers Co-operative Society', 'Shri K. Sundaram (Master Weaver)', '+91 94432 11223', 'kanchi.weavers.guild@gmail.com', 'Kanchipuram, Tamil Nadu', '33AAACK4421M1Z5', 'Pure Mulberry Silk, Tested Zari Temple Sarees', 76000, 0
) ON CONFLICT (id) DO NOTHING;
INSERT INTO suppliers (id, name, contact_person, phone, email, city, gstin, materials_supplied, total_purchased, balance_due)
VALUES (
  'SUPP-102', 'Varanasi Kadwa Silk Heritage Looms', 'Mohd. Tariq Ansari', '+91 98390 44556', 'tariq.kadwa.banaras@gmail.com', 'Varanasi, Uttar Pradesh', '09AABPA7788L1Z9', 'Pure Katan Silk, Jangla & Meenakari Sarees', 49000, 5000
) ON CONFLICT (id) DO NOTHING;
INSERT INTO suppliers (id, name, contact_person, phone, email, city, gstin, materials_supplied, total_purchased, balance_due)
VALUES (
  'SUPP-103', 'Dharmavaram Traditional Silk Cluster', 'V. Ramachandran', '+91 98480 33221', 'dharmavaram.silks.vr@gmail.com', 'Dharmavaram, Andhra Pradesh', '37AAACD9911N1Z2', 'Peacock & Temple Border Festive Silks', 35000, 0
) ON CONFLICT (id) DO NOTHING;
INSERT INTO suppliers (id, name, contact_person, phone, email, city, gstin, materials_supplied, total_purchased, balance_due)
VALUES (
  'SUPP-104', 'Chanderi Artisan Handlooms', 'Smt. Kamla Bai', '+91 94250 88990', 'chanderi.handlooms.kb@gmail.com', 'Chanderi, Madhya Pradesh', '23AAACC3344P1Z3', 'Silk Cotton & Tissue Drapes', 18000, 0
) ON CONFLICT (id) DO NOTHING;
