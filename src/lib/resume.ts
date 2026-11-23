// The public resume, parsed from src/content/resume.md. Pure: no imports, so the pages, the
// nightly resume check and the PDF printer (both run by plain node, R3) share one reading.
//
// resume.md is a deliberately small markdown subset, and anything outside it throws. A construct
// the pages don't render must fail the build, never ship as literal markdown or silently vanish:
//
//   ---                                front-matter with reviewedAt (required)
//   reviewedAt: 2026-11-23
//   ---
//   # Name
//   Headline                          one paragraph
//   City, ST · email · site · site    the contact line, split on " · "
//   ## Section                        then paragraphs and "- " bullets
//   ### Title · Subtitle              an entry (a role, a school), then
//   *dates*                           its dates on the next line, then paragraphs and bullets
//
// Inline, only **bold** is supported.

export const RESUME_HASH_PREFIX = 'sha256:';

export type ResumeBlock = { kind: 'paragraph'; text: string } | { kind: 'list'; items: string[] };
export type ResumeEntry = { title: string; subtitle?: string; when?: string; blocks: ResumeBlock[] };
export type ResumeSection = { title: string; blocks: ResumeBlock[]; entries: ResumeEntry[] };
export type Resume = {
  reviewedAt: string;
  name: string;
  headline: string;
  contact: string[];
  sections: ResumeSection[];
};

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const SEPARATOR = ' · ';

/** The `reviewedAt` value from the leading `---` front-matter block, or undefined. */
export function readReviewedAt(markdown: string): string | undefined {
  const block = FRONT_MATTER.exec(markdown);
  if (!block) return undefined;
  const line = /^reviewedAt:\s*(.+?)\s*$/m.exec(block[1]);
  return line?.[1].replace(/^["']|["']$/g, '');
}

/** The PDF's Subject: the hash of the resume.md it was printed from. */
export function resumeSubject(hex: string): string {
  return `${RESUME_HASH_PREFIX}${hex}`;
}

/** Hex SHA-256 of `text` as UTF-8, via Web Crypto (global in Node 24 and in the page runtime). */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** `**bold**` runs and plain runs, in order. */
export function inlineSegments(text: string): { text: string; strong: boolean }[] {
  return text
    .split(/\*\*(.+?)\*\*/)
    .map((t, i) => ({ text: t, strong: i % 2 === 1 }))
    .filter((s) => s.text !== '');
}

export function experienceOf(resume: Resume): ResumeEntry[] {
  return resume.sections.find((s) => s.title === 'Experience')?.entries ?? [];
}

function fail(lineNo: number, why: string): never {
  throw new Error(`src/content/resume.md:${lineNo}: ${why}`);
}

/** Inline text must be plain words plus balanced **bold**. Anything else is unsupported. */
function checkInline(text: string, lineNo: number): void {
  if ((text.match(/\*\*/g) ?? []).length % 2 !== 0) fail(lineNo, 'unclosed **bold**');
  const rest = text.replace(/\*\*(.+?)\*\*/g, '$1');
  if (/[*_`<>]|\[[^\]]*\]\(/.test(rest)) fail(lineNo, `unsupported inline markdown in "${text}"`);
}

function splitHeading(text: string): { title: string; subtitle?: string } {
  const at = text.indexOf(SEPARATOR);
  return at === -1 ? { title: text } : { title: text.slice(0, at), subtitle: text.slice(at + SEPARATOR.length) };
}

export function parseResume(markdown: string): Resume {
  const front = FRONT_MATTER.exec(markdown);
  const reviewedAt = readReviewedAt(markdown);
  if (!front || reviewedAt === undefined) throw new Error('src/content/resume.md: front-matter needs a reviewedAt');

  const offset = front[0].split('\n').length - 1;
  const lines = markdown.slice(front[0].length).split(/\r?\n/);

  let name: string | undefined;
  const header: string[] = [];
  const sections: ResumeSection[] = [];
  let section: ResumeSection | undefined;
  let entry: ResumeEntry | undefined;
  let paragraph: string[] = [];
  let list: string[] | undefined;
  let expectWhen = false;

  const blocks = (n: number): ResumeBlock[] => {
    if (entry) return entry.blocks;
    if (section) return section.blocks;
    return fail(n, 'content before the first ## section');
  };
  const flush = (n: number) => {
    if (paragraph.length) {
      const text = paragraph.join(' ');
      if (section) blocks(n).push({ kind: 'paragraph', text });
      else if (name !== undefined) header.push(text);
      else fail(n, 'text before the # name');
    }
    paragraph = [];
    list = undefined;
  };

  lines.forEach((raw, i) => {
    const n = i + 1 + offset;
    const line = raw.trimEnd();
    const when = expectWhen;
    expectWhen = false;

    if (line === '') return flush(n);
    if (/^#\s/.test(line)) {
      if (name !== undefined || section) fail(n, 'a second # name');
      flush(n);
      name = line.slice(2).trim();
      return;
    }
    if (/^##\s/.test(line)) {
      flush(n);
      if (name === undefined) fail(n, 'a section before the # name');
      entry = undefined;
      section = { title: line.slice(3).trim(), blocks: [], entries: [] };
      sections.push(section);
      return;
    }
    if (/^###\s/.test(line)) {
      flush(n);
      if (!section) fail(n, 'an entry outside a section');
      checkInline(line.slice(4), n);
      entry = { ...splitHeading(line.slice(4).trim()), blocks: [] };
      section.entries.push(entry);
      expectWhen = true;
      return;
    }
    if (when && entry && /^\*[^*].*[^*]\*$/.test(line) && entry.blocks.length === 0) {
      entry.when = line.slice(1, -1).trim();
      return;
    }
    if (/^#/.test(line)) fail(n, `unsupported heading "${line}"`);
    if (/^(>|\d+[.)]\s|[*+]\s|-{3,}$|\||```|~~~)/.test(line)) fail(n, `unsupported markdown "${line}"`);
    if (/^-\s/.test(line)) {
      if (paragraph.length) flush(n);
      const item = line.slice(2).trim();
      checkInline(item, n);
      if (!list) {
        list = [];
        blocks(n).push({ kind: 'list', items: list });
      }
      list.push(item);
      return;
    }
    if (list) fail(n, 'a list item must be one line, with a blank line before the next paragraph');
    checkInline(line, n);
    paragraph.push(line.trim());
  });
  flush(lines.length + offset);

  if (name === undefined) throw new Error('src/content/resume.md: missing the # name');
  if (header.length !== 2) {
    throw new Error('src/content/resume.md: the header needs exactly a headline paragraph and a contact line');
  }
  return {
    reviewedAt,
    name,
    headline: header[0],
    contact: header[1].split(SEPARATOR).map((s) => s.trim()),
    sections,
  };
}
