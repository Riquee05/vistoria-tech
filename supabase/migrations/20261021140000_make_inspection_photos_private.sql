-- Keep team-wide access to linked photos; only the inspection owner may upload
-- or delete files in that inspection folder.
UPDATE storage.buckets
SET public = false
WHERE id = 'inspection-photos';

DROP POLICY IF EXISTS "Public can view inspection-photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view inspection-photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to inspection-photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from inspection-photos" ON storage.objects;

CREATE POLICY "Users can view inspection-photos" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'inspection-photos' AND EXISTS (
      SELECT 1 FROM public.inspection_photos
      WHERE file_path = storage.objects.name
    )
  );

CREATE POLICY "Users can upload to inspection-photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'inspection-photos' AND EXISTS (
      SELECT 1 FROM public.inspections
      WHERE id::text = split_part(storage.objects.name, '/', 1)
        AND profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete from inspection-photos" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'inspection-photos' AND EXISTS (
      SELECT 1 FROM public.inspections
      WHERE id::text = split_part(storage.objects.name, '/', 1)
        AND profile_id = auth.uid()
    )
  );
