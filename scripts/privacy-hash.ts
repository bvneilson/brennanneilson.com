import { createHash } from 'node:crypto'

// Tokens are runs of letters/digits, with inner hyphens kept so a hyphenated
// name ("foo-bar") stays one token. Everything else separates tokens.
export function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? []
}

export function normalizeTerm(term: string): string {
  return tokenize(term).join(' ')
}

export function hashTerm(term: string): string {
  return createHash('sha256').update(normalizeTerm(term)).digest('hex')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const terms = process.argv.slice(2)
  if (terms.length === 0) {
    console.error('usage: node scripts/privacy-hash.ts "<term>" [...]')
    process.exit(2)
  }
  for (const t of terms) console.log(hashTerm(t))
}
