export const siteName = "Brennan Neilson";

export const GITHUB_URL = "https://github.com/bvneilson";
export const LINKEDIN_URL = "https://www.linkedin.com/in/brennanneilson";
export const BRENNAN_BUILDS_URL = "https://brennanbuilds.dev";
export const SOURCE_REPO_URL = "https://github.com/bvneilson/brennanneilson.com";

/** The address in two parts. The page joins them in the browser, so the HTML never holds it. */
export const EMAIL_PARTS = { user: "bvneilson", domain: "gmail.com" } as const;

/** The open-sourced agent-reaper package (GitHub release only, not on npm). The band hides if this is null. */
export const OPEN_SOURCE_REPO: string | null = "https://github.com/bvneilson/agent-reaper";

/**
 * The COO case study page. The home teaser links to it only while this is set: the site walk fails
 * on any dead internal link.
 */
export const COO_CASE_STUDY_PATH: string | null = "/coo";

export const RESUME_PATH = "/resume";
/** Printed from /resume by scripts/resume-pdf.ts. A plain <a>, never next/link, which would prefetch it. */
export const RESUME_PDF_PATH = "/resume.pdf";
export const RESUME_PDF_FILENAME = "Brennan-Neilson-Resume.pdf";
