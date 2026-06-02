// Robot avatar for "Nick" the AI assistant. SVG, no external assets.
import { cn } from '@/lib/cn'

export function NickAvatar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg" className={cn('block', className)} aria-hidden>
      {/* antenna */}
      <line x1="60" y1="12" x2="60" y2="22" stroke="#cbd5e1" strokeWidth="2" />
      <circle cx="60" cy="10" r="4" fill="#6366f1">
        <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* head */}
      <rect x="32" y="22" width="56" height="40" rx="8" fill="#e0e7ff" stroke="#cbd5e1" strokeWidth="2" />
      {/* eyes */}
      <circle cx="48" cy="42" r="3.5" fill="#0f172a" />
      <circle cx="72" cy="42" r="3.5" fill="#0f172a" />
      {/* mouth */}
      <line x1="48" y1="52" x2="72" y2="52" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />

      {/* neck */}
      <rect x="55" y="62" width="10" height="6" fill="#cbd5e1" />

      {/* body */}
      <rect x="28" y="68" width="64" height="48" rx="8" fill="#dbeafe" stroke="#cbd5e1" strokeWidth="2" />
      {/* tie */}
      <polygon points="60,68 56,72 60,98 64,72" fill="#6366f1" />
      {/* name tag */}
      <rect x="68" y="76" width="20" height="10" rx="1" fill="white" stroke="#cbd5e1" strokeWidth="1" />
      <text x="78" y="83" textAnchor="middle" fontSize="6" fontWeight="700" fill="#0f172a">Nick</text>

      {/* arms */}
      <rect x="20" y="76" width="10" height="22" rx="4" fill="#cbd5e1" />
      <rect x="90" y="76" width="10" height="22" rx="4" fill="#cbd5e1" />

      {/* shadow */}
      <ellipse cx="60" cy="124" rx="34" ry="3.5" fill="#0f172a" opacity="0.12" />
    </svg>
  )
}
