/** Validate an already-rendered PDF: npm run validate -- data/.../doc.pdf */
import { validatePdf } from '../src/lib/validate'
import { formatReport } from '../src/lib/pipeline'

const file = process.argv[2]
if (!file) {
  console.error('usage: npm run validate -- <file.pdf>')
  process.exit(1)
}
const r = await validatePdf(file)
console.log(formatReport(file, r))
process.exit(r.ok ? 0 : 1)
