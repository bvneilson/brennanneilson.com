'use client';

import { useEffect, useState } from 'react';
import { timeAgo } from '../lib/format.ts';

/**
 * "3 hours ago". The server renders `initial` from its own clock. The browser recomputes it on
 * load and every minute after, so a page left open never drifts.
 */
export function RelativeTime({ iso, initial, title }: { iso: string; initial: string; title?: string }) {
  const [text, setText] = useState(initial);
  useEffect(() => {
    const tick = () => setText(timeAgo(iso, new Date()));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [iso]);
  return (
    <time dateTime={iso} title={title}>
      {text}
    </time>
  );
}
