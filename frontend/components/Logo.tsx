/**
 * DAO Intelligence Logo Component
 *
 * Unique project mark: balanced scales (neutral on-chain judgment) fused
 * with a ballot check (Snapshot voting) and a hexagonal consensus node,
 * in the project purple. Variants mirror the original layout contract:
 * - "full": Mark + Wordmark (for desktop/larger spaces)
 * - "mark": Mark only (for mobile/compact spaces)
 * - "wordmark": Wordmark only (for specific cases)
 */

import React from 'react';

export type LogoVariant = 'full' | 'mark' | 'wordmark';
export type LogoSize = 'sm' | 'md' | 'lg';
export type LogoTheme = 'light' | 'dark';

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  theme?: LogoTheme;
  className?: string;
}

const sizeMap = {
  sm: { mark: 'w-5 h-5', text: 'text-base' },
  md: { mark: 'w-6 h-6', text: 'text-xl' },
  lg: { mark: 'w-8 h-8', text: 'text-2xl' },
};

export function Logo({
  variant = 'full',
  size = 'md',
  theme = 'dark',
  className = '',
}: LogoProps) {
  const colorClass = theme === 'dark' ? 'text-foreground' : 'text-background';
  const { mark: markSize, text: textSize } = sizeMap[size];

  // DAO Intelligence mark: scales + ballot check + consensus hexagon.
  // Level beam = neutral judgment; left dish carries the vote (check),
  // right dish stays empty (the undecided); hexagon = consensus finial.
  const StrongMark = () => (
    <svg
      className={`${markSize} transition-colors`}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="DAO Intelligence Logo"
      role="img"
    >
      <defs>
        <linearGradient id="dao-mark-g" gradientUnits="userSpaceOnUse" x1="8" y1="4" x2="56" y2="58">
          <stop offset="0" stopColor="#C4A5FD" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      {/* consensus hexagon finial */}
      <path
        fill="url(#dao-mark-g)"
        d="M37.5 9L34.75 13.77L29.25 13.77L26.5 9L29.25 4.23L34.75 4.23Z"
      />
      {/* pillar + beam */}
      <line x1="32" y1="15" x2="32" y2="50" stroke="url(#dao-mark-g)" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="10" y1="22" x2="54" y2="22" stroke="url(#dao-mark-g)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="22" r="2.6" fill="url(#dao-mark-g)" />
      {/* hangers */}
      <g stroke="url(#dao-mark-g)" strokeWidth="2" strokeLinecap="round">
        <line x1="14" y1="22" x2="8" y2="36" />
        <line x1="14" y1="22" x2="20" y2="36" />
        <line x1="50" y1="22" x2="44" y2="36" />
        <line x1="50" y1="22" x2="56" y2="36" />
      </g>
      {/* dishes */}
      <path fill="url(#dao-mark-g)" d="M6 36Q14 46 22 36Z" />
      <path fill="url(#dao-mark-g)" d="M42 36Q50 46 58 36Z" />
      {/* ballot check on the voted dish */}
      <polyline
        points="11,38.4 13.7,41 17.6,35"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* base */}
      <path fill="url(#dao-mark-g)" d="M26 50H38L41.5 58H22.5Z" />
    </svg>
  );

  // Wordmark (using Space Grotesk from layout)
  const Wordmark = () => (
    <span
      className={`${textSize} font-bold ${colorClass} font-[family-name:var(--font-display)] transition-colors`}
      style={{ letterSpacing: '-0.02em' }}
    >
      DAO Intel
    </span>
  );

  if (variant === 'mark') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <StrongMark />
      </div>
    );
  }

  if (variant === 'wordmark') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <Wordmark />
      </div>
    );
  }

  // Full logo (default): Strong Mark + Wordmark
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <StrongMark />
      <Wordmark />
    </div>
  );
}

// Convenience components for common use cases
export function LogoFull(props: Omit<LogoProps, 'variant'>) {
  return <Logo {...props} variant="full" />;
}

export function LogoMark(props: Omit<LogoProps, 'variant'>) {
  return <Logo {...props} variant="mark" />;
}

export function LogoWordmark(props: Omit<LogoProps, 'variant'>) {
  return <Logo {...props} variant="wordmark" />;
}
