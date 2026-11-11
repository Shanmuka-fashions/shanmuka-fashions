-- ==============================================================================
-- SHANMUKA FASHIONS: FIX ROW-LEVEL SECURITY (RLS) POLICIES FOR ATELIER ADMIN
-- Migration: 20261110000004_fix_rls_policies.sql
-- Enables seamless CRUD for Products, Inventory Ledger, Orders, and Settings
-- ==============================================================================

-- 1. PRODUCTS TABLE
DROP POLICY IF EXISTS "Public read products" ON products;
DROP POLICY IF EXISTS "Full access products" ON products;
DROP POLICY IF EXISTS "Public full access products" ON products;

CREATE POLICY "Public full access products"
    ON products FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 2. INVENTORY LEDGER TABLE
DROP POLICY IF EXISTS "Full access inventory_ledger" ON inventory_ledger;
DROP POLICY IF EXISTS "Public full access inventory_ledger" ON inventory_ledger;

CREATE POLICY "Public full access inventory_ledger"
    ON inventory_ledger FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 3. ORDERS TABLE
DROP POLICY IF EXISTS "Public insert orders" ON orders;
DROP POLICY IF EXISTS "Full access orders" ON orders;
DROP POLICY IF EXISTS "Public full access orders" ON orders;

CREATE POLICY "Public full access orders"
    ON orders FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 4. CUSTOMERS TABLE
DROP POLICY IF EXISTS "Full access customers" ON customers;
DROP POLICY IF EXISTS "Public full access customers" ON customers;

CREATE POLICY "Public full access customers"
    ON customers FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 5. SUPPLIERS TABLE
DROP POLICY IF EXISTS "Full access suppliers" ON suppliers;
DROP POLICY IF EXISTS "Public full access suppliers" ON suppliers;

CREATE POLICY "Public full access suppliers"
    ON suppliers FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 6. PURCHASES TABLE
DROP POLICY IF EXISTS "Full access purchases" ON purchases;
DROP POLICY IF EXISTS "Public full access purchases" ON purchases;

CREATE POLICY "Public full access purchases"
    ON purchases FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 7. EXPENSES TABLE
DROP POLICY IF EXISTS "Full access expenses" ON expenses;
DROP POLICY IF EXISTS "Public full access expenses" ON expenses;

CREATE POLICY "Public full access expenses"
    ON expenses FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 8. COUPONS TABLE
DROP POLICY IF EXISTS "Public read coupons" ON coupons;
DROP POLICY IF EXISTS "Full access coupons" ON coupons;
DROP POLICY IF EXISTS "Public full access coupons" ON coupons;

CREATE POLICY "Public full access coupons"
    ON coupons FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 9. CMS CONTENT TABLE
DROP POLICY IF EXISTS "Public read cms_content" ON cms_content;
DROP POLICY IF EXISTS "Full access cms_content" ON cms_content;
DROP POLICY IF EXISTS "Public full access cms_content" ON cms_content;

CREATE POLICY "Public full access cms_content"
    ON cms_content FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 10. STORE SETTINGS TABLE
DROP POLICY IF EXISTS "Public read store_settings" ON store_settings;
DROP POLICY IF EXISTS "Full access store_settings" ON store_settings;
DROP POLICY IF EXISTS "Public full access store_settings" ON store_settings;

CREATE POLICY "Public full access store_settings"
    ON store_settings FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 11. ENQUIRIES & REVIEWS
DROP POLICY IF EXISTS "Public insert enquiries" ON enquiries;
DROP POLICY IF EXISTS "Full access enquiries" ON enquiries;
DROP POLICY IF EXISTS "Public full access enquiries" ON enquiries;

CREATE POLICY "Public full access enquiries"
    ON enquiries FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert reviews" ON reviews;
DROP POLICY IF EXISTS "Public read reviews" ON reviews;
DROP POLICY IF EXISTS "Full access reviews" ON reviews;
DROP POLICY IF EXISTS "Public full access reviews" ON reviews;

CREATE POLICY "Public full access reviews"
    ON reviews FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 12. AUDIT LOGS
DROP POLICY IF EXISTS "Full access audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Public full access audit_logs" ON audit_logs;

CREATE POLICY "Public full access audit_logs"
    ON audit_logs FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

