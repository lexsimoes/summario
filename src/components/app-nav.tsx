'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Dict } from '@/lib/i18n'

const items = [
  { href: '/app', key: 'overview', icon: 'home' },
  { href: '/app/new', key: 'create', icon: 'plus' },
  { href: '/app/history', key: 'history', icon: 'book' },
  { href: '/app/credits', key: 'credits', icon: 'spark' },
] as const
const ownerItems = [
  { href: '/app/admin', key: 'admin', icon: 'users' },
  { href: '/app/admin/models', key: 'models', icon: 'grid' },
  { href: '/app/audit', key: 'audit', icon: 'chart' },
] as const

function NavIcon({ icon }: { icon: string }) {
  const paths: Record<string, string> = {
    home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
    plus: 'M12 5v14M5 12h14',
    book: 'M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4ZM13 7a3 3 0 0 1 3-3h5v15h-4a4 4 0 0 0-4 2',
    spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.8M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    grid: 'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z',
    chart: 'M4 3v18h17M8 16v-4M13 16V7M18 16v-7',
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[icon]} /></svg>
}

export function AppNav({ t, isOwner = false }: { t: Dict; isOwner?: boolean }) {
  const pathname = usePathname()
  return <nav className="workspace-nav" aria-label={t.app.overview.title}>
    {[...items, ...(isOwner ? ownerItems : [])].map(it => {
      const active = it.href === '/app' || it.href === '/app/admin'
        ? pathname === it.href
        : pathname.startsWith(it.href) || (it.href === '/app/history' && pathname.startsWith('/app/documents/'))
      return <Link key={it.href} href={it.href} aria-current={active ? 'page' : undefined} data-admin={it.key === 'admin'}><NavIcon icon={it.icon} /><span>{t.app.nav[it.key]}</span>{active && <i aria-hidden="true" />}</Link>
    })}
  </nav>
}
