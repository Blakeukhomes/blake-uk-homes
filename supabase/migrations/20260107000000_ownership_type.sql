-- Add ownership type so personal vs limited-company properties can be reported
-- with the correct UK tax treatment (Section 24 only applies to personally-owned).

create type public.ownership_type as enum ('personal', 'limited_company');

alter table public.properties
  add column if not exists ownership_type public.ownership_type not null default 'personal',
  add column if not exists company_name text,
  add column if not exists company_number text,
  add column if not exists company_year_end_month int check (company_year_end_month between 1 and 12);

comment on column public.properties.ownership_type is
  'Personal = MTD ITSA quarterly, Section 24 applies (mortgage interest = 20% tax credit). Limited company = annual corporation tax, mortgage interest is a normal deductible expense.';
comment on column public.properties.company_year_end_month is
  'Month (1-12) of the limited company financial year end. Many UK Ltd Cos use 3 (March) or 12 (December).';
