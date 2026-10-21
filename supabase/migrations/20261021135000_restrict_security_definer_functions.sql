-- Only the auth service needs to invoke the signup trigger function.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- These helper RPCs are not used by the app; do not expose definer execution.
ALTER FUNCTION public.is_admin(UUID) SET search_path = '';
ALTER FUNCTION public.get_user_role(UUID) SET search_path = '';
REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_user_role(UUID) FROM PUBLIC, anon, authenticated;
