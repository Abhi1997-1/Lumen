-- Fix Security Definer View Issue for user_usage_summary
-- Detects views defined with the SECURITY DEFINER property. 
-- These views enforce Postgres permissions and row level security policies (RLS) of the view creator, 
-- rather than that of the querying user. We want the querying user's RLS to apply.

ALTER VIEW public.user_usage_summary SET (security_invoker = true);
