import { NavLink } from 'react-router-dom'

import { BrandMark } from '@/components/brand/BrandMark'
import { cn } from '@/lib/utils'

const links: { to: string; label: string; end?: boolean }[] = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/leads', label: 'Intake review' },
  { to: '/admin/people', label: 'People' },
  { to: '/admin/opportunities', label: 'Opportunities' },
  { to: '/admin/matches', label: 'Matches' },
  { to: '/admin/introduction-requests', label: 'Intro requests' },
  { to: '/admin/import', label: 'CSV import' },
  { to: '/admin/settings', label: 'Settings' },
] as const

export function AdminSidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="border-b border-sidebar-border px-4 py-5">
        <BrandMark imageClassName="w-40" />
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--nucleus-blue)]">
          Concierge Admin
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Admin">
        {links.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'border-l-2 px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'border-[var(--nucleus-blue)] bg-accent font-bold text-[var(--nucleus-blue)]'
                  : 'border-transparent text-muted-foreground hover:bg-background hover:text-foreground',
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
