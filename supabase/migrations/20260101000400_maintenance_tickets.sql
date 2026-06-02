-- Upgrade maintenance_tasks into full ticket workflow.

create type public.ticket_priority as enum ('low', 'medium', 'high', 'urgent');

create type public.ticket_status as enum (
  'open',
  'scheduled',
  'in_progress',
  'resolved',
  'overdue',
  'rejected',
  'archived',
  'cancelled'
);

alter table public.maintenance_tasks
  add column if not exists priority public.ticket_priority default 'medium',
  add column if not exists status   public.ticket_status   default 'open',
  add column if not exists contractor_id uuid references public.contacts(id) on delete set null,
  add column if not exists reported_by   text,
  add column if not exists resolved_on   date;

create index if not exists maintenance_status_idx   on public.maintenance_tasks (status);
create index if not exists maintenance_priority_idx on public.maintenance_tasks (priority);
