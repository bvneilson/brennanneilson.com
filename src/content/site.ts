export const siteName = "Brennan Neilson";

export const GITHUB_URL = "https://github.com/bvneilson";
export const LINKEDIN_URL = "https://www.linkedin.com/in/brennanneilson";
export const BRENNAN_BUILDS_URL = "https://brennanbuilds.dev";
export const SOURCE_REPO_URL = "https://github.com/bvneilson/brennanneilson.com";

/** The address in two parts. The page joins them in the browser, so the HTML never holds it. */
export const EMAIL_PARTS = { user: "bvneilson", domain: "gmail.com" } as const;

/** The open-sourced COO piece. Stays null until its public repo exists, and the band hides until then. */
export const OPEN_SOURCE_REPO: string | null = null;

/**
 * The COO case study page. Stays null until that page exists: the site walk fails on any dead
 * internal link, so the home teaser links to it only once it ships.
 */
export const COO_CASE_STUDY_PATH: string | null = null;
