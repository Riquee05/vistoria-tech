-- OS is optional. Normalize older empty values to NULL so the existing
-- (OS, asset) unique constraint only applies when an OS number exists.
ALTER TABLE public.inspections
  ALTER COLUMN os_number DROP NOT NULL;

UPDATE public.inspections
SET os_number = NULL
WHERE os_number IS NOT NULL AND btrim(os_number) = '';

-- Prevent a user from deleting their profile and cascading deletion of inspections.
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

-- Profile data is private to its owner; team inspection access remains shared.
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Make all row-level write policies explicitly unavailable to anonymous sessions.
DROP POLICY IF EXISTS "inspections_insert" ON public.inspections;
CREATE POLICY "inspections_insert" ON public.inspections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "inspections_update" ON public.inspections;
CREATE POLICY "inspections_update" ON public.inspections
  FOR UPDATE TO authenticated USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "inspections_delete" ON public.inspections;
CREATE POLICY "inspections_delete" ON public.inspections
  FOR DELETE TO authenticated USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "inspection_photos_insert" ON public.inspection_photos;
CREATE POLICY "inspection_photos_insert" ON public.inspection_photos
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.inspections
      WHERE id = inspection_id AND profile_id = auth.uid())
  );
DROP POLICY IF EXISTS "inspection_photos_update" ON public.inspection_photos;
CREATE POLICY "inspection_photos_update" ON public.inspection_photos
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.inspections
      WHERE id = inspection_id AND profile_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.inspections
      WHERE id = inspection_id AND profile_id = auth.uid())
  );
DROP POLICY IF EXISTS "inspection_photos_delete" ON public.inspection_photos;
CREATE POLICY "inspection_photos_delete" ON public.inspection_photos
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.inspections
      WHERE id = inspection_id AND profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "inspection_steps_insert" ON public.inspection_steps;
CREATE POLICY "inspection_steps_insert" ON public.inspection_steps
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.inspections
      WHERE id = inspection_id AND profile_id = auth.uid())
  );
DROP POLICY IF EXISTS "inspection_steps_update" ON public.inspection_steps;
CREATE POLICY "inspection_steps_update" ON public.inspection_steps
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.inspections
      WHERE id = inspection_id AND profile_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.inspections
      WHERE id = inspection_id AND profile_id = auth.uid())
  );
DROP POLICY IF EXISTS "inspection_steps_delete" ON public.inspection_steps;
CREATE POLICY "inspection_steps_delete" ON public.inspection_steps
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.inspections
      WHERE id = inspection_id AND profile_id = auth.uid())
  );
