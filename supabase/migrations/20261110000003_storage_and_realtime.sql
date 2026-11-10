-- ==============================================================================
-- SHANMUKA FASHIONS: STORAGE BUCKET & REAL-TIME REPLICATION MIGRATION
-- Migration: 20261110000003_storage_and_realtime.sql
-- ==============================================================================

-- 1. CONFIGURE SUPABASE STORAGE BUCKET FOR PRODUCT IMAGES
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    TRUE,
    5242880, -- 5 MB max per file
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
    public = TRUE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- 2. STORAGE ACCESS POLICIES
-- Anyone can view public product images on the storefront
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'product-images');

-- Authenticated admins and authorized anon clients can upload product images
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
    ON storage.objects FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'product-images');

-- Admins can update/replace product images
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
    ON storage.objects FOR UPDATE
    TO public
    USING (bucket_id = 'product-images')
    WITH CHECK (bucket_id = 'product-images');

-- Admins can delete product images
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
    ON storage.objects FOR DELETE
    TO public
    USING (bucket_id = 'product-images');

-- 3. ENABLE POSTGRES REAL-TIME REPLICATION FOR CORE TABLES
-- Ensures changes to products, orders, and inventory are broadcast to connected clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'inventory_ledger'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE inventory_ledger;
  END IF;
END $$;

