-- =====================================================================
-- Blake UK Homes initial schema
-- Run inside the Supabase SQL editor (or `supabase db push` with CLI).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- ROLES & PROFILES ----------
create type public.user_role as enum ('owner', 'manager', 'readonly', 'tenant');

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique not null,
  full_name     text,
  role          public.user_role not null default 'owner',
  phone         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- PROPERTIES ----------
create type public.property_status as enum ('tenanted', 'vacant', 'legal_proceedings');

create table public.properties (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  nickname        text not null,
  address_line_1  text not null,
  address_line_2  text,
  city            text not null,
  postcode        text not null,
  property_type   text default 'flat',
  bedrooms        int,
  monthly_rent    numeric(10,2),
  rent_due_day    int default 1 check (rent_due_day between 1 and 28),
  status          public.property_status not null default 'vacant',
  hero_image_url  text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on public.properties (owner_id);

-- ---------- TENANTS ----------
create table public.tenants (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references public.properties(id) on delete cascade,
  full_name      text not null,
  email          text,
  phone          text,
  auth_user_id   uuid references auth.users(id) on delete set null, -- if tenant has an account
  portal_token   text unique default encode(gen_random_bytes(16), 'hex'),
  tenancy_start  date,
  tenancy_end    date,
  deposit_amount numeric(10,2),
  deposit_scheme text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);
create index on public.tenants (property_id);

-- ---------- COMPLIANCE CERTIFICATES ----------
create type public.compliance_type as enum (
  'gas_safety',         -- annual, 60-day warning
  'eicr',               -- 5 years, 60-day warning
  'epc',                -- 10 years, 90-day warning
  'buildings_insurance' -- annual, 60-day warning
);

create table public.compliance_certificates (
  id              uuid primary key default gen_random_uuid(),
  property_id     uuid not null references public.properties(id) on delete cascade,
  type            public.compliance_type not null,
  completed_on    date not null,
  expires_on      date not null,
  document_id     uuid, -- joined later
  issued_by       text,
  reference       text,
  notes           text,
  created_at      timestamptz not null default now()
);
create index on public.compliance_certificates (property_id, type);

-- Helper: compute next expiry from completion date
create or replace function public.compliance_expiry(c_type public.compliance_type, completed date)
returns date language sql immutable as $$
  select case c_type
    when 'gas_safety'          then completed + interval '1 year'
    when 'eicr'                then completed + interval '5 years'
    when 'epc'                 then completed + interval '10 years'
    when 'buildings_insurance' then completed + interval '1 year'
  end::date;
$$;

-- ---------- RENT PAYMENTS ----------
create type public.rent_status as enum ('paid', 'late', 'missing', 'partial');

create table public.rent_payments (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references public.properties(id) on delete cascade,
  tenant_id      uuid references public.tenants(id) on delete set null,
  period_start   date not null,        -- e.g. 2026-05-01
  due_date       date not null,
  amount_due     numeric(10,2) not null,
  amount_paid    numeric(10,2) not null default 0,
  received_on    date,
  status         public.rent_status not null default 'missing',
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create unique index rent_payments_period_unique on public.rent_payments (property_id, period_start);

-- ---------- MAINTENANCE & INSPECTIONS ----------
create type public.maintenance_kind as enum ('inspection', 'task');

create table public.maintenance_tasks (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references public.properties(id) on delete cascade,
  kind           public.maintenance_kind not null default 'task',
  title          text not null,
  description    text,
  due_on         date not null,
  completed_on   date,
  recur_days     int, -- 120 for inspections; null for one-off
  notes          text,
  created_at     timestamptz not null default now()
);
create index on public.maintenance_tasks (property_id, due_on);

-- ---------- FAULT REPORTS (tenant portal) ----------
create type public.fault_severity as enum ('emergency', 'urgent', 'standard', 'minor');
create type public.fault_state    as enum (
  'reported',
  'acknowledged',
  'contractor_booked',
  'in_progress',
  'resolved',
  'closed'
);

create table public.fault_reports (
  id              uuid primary key default gen_random_uuid(),
  reference       text unique not null default ('FR-' || upper(substr(md5(random()::text), 1, 8))),
  property_id     uuid not null references public.properties(id) on delete cascade,
  tenant_id       uuid references public.tenants(id) on delete set null,
  category        text not null,
  severity        public.fault_severity not null,
  description     text not null,
  reporter_name   text not null,
  reporter_phone  text,
  reporter_email  text,
  current_state   public.fault_state not null default 'reported',
  reported_at     timestamptz not null default now(),
  resolved_at     timestamptz
);
create index on public.fault_reports (property_id, current_state);

-- Append-only event log (court-evidence quality)
create table public.fault_events (
  id            uuid primary key default gen_random_uuid(),
  fault_id      uuid not null references public.fault_reports(id) on delete cascade,
  occurred_at   timestamptz not null default now(),
  actor_role    public.user_role,
  actor_name    text,
  state         public.fault_state not null,
  note          text,
  created_at    timestamptz not null default now()
);
create index on public.fault_events (fault_id, occurred_at);

-- ---------- CONTRACTOR BOOKINGS (visible to tenant) ----------
create table public.contractor_bookings (
  id              uuid primary key default gen_random_uuid(),
  fault_id        uuid references public.fault_reports(id) on delete set null,
  property_id     uuid not null references public.properties(id) on delete cascade,
  contractor_name text not null,
  trade           text,
  phone           text,
  scheduled_for   timestamptz not null,
  notes           text,
  created_at      timestamptz not null default now()
);

-- ---------- DOCUMENTS ----------
create type public.document_kind as enum (
  'gas_safety',
  'eicr',
  'epc',
  'buildings_insurance',
  'tenancy_agreement',
  'deposit_certificate',
  'how_to_rent',
  'inventory_move_in',
  'inventory_move_out',
  'invoice',
  'other'
);

create table public.documents (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references public.properties(id) on delete cascade,
  uploaded_by    uuid references public.profiles(id) on delete set null,
  kind           public.document_kind not null default 'other',
  title          text not null,
  storage_path   text not null,   -- Supabase Storage object path
  mime_type      text,
  file_size      bigint,
  ai_summary     text,            -- populated by Claude
  ai_summary_at  timestamptz,
  visible_to_tenant boolean not null default false,
  created_at     timestamptz not null default now()
);
create index on public.documents (property_id, kind);

alter table public.compliance_certificates
  add constraint compliance_certificates_document_fk
  foreign key (document_id) references public.documents(id) on delete set null;

-- ---------- TENANCY JOURNEY ----------
create type public.journey_step as enum (
  'property_setup',
  'tenant_onboarding',
  'tenancy_agreement',
  'deposit',
  'move_in_inventory',
  'keys_handed_over',
  'active_tenancy',
  'move_out_inspection',
  'deposit_resolution'
);

create table public.tenancy_journey (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references public.properties(id) on delete cascade,
  tenant_id      uuid references public.tenants(id) on delete set null,
  step           public.journey_step not null,
  completed_on   timestamptz,
  landlord_sign  boolean not null default false,
  tenant_sign    boolean not null default false,
  notes          text,
  created_at     timestamptz not null default now(),
  unique (property_id, tenant_id, step)
);

-- ---------- NOTIFICATIONS ----------
create type public.notification_channel as enum ('email', 'push', 'in_app');

create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade,
  property_id   uuid references public.properties(id) on delete cascade,
  channel       public.notification_channel not null,
  subject       text not null,
  body          text,
  sent_at       timestamptz,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

-- Push subscriptions (web push)
create table public.push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  endpoint      text not null unique,
  p256dh        text not null,
  auth          text not null,
  created_at    timestamptz not null default now()
);

-- =====================================================================
-- updated_at triggers
-- =====================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_profiles_touch     before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger trg_properties_touch   before update on public.properties
  for each row execute function public.touch_updated_at();
create trigger trg_rent_touch         before update on public.rent_payments
  for each row execute function public.touch_updated_at();

-- Auto-insert a profile row when a Supabase auth user is created
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'owner')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles                enable row level security;
alter table public.properties              enable row level security;
alter table public.tenants                 enable row level security;
alter table public.compliance_certificates enable row level security;
alter table public.rent_payments           enable row level security;
alter table public.maintenance_tasks       enable row level security;
alter table public.fault_reports           enable row level security;
alter table public.fault_events            enable row level security;
alter table public.contractor_bookings     enable row level security;
alter table public.documents               enable row level security;
alter table public.tenancy_journey         enable row level security;
alter table public.notifications           enable row level security;
alter table public.push_subscriptions      enable row level security;

-- ----- helpers
create or replace function public.is_owner_or_manager(p_property uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.properties pr
    join public.profiles pf on pf.id = auth.uid()
    where pr.id = p_property
      and (pr.owner_id = auth.uid() or pf.role in ('owner','manager','readonly'))
  );
$$;

create or replace function public.can_edit_property(p_property uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.properties pr
    join public.profiles pf on pf.id = auth.uid()
    where pr.id = p_property
      and (pr.owner_id = auth.uid() or pf.role in ('owner','manager'))
  );
$$;

-- profiles: each user sees only their own row
create policy "profiles self select" on public.profiles
  for select using (id = auth.uid());
create policy "profiles self update" on public.profiles
  for update using (id = auth.uid());

-- properties: owner full access; manager/readonly can select
create policy "properties owner manage" on public.properties
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- tenants: owners & managers
create policy "tenants by property access" on public.tenants
  for all using (public.is_owner_or_manager(property_id))
  with check (public.can_edit_property(property_id));

-- compliance / rent / maintenance / documents / tenancy_journey: same pattern
create policy "compliance select" on public.compliance_certificates for select using (public.is_owner_or_manager(property_id));
create policy "compliance write"  on public.compliance_certificates for all using (public.can_edit_property(property_id)) with check (public.can_edit_property(property_id));

create policy "rent select" on public.rent_payments for select using (public.is_owner_or_manager(property_id));
create policy "rent write"  on public.rent_payments for all using (public.can_edit_property(property_id)) with check (public.can_edit_property(property_id));

create policy "maint select" on public.maintenance_tasks for select using (public.is_owner_or_manager(property_id));
create policy "maint write"  on public.maintenance_tasks for all using (public.can_edit_property(property_id)) with check (public.can_edit_property(property_id));

create policy "docs select" on public.documents for select using (public.is_owner_or_manager(property_id));
create policy "docs write"  on public.documents for all using (public.can_edit_property(property_id)) with check (public.can_edit_property(property_id));

create policy "journey select" on public.tenancy_journey for select using (public.is_owner_or_manager(property_id));
create policy "journey write"  on public.tenancy_journey for all using (public.can_edit_property(property_id)) with check (public.can_edit_property(property_id));

create policy "contractor select" on public.contractor_bookings for select using (public.is_owner_or_manager(property_id));
create policy "contractor write"  on public.contractor_bookings for all using (public.can_edit_property(property_id)) with check (public.can_edit_property(property_id));

-- fault reports & events
create policy "faults select" on public.fault_reports for select using (public.is_owner_or_manager(property_id));
create policy "faults write"  on public.fault_reports for all using (public.can_edit_property(property_id)) with check (public.can_edit_property(property_id));

create policy "fault events select" on public.fault_events
  for select using (exists (select 1 from public.fault_reports f where f.id = fault_id and public.is_owner_or_manager(f.property_id)));
create policy "fault events insert" on public.fault_events
  for insert with check (exists (select 1 from public.fault_reports f where f.id = fault_id and public.can_edit_property(f.property_id)));

-- notifications: only addressee
create policy "notifications self" on public.notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "push subs self" on public.push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Tenant portal access goes through a service-role server route using portal_token.
-- No anonymous SELECT policies are added here on purpose.
