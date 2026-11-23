// Prints every copy string (copy.ts, then coo.ts) as its own paragraph, for the voice gate.
// Runs under plain `node` (R3): relative `.ts` imports and erasable syntax only.
//
//   node scripts/copy-text.ts > copy.txt

import { coo } from '../src/content/coo.ts';
import { copy } from '../src/content/copy.ts';

/** Every non-empty string leaf under `value`, depth first, in key order. */
export function copyStrings(value: unknown): string[] {
  if (typeof value === 'string') return value === '' ? [] : [value];
  if (Array.isArray(value)) return value.flatMap(copyStrings);
  if (typeof value === 'object' && value !== null) return Object.values(value).flatMap(copyStrings);
  return [];
}

if (import.meta.main) process.stdout.write(`${copyStrings([copy, coo]).join('\n\n')}\n`);
