import { Brand } from './brand'
import type { Dict } from '@/lib/i18n'

export function SiteFooter({ t }: { t: Dict }) {
  return (
    <footer className="footer">
      <div className="wrap row-between">
        <div className="stack-s">
          <Brand />
          <p className="small" style={{ margin: 0 }}>{t.footer.tag}</p>
        </div>
        <div className="stack-s" style={{ textAlign: 'right' }}>
          <p className="small" style={{ margin: 0 }}>{t.footer.built}</p>
          <p className="tiny" style={{ margin: 0 }}>
            © {new Date().getFullYear()} summario. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  )
}
