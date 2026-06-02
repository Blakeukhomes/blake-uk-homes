-- Property polish: photo, listing type (single family vs HMO), country.

alter table public.properties
  add column if not exists country text default 'United Kingdom',
  add column if not exists listing_type text default 'single_family'; -- 'single_family' | 'multi_unit_hmo'

create index if not exists properties_listing_type_idx on public.properties (listing_type);
