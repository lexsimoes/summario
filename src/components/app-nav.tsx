'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Dict } from '@/lib/i18n'

const items = [
  { href: '/app', key: 'overview' },
  { href: '/app/new', key: 'create' },
  { href: '/app/history', key: 'history' },
  { href: '/app/credits', key: 'credits' },
] as const

/** Owner-only, matching the page's own check. */
const ownerItems = [
  { href: '/app/admin', key: 'admin' },
  { href: '/app/admin/models', key: 'models' },
  { href: '/app/audit', key: 'audit' },
] as const

export function AppNav({ t, isOwner = false }: { t: Dict; isOwner?: boolean }) {
  const pathname = usePathname()

  return (
    <nav style={{ display: 'flex', gap: 4, marginTop: -8, overflowX: 'auto' }}>
      {[...items, ...(isOwner ? ownerItems : [])].map((it) => {
        const active = it.href === '/app' ? pathname === '/app' : pathname.startsWith(it.href)
        return (
          <Link
            key={it.href}
            href={it.href}
            style={{
              padding: '10px 14px 13px',
              fontSize: 14,
              fontWeight: active ? 650 : 500,
              color: active ? 'var(--accent-ink)' : 'var(--muted)',
              borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
              whiteSpace: 'nowrap',
            }}
          >
            {t.app.nav[it.key]}
          </Link>
        )
      })}
    </nav>
  )
}
