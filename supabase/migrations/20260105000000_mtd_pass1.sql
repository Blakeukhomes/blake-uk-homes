-- Pass 1: Section 24 + SA105 mapping support.
-- Add new income/expense categories and a property-level toggle for the
-- £1,000 Property Income Allowance (SA105 Box 5.1).

alter type public.mtd_income_category  add value if not exists 'lease_premiums';
alter type public.mtd_expense_category add value if not exists 'private_use_adjustment';

alter table public.properties
  add column if not exists property_income_allowance boolean not null default false;
comment on column public.properties.property_income_allowance is
  'When true the landlord claims the £1,000 Property Income Allowance for this property and CANNOT deduct expenses. Mutually exclusive with logging expenses against this property in HMRC filings.';
