-- Force PostgREST to reload its schema cache.
-- This resolves "Could not find the table 'public.piggies' in the schema cache"
-- errors that appear after migrations on the cloud project.

NOTIFY pgrst, 'reload schema';
