import { families } from './design'
import type { Family } from './types'

/**
 * The print stylesheet. Body serif, everything else sans, KaTeX for math.
 * Georgia is the web-safe fallback the reference PDFs use; swap the first
 * entry for Source Serif 4 / Crimson Pro / Literata once a font is chosen
 * (all OFL — the serif in Anthropic's identity is proprietary and cannot ship).
 */
export function stylesheet(family: Family) {
  const f = families[family]
  return `
@page { size: A4; margin: 14mm 13mm 15mm 13mm; }

:root {
  --accent: ${f.accent};
  --bar: ${f.bar};
  --ink: #1c1c1e;
  --muted: #5c6169;
  --rule: #dfe3ea;
  --serif: Georgia, 'Source Serif 4', 'Crimson Pro', Literata, 'Times New Roman', serif;
  --sans: 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body {
  margin: 0;
  font-family: var(--serif);
  font-size: 10.4pt;
  line-height: 1.47;
  color: var(--ink);
  background: #fff;
}

h1, h2, h3, h4, .box-label, .part-bar, .badge, table, .num, .cover-kicker {
  font-family: var(--sans);
}

/* ---------- cover ---------- */
.cover { padding: 6mm 0 8mm; border-bottom: 3px solid var(--accent); margin-bottom: 8mm; }
.cover-kicker {
  font-size: 8.5pt; letter-spacing: .14em; text-transform: uppercase;
  color: var(--accent); font-weight: 700; margin: 0 0 3mm;
}
.cover h1 { font-size: 24pt; line-height: 1.15; margin: 0 0 3mm; letter-spacing: -.01em; }
.cover-sub { font-size: 12pt; color: var(--muted); margin: 0 0 4mm; font-style: italic; }
.cover-source { font-size: 9pt; color: var(--muted); margin: 0 0 6mm; }
.cover-howto {
  background: #f7f8fa; border-left: 4px solid var(--accent);
  border-radius: 6px; padding: 4mm 5mm;
}
.cover-howto h4 {
  margin: 0 0 2mm; font-size: 9pt; letter-spacing: .09em;
  text-transform: uppercase; color: var(--accent);
}
.cover-howto ol, .cover-howto ul { margin: 0; padding-left: 5mm; }
.cover-howto li { margin: 1mm 0; }

/* ---------- part bar ---------- */
.part-bar {
  background: var(--bar); color: #fff; font-weight: 700; font-size: 10pt;
  letter-spacing: .09em; text-transform: uppercase;
  padding: 2.6mm 4mm; border-radius: 5px; margin: 9mm 0 5mm;
  break-after: avoid; page-break-after: avoid;
}
.part-bar:first-child { margin-top: 0; }

/* ---------- sections & questions ---------- */
.sec, .q { margin: 0 0 6mm; }
.sec h2, .q h3 {
  font-size: 12pt; margin: 0 0 3mm; line-height: 1.3;
  break-after: avoid; page-break-after: avoid;
}
.q h3 { font-size: 11pt; }
.num {
  display: inline-block; min-width: 6.2mm; height: 6.2mm; line-height: 6.2mm;
  text-align: center; background: var(--accent); color: #fff;
  border-radius: 4px; font-size: 9pt; font-weight: 700; margin-right: 2.2mm;
  vertical-align: 1px;
}
.q .num { min-width: 5.6mm; height: 5.6mm; line-height: 5.6mm; font-size: 8pt; }

.badge {
  display: inline-block; background: #e8f6ff; border: 1px solid #a9d6ee;
  color: #0b5f8a; font-size: 7.2pt; font-weight: 700; letter-spacing: .08em;
  padding: .6mm 2mm; border-radius: 999px; vertical-align: 2px; margin-left: 2mm;
  text-transform: uppercase;
}

ul.tech, .sec ul, .q ul { margin: 0 0 3mm; padding-left: 5.5mm; }
ul.tech li, .sec li, .q li { margin: 1.4mm 0; }
p { margin: 0 0 3mm; }

/* ---------- boxes ---------- */
.box {
  border-radius: 7px; padding: 3mm 4mm; margin: 0 0 3.5mm;
  border: 1px solid transparent; border-left-width: 5px;
  break-inside: avoid; page-break-inside: avoid;
}
.box p:last-child, .box ul:last-child { margin-bottom: 0; }
.box-label {
  font-size: 7.6pt; font-weight: 700; letter-spacing: .11em;
  text-transform: uppercase; margin-bottom: 1.8mm;
}

.intuition { background: #fff7ec; border-color: #e8a33d; color: #4a3a1c; }
.intuition .box-label { color: #9a6b18; }

.deepdive { background: #eef2ff; border-color: #5b6fd6; color: #293568; }
.deepdive .box-label { color: #3b4aa0; }

.answer { background: #eefaf3; border-color: #2f9e68; color: #155f3c; }
.answer .box-label { color: #1f7a4d; }

.theory { background: #fff7ec; border-color: #e8a33d; color: #5a4318; }
.theory .box-label { color: #9a6b18; }

.trap { background: #fdf0ed; border-color: #c0392b; color: #5e2018; }
.trap .box-label { color: #a4321f; }

.recap {
  background: color-mix(in srgb, var(--accent) 7%, #fff);
  border-color: var(--accent);
  color: color-mix(in srgb, var(--accent) 75%, #000);
}
.recap .box-label { color: var(--accent); }

/* ---------- math ---------- */
.math {
  background: #f6f6fb; border: 1px solid var(--rule); border-radius: 6px;
  padding: 2.5mm 3mm; margin: 0 0 3.5mm; text-align: center;
  break-inside: avoid; page-break-inside: avoid;
}
.katex { font-size: 1.02em; }
.katex-display { margin: 0; }

/* ---------- tables ---------- */
table.ref, .sec table, .q table {
  width: 100%; border-collapse: collapse; margin: 0 0 4mm;
  font-family: var(--sans); font-size: 8.8pt;
  break-inside: avoid; page-break-inside: avoid;
}
table.ref thead th, .sec table thead th {
  background: var(--accent); color: #fff; text-align: left;
  padding: 2mm 2.6mm; font-weight: 700; letter-spacing: .03em;
}
table.ref td, table.ref th, .sec table td, .sec table th {
  border: 1px solid var(--rule); padding: 1.8mm 2.6mm; vertical-align: top;
}
table.ref tbody tr:nth-child(even) { background: #faf9fe; }

/* Long reference tables must be allowed to break across pages. */
table.ref.long { break-inside: auto; page-break-inside: auto; }
table.ref.long tr { break-inside: avoid; page-break-inside: avoid; }
table.ref.long thead { display: table-header-group; }

/* ---------- notes ---------- */
.link-note {
  border-left: 3px solid var(--accent); padding-left: 3mm;
  color: var(--muted); font-size: 9.6pt;
}
.note {
  font-size: 9pt; color: var(--muted); font-style: italic;
  border-left: 3px solid var(--rule); padding-left: 3mm;
}

code { font-family: 'SFMono-Regular', Menlo, Consolas, monospace; font-size: .92em; }
strong { font-weight: 700; }
`.trim()
}

const KATEX_BOOT = `
<link rel="stylesheet" href="./katex/katex.min.css">
<script defer src="./katex/katex.min.js"></script>
<script defer src="./katex/contrib/auto-render.min.js"></script>
<script>
  window.__katexDone = false;
  document.addEventListener('DOMContentLoaded', function () {
    try {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$',  right: '$',  display: false }
        ],
        throwOnError: false,
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
      });
    } finally {
      window.__katexDone = true;
    }
  });
</script>`

/** Wrap generated fragments into the printable document. */
export function buildDocument(opts: { title: string; family: Family; bodyHtml: string }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(opts.title)}</title>
${KATEX_BOOT}
<style>
${stylesheet(opts.family)}
</style>
</head>
<body>
${opts.bodyHtml}
</body>
</html>`
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
}
