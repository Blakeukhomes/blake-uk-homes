-- Outgoing invoices — invoices YOU send to tenants and contacts.
-- Distinct from received invoices, which are uploaded as documents and tagged in MTD.

create type public.invoice_type as enum ('ad_hoc', 'recurring', 'rent', 'deposit', 'other');

create type public.invoice_status as enum (
  'draft', 'sent', 'viewed', 'overdue', 'partial', 'paid', 'void'
);

create sequence if not exists public.invoice_seq start 1001;

create table public.invoices (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  contact_id      uuid references public.contacts(id) on delete set null,
  property_id     uuid references public.properties(id) on delete set null,

  invoice_number  text unique not null default ('INV-' || lpad(nextval('public.invoice_seq')::text, 5, '0')),
  type            public.invoice_type not null default 'ad_hoc',
  status          public.invoice_status not null default 'draft',

  contact_name    text not null,
  contact_email   text,
  contact_address text,

  issue_date      date not null default current_date,
  due_date        date not null,
  payment_terms   text default 'Net 30',

  subtotal        numeric(12,2) not null default 0,
  vat_amount      numeric(12,2) not null default 0,
  total           numeric(12,2) not null default 0,
  amount_paid     numeric(12,2) not null default 0,

  notes           text,
  sent_at         timestamptz,
  paid_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index on public.invoices (owner_id, status);
create index on public.invoices (contact_id);
create index on public.invoices (property_id);

create trigger trg_invoices_touch before update on public.invoices
  for each row execute function public.touch_updated_at();

create table public.invoice_line_items (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references public.invoices(id) on delete cascade,
  description  text not null,
  quantity     numeric(12,3) not null default 1,
  unit_price   numeric(12,2) not null default 0,
  vat_rate     numeric(5,2)  not null default 0,
  line_total   numeric(12,2) not null default 0,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
create index on public.invoice_line_items (invoice_id);

alter table public.invoices           enable row level security;
alter table public.invoice_line_items enable row level security;

create policy "invoices owner" on public.invoices
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "invoice items by parent" on public.invoice_line_items
  for all using (exists (select 1 from public.invoices i where i.id = invoice_id and i.owner_id = auth.uid()))
  with check (exists (select 1 from public.invoices i where i.id = invoice_id and i.owner_id = auth.uid()));
