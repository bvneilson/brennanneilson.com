// The site's own claim, proven by truth/site.spec.ts. Pure data with no imports, so both the
// report CLI (run by plain node, R3) and the pages can read it.

/** The self-walk's slug. It is not a Project, so it is appended to every result set. */
export const SITE_SLUG = 'site';
// Only what truth/site.spec.ts proves (R15): each clause has its own walk there.
export const SITE_CLAIM = 'This site: every link works, the resume PDF downloads, and nothing errors.';
