-- Add an "all electric" flag to properties. When true the property has no gas
-- supply and gas safety certificates are not required.
alter table public.properties
  add column if not exists is_all_electric boolean not null default false;

comment on column public.properties.is_all_electric is
  'When true, the property has no gas supply so a gas safety certificate is not required.';
