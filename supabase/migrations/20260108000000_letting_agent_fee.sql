-- Add letting agent fees as a distinct MTD expense category.
-- Maps to SA105 Box 8 (Legal, management and professional fees) — same group as
-- professional_fees but tracked separately because most landlords want it called out.
alter type public.mtd_expense_category add value if not exists 'letting_agent_fees';
