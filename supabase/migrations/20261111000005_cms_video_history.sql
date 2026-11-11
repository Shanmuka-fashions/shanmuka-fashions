-- ==============================================================================
-- SHANMUKA FASHIONS: CINEMATIC HERO VIDEO ASSETS & VERSION HISTORY
-- Migration: 20261111000005_cms_video_history.sql
-- ==============================================================================

-- 1. ADD VIDEO HISTORY JSONB COLUMN TO CMS_CONTENT TABLE
ALTER TABLE IF EXISTS cms_content 
ADD COLUMN IF NOT EXISTS video_history JSONB DEFAULT '[]'::jsonb;

-- 2. UPDATE STORAGE BUCKET TO PERMIT VIDEO MIME TYPES AND UP TO 100MB
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    file_size_limit = 104857600 -- 100 MB max per video
WHERE id = 'product-images';

-- 3. ENSURE PUBLIC RLS POLICIES FOR STORAGE AND CMS_CONTENT
DROP POLICY IF EXISTS "Public full access cms_content" ON cms_content;
CREATE POLICY "Public full access cms_content"
    ON cms_content FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

