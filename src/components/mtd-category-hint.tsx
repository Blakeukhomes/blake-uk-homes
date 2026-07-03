'use client'
import { AlertCircle, Info } from 'lucide-react'

/**
 * Contextual guidance shown on the MTD add/edit forms when the selected
 * category is one that commonly trips landlords up. Rules follow HMRC SA105
 * (2025-26) and the reference spreadsheet.
 */
export function MtdCategoryHint({ kind, category }: {
  kind: 'income' | 'expense'
  category: string | undefined
}) {
  if (!category) return null

  // Expense hints
  if (kind === 'expense') {
    if (category === 'repairs_and_maintenance' || category === 'redecorating') {
      return (
        <Hint tone="warning" title="Repairs vs improvements — check before saving">
          <span>Only <strong>like-for-like</strong> repairs are allowable. Fixing a broken tile, patching a roof, or repainting a room are fine.</span>
          <span>Replacing a whole roof, refitting a kitchen, adding an extension or converting a loft is a <strong>capital improvement</strong> and NOT deductible from rental profit — it only affects Capital Gains Tax when you sell.</span>
          <span>If unsure, log as a note and confirm with your accountant before submitting the quarter.</span>
        </Hint>
      )
    }
    if (category === 'btl_mortgage_interest' || category === 'other_finance_costs') {
      return (
        <Hint tone="info" title="Section 24 — mortgage interest is NOT a normal expense">
          <span>Residential BTL mortgage interest goes to <strong>Box 44</strong> and gives you a <strong>20% tax reducer only</strong>, not a full deduction from profit.</span>
          <span>Blake UK Homes handles this automatically — this row is excluded from the deductible-expense total in every quarterly export.</span>
        </Hint>
      )
    }
    if (category === 'non_residential_finance_costs') {
      return (
        <Hint tone="info" title="Non-residential (commercial) let">
          <span>This is <strong>only</strong> for commercial lets — a shop, office or industrial unit. If Blake owns any of these, the finance costs are <strong>fully deductible</strong> from profit (Box 26), unlike residential BTL.</span>
        </Hint>
      )
    }
    if (category === 'replacing_domestic_items' || category === 'white_goods') {
      return (
        <Hint tone="info" title="Box 36 — like-for-like only">
          <span>Only residential lettings. Replacing a broken washing machine with a similar one is allowable. Upgrading the whole kitchen or adding NEW items (e.g. a dishwasher where there wasn't one) is not — that's capital, not deductible.</span>
        </Hint>
      )
    }
    if (category === 'rent_a_room_expense') {
      return (
        <Hint tone="warning" title="Rent a Room is a relief, not a normal expense">
          <span>Rent a Room is an exempt-relief scheme (Box 37). You don't file it as a normal income line AND a normal expense line — pick one treatment with your accountant. This category exists only for legacy rows.</span>
        </Hint>
      )
    }
  }

  // Income hints
  if (kind === 'income') {
    if (category === 'tax_deducted') {
      return (
        <Hint tone="warning" title="Box 21 — NOT added to your income">
          <span>Tax deducted at source (e.g. by a letting agent under the Non-Resident Landlord Scheme) is <strong>tax already paid on your behalf</strong>, not new income.</span>
          <span>Blake UK Homes reports this on its own line (Box 21) and does not include it in your rental income total — HMRC uses it as a credit against your tax bill.</span>
        </Hint>
      )
    }
    if (category === 'rent_a_room') {
      return (
        <Hint tone="info" title="Rent a Room — separate scheme">
          <span>Rent a Room relief (Box 37) is a distinct scheme. If you're claiming the £7,500 tax-free allowance, you can't also deduct associated expenses. Confirm the approach with your accountant.</span>
        </Hint>
      )
    }
    if (category === 'lease_premiums' || category === 'reverse_premium') {
      return (
        <Hint tone="info" title={category === 'lease_premiums' ? 'Box 22 — lease premium' : 'Box 23 — reverse premium'}>
          <span>{category === 'lease_premiums'
            ? 'One-off premium paid by a tenant for the grant of a lease. Different treatment from ordinary rent — only part may be taxable.'
            : 'Payment from you to a tenant to take on a lease. Reported in Box 23 but only assessable in specific cases.'}</span>
          <span>Rare — check with your accountant before recording.</span>
        </Hint>
      )
    }
  }

  return null
}

function Hint({
  tone, title, children,
}: {
  tone: 'info' | 'warning'
  title: string
  children: React.ReactNode
}) {
  const Icon = tone === 'warning' ? AlertCircle : Info
  const colors = tone === 'warning'
    ? { border: 'border-warning-500/40', bg: 'bg-warning-50', icon: 'text-warning-700', title: 'text-ink-900' }
    : { border: 'border-accent-500/40', bg: 'bg-accent-50', icon: 'text-accent-700', title: 'text-ink-900' }

  const kids = Array.isArray(children) ? children : [children]
  return (
    <div className={`sm:col-span-2 rounded-xl border ${colors.border} ${colors.bg} p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${colors.icon}`} />
        <div className="min-w-0 space-y-1">
          <p className={`text-sm font-semibold ${colors.title}`}>{title}</p>
          {kids.map((k, i) => (
            <p key={i} className="text-xs text-ink-700 leading-5">{k}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
