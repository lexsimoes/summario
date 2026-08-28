import Link from 'next/link'

/** summario — the "i" carries the accent, which is the whole logo. */
export function Brand({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="brand" aria-label="summario">
      <b>summar</b><i>i</i><b>o</b>
    </Link>
  )
}
