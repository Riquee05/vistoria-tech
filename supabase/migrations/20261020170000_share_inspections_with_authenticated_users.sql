-- Let any signed-in user read every inspection and its details.
-- Writes remain limited to the user who created each inspection.
DROP POLICY IF EXISTS "inspections_select" ON public.inspections;
CREATE POLICY "inspections_select" ON public.inspections
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "inspection_photos_select" ON public.inspection_photos;
CREATE POLICY "inspection_photos_select" ON public.inspection_photos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "inspection_steps_select" ON public.inspection_steps;
CREATE POLICY "inspection_steps_select" ON public.inspection_steps
  FOR SELECT TO authenticated USING (true);
