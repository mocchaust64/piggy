-- Migration: Profile Expansion & Avatar Storage
-- Description: Add fields for Solana wallet, custom avatars, and biometric settings. 
-- Sets up Supabase Storage bucket and RLS for avatars.

-- 1. Extend user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS solana_wallet_address TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS biometrics_enabled BOOLEAN DEFAULT FALSE;

-- 2. Create Storage Bucket for Avatars (id, name, public)
-- We check if it exists first to be idempotent
INSERT INTO storage.buckets (id, name, public)
SELECT 'avatars', 'avatars', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
);

-- 3. Storage RLS Policies
-- Enable RLS on storage.objects (if not already enabled)
-- Note: Supabase enables RLS on objects by default usually, but good to be explicit.

-- Policy: Anyone can view avatars (Public bucket)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Policy: Authenticated users can upload their own avatar into their own folder
-- Folder name pattern: avatars/[user_id]/filename.jpg
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update/delete their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Add index for wallet address lookups (for future social/search features)
CREATE INDEX IF NOT EXISTS idx_user_profiles_solana_wallet ON public.user_profiles(solana_wallet_address);
