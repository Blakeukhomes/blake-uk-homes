-- Mortgage per property. Fields per the brief: lender, type, rate, monthly payment,
-- fix end date, outstanding balance, statements.

create type public.mortgage_type as enum ('repayment', 'interest_only', 'part_and_part');
create type public.mortgage_rate_kind as enum ('fixed', 'variable', 'tracker', 'discount');

create table public.mortgages (
  id                   uuid primary key default gen_random_uuid(),
  property_id          uuid not null references public.properties(id) on delete cascade,
  lender               text not null,
  account_number       text,
  mortgage_type        public.mortgage_type not null default 'interest_only',
  rate_kind            public.mortgage_rate_kind not null default 'fixed',
  interest_rate        numeric(6,3),                 -- e.g. 5.250 (%)
  monthly_payment      numeric(12,2),
  monthly_interest     numeric(12,2),                -- auto-feed to MTD btl_mortgage_interest
  outstanding_balance  numeric(14,2),
  fix_end_date         date,
  start_date           date,
  product_end_date     date,                          -- early repayment charge end
  statement_document_id uuid references public.documents(id) on delete set null,
  offer_document_id     uuid references public.documents(id) on delete set null,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index on public.mortgages (property_id);
create index on public.mortgages (fix_end_date);

create trigger trg_mortgages_touch before update on public.mortgages
  for each row execute function public.touch_updated_at();

alter table public.mortgages enable row level security;

create policy "mortgages select" on public.mortgages for select using (public.is_owner_or_manager(property_id));
create policy "mortgages write"  on public.mortgages for all using (public.can_edit_property(property_id))
  with check (public.can_edit_property(property_id));
