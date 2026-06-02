-- Contacts: tenants, contractors, suppliers, agents, other parties.
-- A single book of business across all properties.

create type public.contact_kind as enum ('tenant', 'contractor', 'supplier', 'agent', 'other');

create table public.contacts (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  kind          public.contact_kind not null default 'other',
  full_name     text not null,
  company       text,
  trade         text,                -- e.g. "Plumber" for contractors
  email         text,
  phone         text,
  address       text,
  notes         text,
  is_active     boolean not null default true,
  property_id   uuid references public.properties(id) on delete set null,   -- optional link
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index on public.contacts (owner_id, kind);
create index on public.contacts (property_id);

create trigger trg_contacts_touch before update on public.contacts
  for each row execute function public.touch_updated_at();

alter table public.contacts enable row level security;

create policy "contacts owner" on public.contacts
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
