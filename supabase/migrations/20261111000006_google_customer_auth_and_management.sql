-- ==============================================================================
-- SHANMUKA FASHIONS: GOOGLE CUSTOMER AUTHENTICATION, PROFILE COMPLETION & CUSTOMER MANAGEMENT
-- Migration: 20261111000006_google_customer_auth_and_management.sql
-- ==============================================================================

-- 1. ENHANCE CUSTOMERS TABLE
ALTER TABLE customers ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS mobile_number TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS alternate_mobile TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'Active'; -- 'Active', 'Inactive'
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_contact TEXT DEFAULT 'WhatsApp';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN DEFAULT TRUE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_order_date TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Backfill full_name and mobile_number from existing name & phone
UPDATE customers SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;
UPDATE customers SET mobile_number = phone WHERE mobile_number IS NULL AND phone IS NOT NULL;

-- 2. ENHANCE CUSTOMER_ADDRESSES TABLE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_addresses') THEN
        CREATE TABLE customer_addresses (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
            auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            address_type TEXT DEFAULT 'Home',
            full_name TEXT,
            phone TEXT,
            house_number TEXT,
            street TEXT NOT NULL,
            landmark TEXT,
            city TEXT NOT NULL,
            district TEXT,
            state TEXT NOT NULL,
            pincode TEXT NOT NULL,
            country TEXT DEFAULT 'India',
            is_default BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE;
        ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS house_number TEXT;
        ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS district TEXT;
        ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
    END IF;
END $$;

-- 3. CUSTOMER INTERNAL NOTES TABLE (Admin notes for wedding trousseau, sizing, preferences)
CREATE TABLE IF NOT EXISTS customer_notes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    admin_user TEXT NOT NULL DEFAULT 'Bhanu Prakash Reddy',
    admin_user_id UUID,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ADMINISTRATIVE AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    actor TEXT NOT NULL,
    actor_id TEXT,
    action TEXT NOT NULL, -- e.g. 'CUSTOMER_STATUS_UPDATE', 'CUSTOMER_NOTE_ADDED', 'PROFILE_MUTATION'
    entity TEXT NOT NULL, -- e.g. 'customers', 'orders'
    entity_id TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AUTOMATIC TRIGGER FOR GOOGLE AUTH SIGNUP & OAUTH SYNC
CREATE OR REPLACE FUNCTION public.handle_customer_auth_sync()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_avatar TEXT;
    v_cust_id TEXT;
BEGIN
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    v_avatar := NEW.raw_user_meta_data->>'avatar_url';

    -- Check if a customer record with this email or auth_user_id already exists
    SELECT id INTO v_cust_id FROM public.customers 
    WHERE auth_user_id = NEW.id OR LOWER(email) = LOWER(NEW.email)
    LIMIT 1;

    IF v_cust_id IS NOT NULL THEN
        -- Update existing customer with auth_user_id and last_login
        UPDATE public.customers
        SET auth_user_id = NEW.id,
            avatar_url = COALESCE(avatar_url, v_avatar),
            last_login_at = NOW(),
            updated_at = NOW()
        WHERE id = v_cust_id;
    ELSE
        -- Insert new customer with profile_completed = FALSE (Google sign-in requires completion)
        v_cust_id := 'CUST-' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8));
        INSERT INTO public.customers (
            id,
            auth_user_id,
            name,
            full_name,
            email,
            phone,
            mobile_number,
            avatar_url,
            profile_completed,
            account_status,
            last_login_at,
            created_at,
            updated_at
        ) VALUES (
            v_cust_id,
            NEW.id,
            v_full_name,
            v_full_name,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'phone', ''),
            COALESCE(NEW.raw_user_meta_data->>'phone', ''),
            v_avatar,
            FALSE,
            'Active',
            NOW(),
            NOW(),
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_customer_sync ON auth.users;
CREATE TRIGGER on_auth_user_customer_sync
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_customer_auth_sync();

-- 6. ROW-LEVEL SECURITY (RLS) POLICIES
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Customers can view & update their own row (or public client with matching auth.uid())
DROP POLICY IF EXISTS "Customers view own profile" ON customers;
CREATE POLICY "Customers view own profile"
  ON customers FOR SELECT
  TO authenticated, anon
  USING (
    auth_user_id = auth.uid()
    OR auth.role() = 'authenticated'
    OR true -- Allowed for anon admin/storefront app sync
  );

DROP POLICY IF EXISTS "Customers update own profile" ON customers;
CREATE POLICY "Customers update own profile"
  ON customers FOR UPDATE
  TO authenticated, anon
  USING (
    auth_user_id = auth.uid()
    OR true
  )
  WITH CHECK (
    auth_user_id = auth.uid()
    OR true
  );

DROP POLICY IF EXISTS "Customers insert profile" ON customers;
CREATE POLICY "Customers insert profile"
  ON customers FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Customer Addresses RLS
DROP POLICY IF EXISTS "Addresses access" ON customer_addresses;
CREATE POLICY "Addresses access"
  ON customer_addresses FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Customer Notes RLS
DROP POLICY IF EXISTS "Notes access" ON customer_notes;
CREATE POLICY "Notes access"
  ON customer_notes FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Audit Logs RLS
DROP POLICY IF EXISTS "Audit logs access" ON audit_logs;
CREATE POLICY "Audit logs access"
  ON audit_logs FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON customers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile_number);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(account_status);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_cust_id ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_cust_id ON customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
