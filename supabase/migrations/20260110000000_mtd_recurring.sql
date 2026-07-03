-- Recurring flag on MTD transactions.
-- When true, the daily cron duplicates the row forward each month based on
-- transaction_date's day-of-month.
alter table public.mtd_transactions
  add column if not exists is_recurring boolean not null default false;

comment on column public.mtd_transactions.is_recurring is
  'When true, this expense repeats monthly. The cron auto-creates a fresh row each month with the same amount, category and description.';
