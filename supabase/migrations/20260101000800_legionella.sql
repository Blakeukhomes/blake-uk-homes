-- Add Legionella to compliance types.
-- Postgres enum cannot be altered in a transaction in some versions;
-- safest pattern is: add value (Postgres 12+ supports IF NOT EXISTS).

alter type public.compliance_type add value if not exists 'legionella';
