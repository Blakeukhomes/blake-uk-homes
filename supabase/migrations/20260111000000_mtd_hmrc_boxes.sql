-- HMRC SA105 box alignment (aligns with Blake's reference spreadsheet).
-- Adds four new enum values (2 income, 2 expense) so the app can log:
--   * Box 22 lease premiums (already existed as `lease_premiums`)
--   * Box 23 reverse premiums and inducements (new)
--   * Box 26 non-residential property finance costs (new, for commercial lets)
--   * Box 36 costs of replacing domestic items (new; kept separate from repairs)
--
-- IMPORTANT: existing historical rows are LEFT UNTOUCHED. The box mapping is now
-- performed in application code (src/lib/mtd.ts). Every existing category still
-- exports cleanly under the new SA105 box mapping (e.g. `insurance` used to
-- report under Box 6; it now reports under Box 24, no data migration needed).

-- Add new income values
alter type public.mtd_income_category add value if not exists 'reverse_premium';

-- Add new expense values
alter type public.mtd_expense_category add value if not exists 'non_residential_finance_costs';
alter type public.mtd_expense_category add value if not exists 'replacing_domestic_items';

comment on type public.mtd_income_category is
  'Income categories for MTD ITSA. Boxes: 20 (rents+other), 21 (tax deducted), 22 (lease premium), 23 (reverse premium), 37 (Rent a Room).';

comment on type public.mtd_expense_category is
  'Expense categories for MTD ITSA. Boxes: 24 (rents/rates/insurance), 25 (repairs), 26 (non-residential finance), 27 (professional), 28 (services incl wages), 29 (other), 36 (domestic items), 44 (residential finance / Section 24).';
