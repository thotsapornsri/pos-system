import type { CSSProperties } from 'react';

const PATHS = {
  home: <><path d="M3 11l9-7 9 7" /><path d="M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" /></>,
  sales: <><rect x="3" y="8" width="7" height="7" rx="1.5" /><rect x="14" y="8" width="7" height="7" rx="1.5" /><rect x="3" y="3" width="18" height="2" rx="1" /></>,
  products: <><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v10l9 4 9-4V7" /><path d="M12 11v10" /></>,
  bom: <><path d="M4 7l8-4 8 4-8 4-8-4z" /><path d="M4 12l8 4 8-4" /><path d="M4 7v10M20 7v10M12 11v10" /></>,
  dashboard: <><rect x="3" y="12" width="4" height="8" rx="1" /><rect x="10" y="7" width="4" height="13" rx="1" /><rect x="17" y="3" width="4" height="17" rx="1" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6" /><circle cx="17.5" cy="9" r="2.4" /><path d="M15.5 20c0-2.6 1.6-4.6 4-5.2" /></>,
  settings: <><circle cx="12" cy="12" r="3.2" /><path d="M12 3v2.4M12 18.6V21M21 12h-2.4M5.4 12H3M18 6l-1.6 1.6M7.6 16.4L6 18M18 18l-1.6-1.6M7.6 7.6L6 6" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  bell: <><path d="M6 8a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z" /><path d="M10 20a2 2 0 004 0" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></>,
  trash: <><path d="M3 6h18" /><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></>,
  doc: <><path d="M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" /><path d="M9 12h6M9 16h6M9 8h2" /></>,
  docLines: <><path d="M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" /><path d="M9 12h6M9 16h4" /></>,
  sheet: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 4v16" /></>,
  cart: <><path d="M6 3h12l-1 13H7L6 3z" /><path d="M9 8v-.5a3 3 0 016 0V8" /><circle cx="9" cy="20" r="1.4" /><circle cx="16" cy="20" r="1.4" /></>,
  po: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h5" /></>,
  inbox: <><rect x="3" y="9" width="18" height="4" rx="1" /><path d="M5 13v6a1 1 0 001 1h12a1 1 0 001-1v-6" /><path d="M10 17h4" /></>,
  calendarDay: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /><rect x="7" y="12" width="4" height="4" rx="0.5" /></>,
  calendarMonth: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /><path d="M7 14h3M14 14h3M7 17h3" /></>,
  bars: <><rect x="4" y="13" width="3" height="7" rx="0.5" /><rect x="10.5" y="8" width="3" height="12" rx="0.5" /><rect x="17" y="4" width="3" height="16" rx="0.5" /></>,
  swap: <><path d="M7 7h11l-3-3M17 17H6l3 3" /></>,
  shield: <><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><path d="M9.5 12l1.8 1.8L14.5 10" /></>,
  print: <><path d="M6 9V3h12v6" /><rect x="4" y="9" width="16" height="8" rx="1" /><path d="M6 17h12v5H6z" /></>,
  reset: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></>,
  tag: <><path d="M12 2H4a1 1 0 00-1 1v8l10.6 10.6a2 2 0 002.8 0l6.2-6.2a2 2 0 000-2.8L12 2z" /><circle cx="7.5" cy="7.5" r="1.4" /></>,
  copy: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1" /></>,
  wallet: <><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 10h18" /><circle cx="16.5" cy="14.5" r="1.3" /></>,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  chevronLeft: <path d="M15 6l-6 6 6 6" />,
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  style?: CSSProperties;
  className?: string;
}

export function Icon({ name, size = 16, strokeWidth = 1.8, style, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={className ? `icon ${className}` : 'icon'}
      style={style}
    >
      {PATHS[name]}
    </svg>
  );
}
