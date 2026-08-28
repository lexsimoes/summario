// Model ids and pricing change. Ask the API what this key can actually call,
// then paste the ids you want into .env.
const key = process.env.ANTHROPIC_API_KEY
if (!key) {
  console.error('ANTHROPIC_API_KEY is not set.')
  process.exit(1)
}
const res = await fetch('https://api.anthropic.com/v1/models?limit=100', {
  headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
})
if (!res.ok) {
  console.error(`${res.status} ${res.statusText}`, await res.text())
  process.exit(1)
}
const { data } = await res.json()
for (const m of data) console.log(`${m.id.padEnd(38)} ${m.display_name ?? ''}`)
console.log('\nPricing: https://www.anthropic.com/pricing  ·  Models: https://docs.claude.com/en/docs/about-claude/models')
