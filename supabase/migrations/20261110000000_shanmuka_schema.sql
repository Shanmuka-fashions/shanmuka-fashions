-- ==============================================================================
-- SHANMUKA FASHIONS — SUPABASE POSTGRESQL PRODUCTION DATABASE SCHEMA
-- Elegance Woven Through Generations
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STORE SETTINGS
CREATE TABLE IF NOT EXISTS store_settings (
    id TEXT PRIMARY KEY DEFAULT 'primary',
    store_name TEXT NOT NULL DEFAULT 'Shanmuka Fashions',
    tagline TEXT DEFAULT 'Sarees & More — Elegance Woven Through Generations',
    owner_name TEXT DEFAULT 'Bhanu Prakash Reddy',
    phone TEXT DEFAULT '+91 95421 56929',
    whatsapp TEXT DEFAULT '9542156929',
    email TEXT DEFAULT 'concierge@shanmukafashions.com',
    showroom_address TEXT DEFAULT 'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
    showroom_hours TEXT DEFAULT 'Monday – Sunday: 10:00 AM – 9:00 PM (IST)',
    currency TEXT DEFAULT 'INR',
    currency_symbol TEXT DEFAULT '₹',
    gst_registered BOOLEAN DEFAULT TRUE,
    gstin TEXT DEFAULT '36AAECS9843K1ZN',
    default_gst_percent NUMERIC(5,2) DEFAULT 5.00,
    free_shipping_threshold NUMERIC(10,2) DEFAULT 15000.00,
    standard_shipping_charge NUMERIC(10,2) DEFAULT 350.00,
    invoice_prefix TEXT DEFAULT 'SF-INV-2026-',
    pos_prefix TEXT DEFAULT 'POS-2026-',
    receipt_header TEXT,
    receipt_footer TEXT,
    low_stock_threshold INTEGER DEFAULT 2,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CMS CONTENT
CREATE TABLE IF NOT EXISTS cms_content (
    id TEXT PRIMARY KEY DEFAULT 'primary',
    announcement_bar TEXT DEFAULT 'COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹15,000 • SHANMUKA FASHIONS • WHATSAPP CONCIERGE',
    hero_eyebrow TEXT DEFAULT 'Traditional Indian Saree Heritage',
    hero_heading TEXT DEFAULT 'Heritage Weaves for the Modern Woman',
    hero_tagline TEXT DEFAULT 'Elegance Woven Through Generations.',
    hero_narrative TEXT DEFAULT 'Discover the timeless grandeur of certified pure handloom silks, authentic temple borders, and heirloom brocades hand-crafted by multi-generational master weavers.',
    hero_video TEXT DEFAULT 'gemini_generated_video_e8550a2b.mp4',
    story_heading TEXT DEFAULT 'Elegance Woven Through Generations',
    story_narrative_1 TEXT DEFAULT 'The Indian handloom saree is a living testament to thousands of years of textile artistry. At Shanmuka Fashions, we celebrate the generational wisdom of master artisan communities across Kanchipuram, Varanasi, Dharmavaram, and Chanderi.',
    story_narrative_2 TEXT DEFAULT 'Each drape represents painstaking devotion—from the spinning of pure mulberry silk yarns to the hand-setting of Jacquard punch cards and tested gold zari borders. We honor these timeless weaving traditions by curating authentic heirloom sarees for celebrations that last a lifetime.',
    whatsapp_number TEXT DEFAULT '9542156929',
    phone_display TEXT DEFAULT '+91 95421 56929',
    showroom_address TEXT DEFAULT 'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTS (Saree Catalog)
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    collection TEXT DEFAULT 'Masterloom Heritage',
    fabric TEXT NOT NULL,
    color TEXT NOT NULL,
    material TEXT DEFAULT 'Pure Silk',
    weave TEXT DEFAULT 'Handloom Jacquard',
    pattern TEXT DEFAULT 'Traditional Butta & Korvai',
    occasion TEXT DEFAULT 'Bridal & Festive',
    saree_length TEXT DEFAULT '6.3 Meters (incl. blouse)',
    blouse_piece TEXT DEFAULT 'Included (0.8m running unstitched)',
    purchase_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    price NUMERIC(10,2) NOT NULL,
    old_price NUMERIC(10,2),
    stock_qty INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 2,
    badge TEXT,
    status TEXT NOT NULL DEFAULT 'published', -- 'published', 'draft', 'archived'
    is_featured BOOLEAN DEFAULT FALSE,
    img TEXT NOT NULL,
    images JSONB DEFAULT '[]'::jsonb,
    video TEXT,
    rating NUMERIC(3,2) DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INVENTORY LEDGER (Audit Trail of every stock movement)
CREATE TABLE IF NOT EXISTS inventory_ledger (
    id TEXT PRIMARY KEY,
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'SALE_ONLINE', 'SALE_POS', 'PURCHASE_RECEIPT', 'MANUAL_CORRECTION', 'DAMAGE_WRITE_OFF', 'RETURN'
    prev_qty INTEGER NOT NULL,
    change_qty INTEGER NOT NULL,
    new_qty INTEGER NOT NULL,
    reason TEXT NOT NULL,
    reference_id TEXT, -- Order ID, PO number, or adjustment memo
    channel TEXT NOT NULL DEFAULT 'SYSTEM', -- 'ONLINE', 'POS_SHOWROOM', 'PURCHASE', 'MANUAL'
    admin_user TEXT DEFAULT 'Bhanu Prakash Reddy',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    street TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    total_orders INTEGER DEFAULT 0,
    total_spent NUMERIC(12,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    city TEXT,
    gstin TEXT,
    materials_supplied TEXT,
    total_purchased NUMERIC(12,2) DEFAULT 0.00,
    balance_due NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PURCHASES (Purchase Orders & Weaver Inward Bills)
CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    po_number TEXT UNIQUE NOT NULL,
    supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT NOT NULL,
    date DATE NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC(12,2) NOT NULL,
    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Received', -- 'Received', 'Partial', 'Pending'
    payment_status TEXT NOT NULL DEFAULT 'Paid', -- 'Paid', 'Partial', 'Unpaid'
    invoice_ref TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ORDERS (Omnichannel: Web + POS Showroom)
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    channel TEXT NOT NULL DEFAULT 'ONLINE', -- 'ONLINE' or 'POS'
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) DEFAULT 0.00,
    coupon_code TEXT,
    tax_rate NUMERIC(5,2) DEFAULT 5.00,
    tax_amount NUMERIC(12,2) DEFAULT 0.00,
    shipping_charges NUMERIC(10,2) DEFAULT 0.00,
    total NUMERIC(12,2) NOT NULL,
    payment_method TEXT NOT NULL, -- 'UPI', 'CARD', 'CASH', 'NETBANKING', 'COD'
    payment_status TEXT NOT NULL DEFAULT 'Completed', -- 'Completed', 'Pending', 'Failed'
    payment_reference TEXT,
    order_status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Processing', 'Dispatched', 'Delivered', 'Cancelled'
    delivery_address JSONB,
    courier TEXT,
    tracking_number TEXT,
    order_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. EXPENSES (Shop & Studio Operating Expenses)
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL, -- 'Rent', 'Electricity', 'Packaging', 'Marketing', 'Logistics', 'Staff', 'Maintenance', 'Miscellaneous'
    amount NUMERIC(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'UPI',
    date DATE NOT NULL,
    description TEXT NOT NULL,
    receipt_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. COUPONS
CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'flat'
    value NUMERIC(10,2) NOT NULL,
    min_order NUMERIC(10,2) DEFAULT 0.00,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    valid_from DATE,
    valid_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ENQUIRIES (WhatsApp & Web Concierge Enquiries)
CREATE TABLE IF NOT EXISTS enquiries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    saree_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    source TEXT DEFAULT 'WEBSITE_PDP',
    status TEXT DEFAULT 'New', -- 'New', 'Contacted', 'Closed'
    date TIMESTAMPTZ DEFAULT NOW()
);

-- 12. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT NOT NULL,
    status TEXT DEFAULT 'Approved', -- 'Approved', 'Pending', 'Rejected'
    date TIMESTAMPTZ DEFAULT NOW()
);

-- 13. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    details TEXT,
    "user" TEXT DEFAULT 'Bhanu Prakash Reddy'
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory_ledger(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_timestamp ON inventory_ledger(timestamp);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public can read store settings and CMS content
CREATE POLICY "Public read store_settings" ON store_settings FOR SELECT USING (true);
CREATE POLICY "Public read cms_content" ON cms_content FOR SELECT USING (true);

-- Public can read active published products
CREATE POLICY "Public read products" ON products FOR SELECT USING (status = 'published');

-- Public can read active coupons
CREATE POLICY "Public read coupons" ON coupons FOR SELECT USING (is_active = true);

-- Public can read approved reviews
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (status = 'Approved');

-- Public can insert enquiries and reviews
CREATE POLICY "Public insert enquiries" ON enquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert reviews" ON reviews FOR INSERT WITH CHECK (true);

-- Public can create online customer orders
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);

-- Full access for authenticated users / service role on all tables
CREATE POLICY "Full access store_settings" ON store_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access cms_content" ON cms_content FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access products" ON products FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access inventory_ledger" ON inventory_ledger FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access customers" ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access suppliers" ON suppliers FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access purchases" ON purchases FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access orders" ON orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access expenses" ON expenses FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access coupons" ON coupons FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access enquiries" ON enquiries FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access reviews" ON reviews FOR ALL TO authenticated USING (true);
CREATE POLICY "Full access audit_logs" ON audit_logs FOR ALL TO authenticated USING (true);

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================
INSERT INTO store_settings (id, store_name, tagline, owner_name, phone, whatsapp, email, showroom_address)
VALUES (
    'primary',
    'Shanmuka Fashions',
    'Sarees & More — Elegance Woven Through Generations',
    'Bhanu Prakash Reddy',
    '+91 95421 56929',
    '9542156929',
    'concierge@shanmukafashions.com',
    'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033'
)
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

INSERT INTO cms_content (id, announcement_bar, hero_heading, hero_narrative, whatsapp_number)
VALUES (
    'primary',
    'COMPLIMENTARY EXPRESS SHIPPING ON ORDERS ABOVE ₹15,000 • SHANMUKA FASHIONS • WHATSAPP CONCIERGE',
    'Heritage Weaves for the Modern Woman',
    'Discover the timeless grandeur of certified pure handloom silks, authentic temple borders, and heirloom brocades hand-crafted by multi-generational master weavers.',
    '9542156929'
)
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

INSERT INTO coupons (id, code, type, value, min_order, usage_limit, usage_count, is_active)
VALUES
    ('c1', 'HERITAGE10', 'percentage', 10, 15000, 100, 12, true),
    ('c2', 'FESTIVE2500', 'flat', 2500, 30000, 50, 8, true),
    ('c3', 'BRIDALROYAL', 'percentage', 15, 50000, 25, 4, true)
ON CONFLICT (id) DO NOTHING;
