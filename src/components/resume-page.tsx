import type { ReactNode } from 'react';
import { copy } from '../content/copy.ts';
import { longDate } from '../lib/format.ts';
import { inlineSegments, type Resume, type ResumeBlock, type ResumeEntry, type ResumeSection } from '../lib/resume.ts';
import { resumeFreshness } from '../lib/resume-freshness.ts';
import { EmailLink } from './email-link.tsx';
import { ResumePdfLink } from './resume-pdf-link.tsx';

/**
 * The web resume, rendered from resume.md. It is also the page scripts/resume-pdf.ts prints, so its
 * print styles are the PDF's layout, and `data-resume-sha256` tells the printer which source this
 * server rendered. Once the last review is 120 days old, the body is replaced by a one-line note.
 */
export function ResumePage({ resume, sourceHash, now }: { resume: Resume; sourceHash: string; now: Date }) {
  const { resume: text } = copy;
  if (resumeFreshness(resume.reviewedAt, now) === 'hidden') {
    return (
      <main id="main" className="wrap">
        <header className="pt-14 sm:pt-24">
          <p className="eyebrow">{text.label}</p>
          <h1 className="section-title mt-5">{resume.name}</h1>
          <p className="mt-8 text-lg leading-relaxed text-ink-2">{text.refreshing}</p>
        </header>
      </main>
    );
  }
  return (
    <main id="main" className="wrap">
      <article data-resume-sha256={sourceHash} aria-labelledby="resume-name" className="resume">
        <header className="resume-head">
          <div>
            <p className="eyebrow print:hidden">{text.label}</p>
            <h1 id="resume-name" className="resume-name">
              {resume.name}
            </h1>
            <p className="resume-headline">{resume.headline}</p>
          </div>
          <div className="resume-aside">
            <ul aria-label={text.contactLabel} className="resume-contact">
              {/* Keyed by position: a key ships in the page payload, and the email must not. */}
              {resume.contact.map((item, i) => (
                <li key={i}>
                  <ContactItem item={item} />
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 print:hidden">
              <ResumePdfLink className="button">{text.pdf}</ResumePdfLink>
              <p className="font-mono text-xs text-muted">
                {text.reviewed} <time dateTime={resume.reviewedAt}>{longDate(resume.reviewedAt)}</time>
              </p>
            </div>
            <p className="mt-3 max-w-[24rem] text-sm leading-relaxed text-muted print:hidden">{text.pdfNote}</p>
          </div>
        </header>
        {resume.sections.map((s) => (
          <Section key={s.title} section={s} />
        ))}
      </article>
    </main>
  );
}

const EMAIL = /^([^@\s]+)@([^@\s]+)$/;
const SITE = /^[a-z0-9.-]+\.[a-z]{2,}\/\S*$/i;

/** A contact-line item: an email (assembled in the browser), a site (linked over https), or text. */
function ContactItem({ item }: { item: string }) {
  const email = EMAIL.exec(item);
  if (email) {
    return (
      <EmailLink user={email[1]} domain={email[2]} className="link">
        <span className="sr-only">Email </span>
      </EmailLink>
    );
  }
  if (SITE.test(item)) {
    return (
      <a href={`https://${item}`} className="link">
        {item}
      </a>
    );
  }
  return <>{item}</>;
}

const slug = (title: string) => `resume-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

function Section({ section }: { section: ResumeSection }) {
  const id = slug(section.title);
  return (
    <section aria-labelledby={id} className="resume-section">
      <h2 id={id} className="resume-label">
        {section.title}
      </h2>
      <div className="resume-body">
        <Blocks blocks={section.blocks} />
        {section.entries.map((e) => (
          <Entry key={`${e.title}-${e.when ?? ''}`} entry={e} />
        ))}
      </div>
    </section>
  );
}

function Entry({ entry }: { entry: ResumeEntry }) {
  return (
    <div className="resume-entry">
      <div className="resume-entry-head">
        <h3 className="resume-entry-title">
          <span className="resume-org">{entry.title}</span>
          {entry.subtitle && (
            <>
              <span className="resume-dot"> · </span>
              <span className="resume-role">{entry.subtitle}</span>
            </>
          )}
        </h3>
        {entry.when && <p className="resume-when">{entry.when}</p>}
      </div>
      <Blocks blocks={entry.blocks} />
    </div>
  );
}

function Blocks({ blocks }: { blocks: ResumeBlock[] }) {
  return blocks.map((b, i) =>
    b.kind === 'paragraph' ? (
      <p key={i} className="resume-p">
        <Inline text={b.text} />
      </p>
    ) : (
      // A list whose every item opens with a bold label (Skills) reads as rows, not bullets.
      <ul key={i} className={b.items.every((t) => t.startsWith('**')) ? 'resume-rows' : 'resume-bullets'}>
        {b.items.map((t) => (
          <li key={t}>
            <Inline text={t} />
          </li>
        ))}
      </ul>
    ),
  );
}

function Inline({ text }: { text: string }): ReactNode {
  return inlineSegments(text).map((s, i) => (s.strong ? <strong key={i}>{s.text}</strong> : s.text));
}
