import { copy } from '../content/copy.ts';
import { BRENNAN_BUILDS_URL, EMAIL_PARTS, GITHUB_URL, LINKEDIN_URL } from '../content/site.ts';
import { EmailLink } from './email-link.tsx';
import { ArrowRightIcon, ArrowUpRightIcon } from './icons.tsx';

const handle = (url: string) => url.replace(/^https:\/\/(www\.)?/, '');

/** Email, GitHub, LinkedIn, and the one path for customers: Brennan Builds. */
export function Contact() {
  const { contact } = copy;
  return (
    <section id="contact" aria-labelledby="contact-heading" className="wrap scroll-mt-8 pt-24 sm:pt-32">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="eyebrow">{contact.label}</p>
          <h2 id="contact-heading" className="section-title mt-5">
            {contact.heading}
          </h2>
          <p className="mt-6 max-w-[30rem] text-lg leading-relaxed text-ink-2">{contact.body}</p>
        </div>
        <div className="lg:col-span-7">
          <ul className="border-t border-ink">
            <li>
              <EmailLink
                user={EMAIL_PARTS.user}
                domain={EMAIL_PARTS.domain}
                className="contact-row"
                addressClassName="contact-handle"
                trailing={<ArrowUpRightIcon className="contact-arrow" />}
              >
                <span className="contact-label">{contact.email}</span>
              </EmailLink>
            </li>
            {[
              [contact.github, GITHUB_URL],
              [contact.linkedin, LINKEDIN_URL],
            ].map(([label, url]) => (
              <li key={url}>
                <a href={url} className="contact-row">
                  <span className="contact-label">{label}</span>
                  <span className="contact-handle">{handle(url)}</span>
                  <ArrowUpRightIcon className="contact-arrow" />
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col items-start gap-3 rounded-lg bg-card p-6 ring-1 ring-rule sm:p-7">
            <p className="text-ink-2">{contact.studio}</p>
            <a href={BRENNAN_BUILDS_URL} className="link inline-flex shrink-0 items-center gap-2 font-medium">
              {contact.studioLink}
              <ArrowRightIcon />
              {contact.studioName}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
