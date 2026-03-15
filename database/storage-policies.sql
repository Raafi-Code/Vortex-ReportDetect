-- ============================================
-- Supabase Storage Bucket & Policies
-- Run this in Supabase SQL Editor
-- ============================================

-- Create the storage bucket (if using SQL, otherwise create via Dashboard)
-- Note: Bucket creation is usually done via Dashboard or Supabase client
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('whatsapp-media', 'whatsapp-media', true);

-- ============================================
-- Storage RLS Policies
-- Allow service role full access (backend)
-- Allow public read access (for frontend to show images)
-- ============================================

-- Allow anyone to read files (public bucket)
CREATE POLICY "Public read access for whatsapp-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'whatsapp-media');

-- Allow service role to insert files
CREATE POLICY "Service role insert for whatsapp-media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'whatsapp-media');

-- Allow service role to update files
CREATE POLICY "Service role update for whatsapp-media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'whatsapp-media');

-- Allow service role to delete files
CREATE POLICY "Service role delete for whatsapp-media"
ON storage.objects FOR DELETE
USING (bucket_id = 'whatsapp-media');
