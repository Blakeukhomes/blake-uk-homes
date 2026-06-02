-- =====================================================================
-- Blake UK Homes — Making Tax Digital (MTD ITSA) schema
-- Categories come directly from the HMRC quarterly property template.
-- Run after the initial schema + storage migrations.
-- =====================================================================

-- ---- Categories (income) ----
create type public.mtd_income_category as enum (
  'period_amount',     -- standard rent
  'rent_a_room',
  'other_income',
  'tax_deducted'
);

-- ---- Categories (expenses) ----
create type public.mtd_expense_category as enum (
  'other',
  'council_tax',
  'light_and_heat',
  'water_rates',
  'white_goods',
  'insurance',
  'window_cleaning',
  'general_cleaning',
  'oven_cleaning',
  'gardening',
  'premise_running_costs',
  'telephone',
  'professional_fees',
  'legal_fees',
  'rent_a_room_expense',
  'redecorating',
  'ground_rent',
  'service_charges',
  'repairs_and_maintenance',
  'btl_mortgage_interest',
  'other_finance_costs',
  'accountancy_fees',
  'bank_charges',
  'travel_costs'
);

create type public.mtd_kind as enum ('income', 'expense');

-- ---- Transactions ----
create table public.mtd_transactions (
  id                 uuid primary key default gen_random_uuid(),
  property_id        uuid not null references public.properties(id) on delete cascade,
  document_id        uuid references public.documents(id) on delete set null,
  kind               public.mtd_kind not null,
  income_category    public.mtd_income_category,
  expense_category   public.mtd_expense_category,
  transaction_date   date not null,
  amount             numeric(12,2) not null,
  description        text,
  supplier_or_payer  text,
  notes              text,
  created_by         uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  -- enforce category matches kind
  check (
    (kind = 'income'  and income_category  is not null and expense_category is null)
    or
    (kind = 'expense' and expense_category is not null and income_category  is null)
  )
);

create index on public.mtd_transactions (property_id, transaction_date);
create index on public.mtd_transactions (property_id, kind);
create index on public.mtd_transactions (document_id);

-- ---- Helper: UK MTD ITSA quarter for a date ----
-- Returns the start date of the quarter that contains `d`.
-- Quarters: 6 Apr–5 Jul, 6 Jul–5 Oct, 6 Oct–5 Jan, 6 Jan–5 Apr.
create or replace function public.mtd_quarter_start(d date)
returns date language plpgsql immutable as $$
declare
  yr int := extract(year from d);
  q1 date := make_date(yr, 4, 6);
  q2 date := make_date(yr, 7, 6);
  q3 date := make_date(yr, 10, 6);
  q4 date := make_date(yr, 1, 6);
begin
  if d >= q3 then return q3;
  elsif d >= q2 then return q2;
  elsif d >= q1 then return q1;
  elsif d >= make_date(yr, 1, 6) then return q4;
  else return make_date(yr - 1, 10, 6);
  end if;
end $$;

create or replace function public.mtd_quarter_end(d date)
returns date language plpgsql immutable as $$
declare
  s date := public.mtd_quarter_start(d);
  yr int := extract(year from s);
  m  int := extract(month from s);
begin
  if m = 4  then return make_date(yr, 7, 5); end if;   -- Q1
  if m = 7  then return make_date(yr, 10, 5); end if;  -- Q2
  if m = 10 then return make_date(yr + 1, 1, 5); end if; -- Q3
  return make_date(yr, 4, 5);                          -- Q4 (Jan to Apr)
end $$;

-- ---- RLS ----
alter table public.mtd_transactions enable row level security;

create policy "mtd select" on public.mtd_transactions
  for select using (public.is_owner_or_manager(property_id));
create policy "mtd write" on public.mtd_transactions
  for all using (public.can_edit_property(property_id))
  with check (public.can_edit_property(property_id));
