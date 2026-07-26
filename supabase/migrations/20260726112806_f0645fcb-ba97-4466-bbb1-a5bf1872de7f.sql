ALTER TABLE public.generated_content ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
CREATE POLICY "post images public read" ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
CREATE POLICY "post images owner write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "post images owner delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);