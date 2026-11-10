-- ==============================================================================
-- SHANMUKA FASHIONS: AUTOMATIC BARCODE & THERMAL STICKER PRINTING SYSTEM
-- Migration: 20261110000002_barcode_printing_system.sql
-- ==============================================================================

-- 1. ADD BARCODE ATTRIBUTES TO PRODUCTS TABLE
ALTER TABLE IF EXISTS products 
  ADD COLUMN IF NOT EXISTS barcode_type TEXT DEFAULT 'CODE128',
  ADD COLUMN IF NOT EXISTS tracking_mode TEXT DEFAULT 'PRODUCT', -- 'PRODUCT' (batch/SKU level) or 'ITEM' (individual serialized piece)
  ADD COLUMN IF NOT EXISTS barcode_status TEXT DEFAULT 'VERIFIED',
  ADD COLUMN IF NOT EXISTS last_printed_price NUMERIC,
  ADD COLUMN IF NOT EXISTS last_printed_at TIMESTAMPTZ;

-- Ensure unique constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_barcode_unique'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_barcode_unique UNIQUE (barcode);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_sku_unique'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_sku_unique UNIQUE (sku);
  END IF;
END $$;

-- 2. BARCODE PRINT HISTORY
-- Audits every thermal label printing run, quantities, dimensions, and reprint status
CREATE TABLE IF NOT EXISTS barcode_print_history (
    id TEXT PRIMARY KEY,
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    barcode TEXT NOT NULL,
    product_name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    sticker_dimensions TEXT NOT NULL DEFAULT '50x30mm',
    is_reprint BOOLEAN NOT NULL DEFAULT FALSE,
    reason TEXT DEFAULT 'Inventory Labelling',
    admin_user TEXT NOT NULL DEFAULT 'Bhanu (Owner)',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_print_history_sku ON barcode_print_history(sku);
CREATE INDEX IF NOT EXISTS idx_print_history_barcode ON barcode_print_history(barcode);
CREATE INDEX IF NOT EXISTS idx_print_history_created_at ON barcode_print_history(created_at);

-- 3. INVENTORY UNITS TABLE (Individual Piece Serialized Tracking)
-- For luxury handloom sarees where each physical drape is tracked with a unique unit barcode
CREATE TABLE IF NOT EXISTS inventory_units (
    id TEXT PRIMARY KEY,
    unit_barcode TEXT UNIQUE NOT NULL,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    serial_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'SOLD', 'RESERVED', 'DEFECTIVE'
    sold_order_id TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sold_at TIMESTAMPTZ,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_inventory_units_barcode ON inventory_units(unit_barcode);
CREATE INDEX IF NOT EXISTS idx_inventory_units_product ON inventory_units(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_units_status ON inventory_units(status);

-- 4. PRINTER CONFIGURATION TABLE
-- Persists thermal printer hardware settings (TSC, Zebra, Xprinter, etc.)
CREATE TABLE IF NOT EXISTS printer_configuration (
    id TEXT PRIMARY KEY DEFAULT 'DEFAULT_CONFIG',
    printer_name TEXT NOT NULL DEFAULT 'Thermal Barcode Label Printer',
    connection_type TEXT NOT NULL DEFAULT 'BROWSER_DIRECT', -- 'BROWSER_DIRECT', 'WEB_USB', 'WEB_SERIAL', 'NETWORK'
    printer_language TEXT NOT NULL DEFAULT 'BROWSER_PDF', -- 'BROWSER_PDF', 'TSPL', 'ZPL'
    sticker_width NUMERIC NOT NULL DEFAULT 50, -- in millimeters
    sticker_height NUMERIC NOT NULL DEFAULT 30, -- in millimeters
    label_gap NUMERIC NOT NULL DEFAULT 3, -- in millimeters
    print_darkness INTEGER NOT NULL DEFAULT 10, -- 1-15
    print_speed INTEGER NOT NULL DEFAULT 3, -- in inches per second
    include_branding BOOLEAN NOT NULL DEFAULT TRUE,
    include_price BOOLEAN NOT NULL DEFAULT TRUE,
    include_sku BOOLEAN NOT NULL DEFAULT TRUE,
    include_category BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial printer config
INSERT INTO printer_configuration (id, printer_name, connection_type, printer_language, sticker_width, sticker_height, label_gap)
VALUES ('DEFAULT_CONFIG', 'Shanmuka Thermal Label Printer', 'BROWSER_DIRECT', 'BROWSER_PDF', 50, 30, 3)
ON CONFLICT (id) DO NOTHING;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE barcode_print_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE printer_configuration ENABLE ROW LEVEL SECURITY;

-- Anonymous users / customers have no access to print history, inventory units, or printer settings
DROP POLICY IF EXISTS "Public view for print history" ON barcode_print_history;
DROP POLICY IF EXISTS "Public view for inventory units" ON inventory_units;
DROP POLICY IF EXISTS "Public view for printer config" ON printer_configuration;

-- Authenticated store owner / admin access
CREATE POLICY "Admin full access to print history"
    ON barcode_print_history FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY "Admin full access to inventory units"
    ON inventory_units FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY "Admin full access to printer config"
    ON printer_configuration FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- Allow public read of units if needed for customer authenticity verification (optional, read-only)
CREATE POLICY "Public read unit status for Silk Mark authenticity"
    ON inventory_units FOR SELECT
    TO anon
    USING (status = 'SOLD');

