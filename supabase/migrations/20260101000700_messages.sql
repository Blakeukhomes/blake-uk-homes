-- Messages: lightweight inbox tied to contacts.

create type public.conversation_category as enum ('tenant', 'enquiry', 'viewing', 'other');

create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  contact_id      uuid references public.contacts(id) on delete set null,
  property_id     uuid references public.properties(id) on delete set null,
  category        public.conversation_category not null default 'other',
  subject         text,
  is_archived     boolean not null default false,
  last_message_at timestamptz,
  created_at      timestamptz not null default now()
);
create index on public.conversations (owner_id, category, is_archived);
create index on public.conversations (last_message_at desc);

create type public.message_sender as enum ('landlord', 'tenant', 'system');

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender          public.message_sender not null,
  sender_name     text,
  body            text not null,
  sent_at         timestamptz not null default now(),
  read_at         timestamptz
);
create index on public.messages (conversation_id, sent_at);

alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

create policy "conversations owner" on public.conversations
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "messages by parent" on public.messages
  for all using (exists (select 1 from public.conversations c where c.id = conversation_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from public.conversations c where c.id = conversation_id and c.owner_id = auth.uid()));
