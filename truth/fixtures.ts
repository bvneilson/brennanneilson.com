// The guard every claim-walk runs under. It keeps walks read-only against production and fails a
// walk on any console error or failed request on the product's own pages.

import { test as base, expect, type Request } from '@playwright/test';
import { projects } from '../src/content/projects.ts';
import type { Project } from '../src/content/types.ts';
import { SITE_SLUG } from './report.ts';

export { expect };

/** Where the self-walk points: the locally served build in CI, production in the nightly run. */
export const SITE_URL = (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// R9: analytics and beacons are aborted on every walk, whatever the method, and never count as a
// failure or a write. Walks would otherwise show up as bot traffic in the products' numbers.
const ANALYTICS_HOST =
  /(^|\.)(google-analytics\.com|analytics\.google\.com|googletagmanager\.com|plausible\.io|posthog\.com|segment\.io|segment\.com|vercel-insights\.com)$/i;
const ANALYTICS_PATH = /^\/_vercel\/(insights|speed-insights)\//;

export function isAnalytics(url: string): boolean {
  try {
    const u = new URL(url);
    return ANALYTICS_HOST.test(u.hostname) || ANALYTICS_PATH.test(u.pathname);
  } catch {
    return false;
  }
}

export function projectFor(slug: string): Project {
  const project = projects.find((p) => p.slug === slug);
  if (!project) throw new Error(`No project "${slug}" in src/content/projects.ts`);
  return project;
}

const bareHost = (url: string) => new URL(url).hostname.replace(/^www\./, '');

/**
 * True when `url` is on the walked site (same host or a subdomain). Unknown or non-http URLs count
 * as on-site, so the guard errs toward reporting. Third-party pages a walk lands on (Stripe
 * Checkout) are off-site: the walk asserts what it needs there, and their own noise is not the
 * product's.
 */
function onSiteOf(home: string): (url: string | undefined) => boolean {
  const host = bareHost(home);
  return (url) => {
    if (!url || !/^https?:/.test(url)) return true;
    const h = bareHost(url);
    return h === host || h.endsWith(`.${host}`);
  };
}

/** URL of the page that issued `req`, if it has one (service-worker requests don't). */
function pageUrlOf(req: Request): string | undefined {
  try {
    return req.frame().page().url();
  } catch {
    return undefined;
  }
}

export const test = base.extend<{ guard: void }>({
  guard: [
    async ({ context }, use, testInfo) => {
      // titlePath is [file, describe..., test]. The top-level describe title is the slug.
      if (testInfo.titlePath.length < 3) throw new Error('A walk must sit inside test.describe(<slug>)');
      const slug = testInfo.titlePath[1];
      const home = slug === SITE_SLUG ? SITE_URL : projectFor(slug).url;
      const allowWrites = (slug === SITE_SLUG ? [] : (projectFor(slug).allowWrites ?? [])).map((s) => new RegExp(s));
      const onSite = onSiteOf(home);

      const blocked = new Set<Request>();
      const blockedUrls = new Set<string>();
      const consoleErrors: string[] = [];
      const failedRequests: string[] = [];

      await context.route('**/*', (route) => {
        const req = route.request();
        const url = req.url();
        const write = !READ_METHODS.has(req.method());
        if (isAnalytics(url) || (write && !allowWrites.some((re) => re.test(url)))) {
          blocked.add(req);
          blockedUrls.add(url);
          return route.abort('blockedbyclient');
        }
        return route.fallback();
      });

      context.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        const pageUrl = msg.page()?.url();
        if (!onSite(pageUrl)) return;
        const at = msg.location().url;
        // Chrome logs "Failed to load resource" for every request we blocked. That's ours, not the page's.
        if (at && blockedUrls.has(at)) return;
        consoleErrors.push(`${msg.text()}${at ? ` @ ${at}` : ''} (on ${pageUrl})`);
      });
      context.on('weberror', (err) => {
        const pageUrl = err.page()?.url();
        if (!onSite(pageUrl)) return;
        consoleErrors.push(`uncaught: ${err.error().message} (on ${pageUrl})`);
      });
      context.on('requestfailed', (req) => {
        if (blocked.has(req) || isAnalytics(req.url())) return;
        const why = req.failure()?.errorText ?? 'failed';
        // ERR_ABORTED is the browser cancelling its own request (it navigated on, or a prefetch was
        // superseded). No server ever answered it, so it isn't a failure of the product.
        if (why === 'net::ERR_ABORTED') return;
        const pageUrl = pageUrlOf(req);
        if (!onSite(pageUrl)) return;
        failedRequests.push(`${why} ${req.method()} ${req.url()} (on ${pageUrl})`);
      });
      context.on('response', (res) => {
        if (res.status() < 400 || isAnalytics(res.url())) return;
        const pageUrl = pageUrlOf(res.request());
        if (!onSite(pageUrl)) return;
        failedRequests.push(`${res.status()} ${res.request().method()} ${res.url()} (on ${pageUrl})`);
      });

      await use();

      if (testInfo.status !== testInfo.expectedStatus && blockedUrls.size) {
        await testInfo.attach('blocked-requests', { body: [...blockedUrls].join('\n'), contentType: 'text/plain' });
      }
      expect({ consoleErrors, failedRequests }, 'the walk saw errors on the product').toEqual({
        consoleErrors: [],
        failedRequests: [],
      });
    },
    { auto: true },
  ],
});
