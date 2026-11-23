'use client';

import { useEffect, useState, type ReactNode } from 'react';

/**
 * A mailto link the browser assembles after load, so the address never sits whole in the HTML
 * that scrapers read. Until then it renders without an href and without the address.
 */
export function EmailLink({
  user,
  domain,
  className,
  addressClassName,
  children,
  trailing,
}: {
  user: string;
  domain: string;
  className?: string;
  addressClassName?: string;
  /** The link's label, before the address. */
  children: ReactNode;
  /** Rendered after the address, e.g. an icon. */
  trailing?: ReactNode;
}) {
  const [address, setAddress] = useState<string | null>(null);
  useEffect(() => setAddress(`${user}@${domain}`), [user, domain]);
  return (
    <a href={address ? `mailto:${address}` : undefined} className={className}>
      {children}
      <span className={addressClassName}>{address}</span>
      {trailing}
    </a>
  );
}
