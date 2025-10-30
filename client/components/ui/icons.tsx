import clsx from 'classnames';

export interface IconProps {
  className?: string;
}

const base = 'h-5 w-5';

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 6l-6 6 6 6" />
      <path d="M20 12H7.5" />
    </svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 6l6 6-6 6" />
      <path d="M4 12h12.5" />
    </svg>
  );
}

export function ArrowUpIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 15l6-6 6 6" />
      <path d="M12 20V9" />
    </svg>
  );
}

export function ArrowDownIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
      <path d="M12 4v11" />
    </svg>
  );
}

export function ShareIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l4 4m-4-4l-4 4m4-4v12" />
      <path d="M5 14v4.25A1.75 1.75 0 0 0 6.75 20h10.5A1.75 1.75 0 0 0 19 18.25V14" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v2" />
      <circle cx="9.5" cy="8.5" r="3.5" />
      <path d="M20 21v-2a3 3 0 0 0-2.4-2.94" />
      <path d="M16.5 3.5a3.5 3.5 0 0 0 0 7" />
    </svg>
  );
}

export function StarSolidIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 3l2.894 6.26 6.813.99-4.928 4.805 1.164 6.76L12 18.77l-6.943 3.045 1.164-6.76-4.93-4.805 6.814-.99L12 3z" />
    </svg>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l2.894 6.26 6.813.99-4.928 4.805 1.164 6.76L12 18.77l-6.943 3.045 1.164-6.76-4.93-4.805 6.814-.99L12 3z" />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function AspectRatioIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="M10 10h-4v4M14 14h4v-4" />
    </svg>
  );
}

export function InfoIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 17v-5" />
      <circle cx="12" cy="8" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function ZoomInIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="6" />
      <path d="M11 8v6M8 11h6M20 20l-3.5-3.5" />
    </svg>
  );
}

export function ZoomOutIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="6" />
      <path d="M8 11h6M20 20l-3.5-3.5" />
    </svg>
  );
}

export function UndoIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 5l-7 7 7 7" />
      <path d="M3 12h11a6 6 0 1 1 0 12" transform="rotate(-180 9 12)" />
    </svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9.75L12 3l9 6.75V21a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-5h-4v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.75z" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M7 5h3v14H7zM14 5h3v14h-3z" />
    </svg>
  );
}

export function FastForwardIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M4 5l7 7-7 7zM13 5l7 7-7 7z" />
    </svg>
  );
}

export function RewindIcon({ className }: IconProps) {
  return (
    <svg
      className={clsx(base, className)}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M20 5l-7 7 7 7zM11 5l-7 7 7 7z" />
    </svg>
  );
}
