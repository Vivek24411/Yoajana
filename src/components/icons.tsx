import type { SVGProps } from "react";

/** Line icons (24px grid, 1.75 stroke). Inline SVG: no icon font to download on slow networks. */
const PATHS = {
  mic: (
    <>
      <rect x="9" y="2.5" width="6" height="12" rx="3" />
      <path d="M5 10.5a7 7 0 0 0 14 0" />
      <path d="M12 17.5V21" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  x: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  chevronRight: <path d="m9 18 6-6-6-6" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  arrowLeft: (
    <>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </>
  ),
  arrowUp: (
    <>
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </>
  ),
  home: (
    <>
      <path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5.5v-6.5h-5V21H4a1 1 0 0 1-1-1z" />
    </>
  ),
  chat: <path d="M20 12a8 8 0 0 1-11.8 7L4 20l1.1-4A8 8 0 1 1 20 12Z" />,
  list: (
    <>
      <path d="m3.5 6.5 1.5 1.5 3-3" />
      <path d="m3.5 13.5 1.5 1.5 3-3" />
      <path d="M12 7h8.5" />
      <path d="M12 14h8.5" />
      <path d="M12 20.5h8.5" />
      <path d="M4 20.5h4" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  lifebuoy: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.75" />
      <path d="m5.6 5.6 3.75 3.75" />
      <path d="m14.65 14.65 3.75 3.75" />
      <path d="m18.4 5.6-3.75 3.75" />
      <path d="m9.35 14.65-3.75 3.75" />
    </>
  ),
  phone: (
    <path d="M21 16.4v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.1 3.6 2 2 0 0 1 3.1 1.5h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L7.1 9.4a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.45c.9.34 1.84.57 2.8.7a2 2 0 0 1 1.7 2Z" />
  ),
  bookmark: <path d="M18 21 12 17 6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" />,
  share: (
    <>
      <path d="M12 3v12" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </>
  ),
  volume: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6" />
      <path d="M18.5 6a8 8 0 0 1 0 12" />
    </>
  ),
  stop: <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" stroke="none" />,
  send: (
    <>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </>
  ),
  wheat: (
    <>
      <path d="M12 21V9" />
      <path d="M12 13c-2.5 0-4.5-2-4.5-4.5C10 8.5 12 10.5 12 13Z" />
      <path d="M12 13c2.5 0 4.5-2 4.5-4.5C14 8.5 12 10.5 12 13Z" />
      <path d="M12 17.5c-2.5 0-4.5-2-4.5-4.5 2.5 0 4.5 2 4.5 4.5Z" />
      <path d="M12 17.5c2.5 0 4.5-2 4.5-4.5-2.5 0-4.5 2-4.5 4.5Z" />
      <path d="M12 8.5c-1.4-1-1.4-3.5 0-5.5 1.4 2 1.4 4.5 0 5.5Z" />
    </>
  ),
  heart: (
    <>
      <path d="M19.5 13.5 12 21l-7.5-7.5A5 5 0 0 1 12 6.6a5 5 0 0 1 7.5 6.9Z" />
      <path d="M3.5 12h4l1.5-2.5 2.5 5 2-3.5h7" />
    </>
  ),
  cap: (
    <>
      <path d="M2 9.5 12 5l10 4.5-10 4.5z" />
      <path d="M6 11.5v5c3.5 2.7 8.5 2.7 12 0v-5" />
      <path d="M22 9.5v5" />
    </>
  ),
  house: (
    <>
      <path d="M3 11 12 4l9 7" />
      <path d="M5 9.5V20h14V9.5" />
      <path d="M10 20v-5.5h4V20" />
    </>
  ),
  banknote: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 9.5v5" />
      <path d="M18 9.5v5" />
    </>
  ),
  hardhat: (
    <>
      <path d="M3 18h18v-2H3z" />
      <path d="M4.5 16a7.5 7.5 0 0 1 15 0" />
      <path d="M10 8.7V5.5h4v3.2" />
    </>
  ),
  accessibility: (
    <>
      <circle cx="13" cy="4" r="1.6" />
      <path d="M13 7.5v6h5l1.5 5.5" />
      <path d="M9 10.3a6 6 0 1 0 6.9 8.2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
      <path d="M18.5 14.3a6.5 6.5 0 0 1 3 5.7" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  userPlus: (
    <>
      <circle cx="10" cy="8" r="4" />
      <path d="M3 21a7 7 0 0 1 12.5-4.3" />
      <path d="M19 14v6" />
      <path d="M16 17h6" />
    </>
  ),
  elder: (
    <>
      <circle cx="11" cy="4.5" r="2" />
      <path d="M8.5 21 10 14l-2-2.5 1-4.5h3.5l1.5 3.5h2.5" />
      <path d="M12 14l1.5 7" />
      <path d="M18 10.5V21" />
    </>
  ),
  baby: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 10.5h.01" />
      <path d="M15 10.5h.01" />
      <path d="M9.5 15a3.5 3.5 0 0 0 5 0" />
      <path d="M12 3c-1.5 1.5-1 3 .5 3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 21.5c4.5-1.6 8-4.4 8-9.5V5.5L12 2.5 4 5.5V12c0 5.1 3.5 7.9 8 9.5Z" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4" />
      <path d="M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4.5" />
      <path d="M12 8h.01" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </>
  ),
  file: (
    <>
      <path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z" />
      <path d="M14 2.5V8h5.5" />
      <path d="M8.5 13h7" />
      <path d="M8.5 17h5" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" />,
  type: (
    <>
      <path d="M3 7V5h11v2" />
      <path d="M8.5 5v14" />
      <path d="M6.5 19h4" />
      <path d="M14 12v-1.5h7V12" />
      <path d="M17.5 10.5V19" />
      <path d="M16 19h3" />
    </>
  ),
  mapPin: (
    <>
      <path d="M19.5 10c0 5-5.6 10.3-7.1 11.6a.6.6 0 0 1-.8 0C10.1 20.3 4.5 15 4.5 10a7.5 7.5 0 0 1 15 0Z" />
      <circle cx="12" cy="10" r="2.75" />
    </>
  ),
  rupee: (
    <>
      <path d="M6.5 3.5h11" />
      <path d="M6.5 8.5h11" />
      <path d="M6.5 13.5h3c6 0 6-10 0-10" />
      <path d="m9.5 13.5 8 7" />
    </>
  ),
  flame: (
    <path d="M12 21.5a7 7 0 0 0 7-7c0-4-3-6.5-4.5-9.5-.6 2.6-2 4.2-3.5 5-.8-1.3-1-2.6-1-4-2.5 2-5 5.2-5 8.5a7 7 0 0 0 7 7Z" />
  ),
  siren: (
    <>
      <path d="M6 18v-6a6 6 0 0 1 12 0v6" />
      <path d="M4 21h16v-3H4z" />
      <path d="M12 2v2M3.5 6l1.5 1.2M20.5 6 19 7.2" />
    </>
  ),
  trash: (
    <>
      <path d="M3.5 6h17" />
      <path d="M18.5 6v13a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </>
  ),
  refresh: (
    <>
      <path d="M3.5 12a8.5 8.5 0 0 1 14.6-5.9L20.5 8.5" />
      <path d="M20.5 3.5v5h-5" />
      <path d="M20.5 12a8.5 8.5 0 0 1-14.6 5.9L3.5 15.5" />
      <path d="M3.5 20.5v-5h5" />
    </>
  ),
  pencil: (
    <>
      <path d="M17 3.5a2.1 2.1 0 0 1 3 3L8 18.5l-4 1 1-4z" />
      <path d="m15 5.5 3 3" />
    </>
  ),
  wifiOff: (
    <>
      <path d="M12 20h.01" />
      <path d="M8.5 16.4a5 5 0 0 1 7 0" />
      <path d="M5 12.9a10 10 0 0 1 5.2-2.7" />
      <path d="M19 12.9a10 10 0 0 0-2-1.5" />
      <path d="M2 8.8a15 15 0 0 1 4.2-2.6" />
      <path d="M22 8.8a15 15 0 0 0-11.3-3.8" />
      <path d="m2 2 20 20" />
    </>
  ),
  village: (
    <>
      <path d="M2.5 21h19" />
      <path d="M4 21v-8l5-4 5 4v8" />
      <path d="M7.5 21v-4h3v4" />
      <path d="M17.5 21v-6" />
      <path d="M17.5 15c-2 0-3-1.6-3-3.3 0-2 1.6-4.2 3-5.7 1.4 1.5 3 3.7 3 5.7 0 1.7-1 3.3-3 3.3Z" />
    </>
  ),
  city: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V8l6-3v16" />
      <path d="M11 21V10h8v11" />
      <path d="M8 10v.01M8 13v.01M8 16v.01M14.5 13.5h1M14.5 16.5h1" />
    </>
  ),
  fish: (
    <>
      <path d="M3 12c2.5-4 6-6 10-6 4.5 0 7.5 3 8 6-.5 3-3.5 6-8 6-4 0-7.5-2-10-6Z" />
      <path d="M3 12 1 9M3 12l-2 3" />
      <path d="M16.5 10.5h.01" />
    </>
  ),
  store: (
    <>
      <path d="M3.5 9.5 5 4h14l1.5 5.5" />
      <path d="M3.5 9.5a2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.6 0" />
      <path d="M5 12v9h14v-9" />
      <path d="M10 21v-5h4v5" />
    </>
  ),
  hammer: (
    <>
      <path d="m14 10-9.5 9.5a1.4 1.4 0 0 1-2-2L12 8" />
      <path d="m11 6 4.5-3 5.5 5.5-3 4.5z" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2.5" y="7" width="19" height="13.5" rx="2" />
      <path d="M8.5 7V5a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 5v2" />
      <path d="M2.5 13h19" />
    </>
  ),
  medal: (
    <>
      <circle cx="12" cy="14.5" r="6" />
      <path d="M8.5 9.6 6 2.5h4l2 4.5 2-4.5h4l-2.5 7.1" />
    </>
  ),
  dots: (
    <>
      <circle cx="5.5" cy="12" r="1.25" fill="currentColor" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1.25" fill="currentColor" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 24, strokeWidth = 1.75, ...rest }: { name: IconName; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

/** Brand mark: a round office seal with "यो", in the accent ink. */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden focusable="false">
      <circle cx="20" cy="20" r="18.5" fill="none" stroke="var(--accent)" strokeWidth="2" />
      <circle cx="20" cy="20" r="15" fill="var(--accent)" />
      <text x="20" y="26.5" textAnchor="middle" fontFamily="var(--font-rozha), serif" fontSize="17" fill="var(--paper)">
        यो
      </text>
    </svg>
  );
}
