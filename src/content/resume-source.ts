// The resume as the pages see it, bundled from resume.md at build time (the `?raw` rule in
// next.config.ts), so no page reads the file system. A malformed resume.md throws here and fails
// the build. Plain node scripts can't take a `?raw` import, so they read the file themselves.
import source from './resume.md?raw';
import { parseResume, sha256Hex } from '../lib/resume.ts';

export const resume = parseResume(source);

/** Hex SHA-256 of the bundled resume.md. The PDF's Subject must carry the same hash. */
export const resumeSourceHash: Promise<string> = sha256Hex(source);
