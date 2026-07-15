import { useId } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../utils/cn';

/**
 * Clinova wordmark + icon mark.
 * @param {'sm'|'md'|'lg'|'xl'} size
 * @param {'light'|'dark'} tone — light = on dark bg, dark = on light bg
 * @param {boolean} asLink — wrap in Link to /
 * @param {boolean} showIcon
 * @param {boolean} showWordmark
 */
const sizeMap = {
  xs: {
    gap: 'gap-2',
    icon: 'h-7 w-7',
    word: 'text-md',
  },
  sm: {
    gap: 'gap-2',
    icon: 'h-8 w-8',
    word: 'text-md',
  },
  md: {
    gap: 'gap-2.5',
    icon: 'h-8 w-8 sm:h-9 sm:w-9',
    word: 'text-lg sm:text-lg',
  },
  lg: {
    gap: 'gap-3',
    icon: 'h-10 w-10',
    word: 'text-2xl',
  },
  xl: {
    gap: 'gap-3.5',
    icon: 'h-12 w-12 sm:h-14 sm:w-14',
    word: 'text-3xl sm:text-[32px]',
  },
};

function LogoIcon({ className }) {
  const uid = useId().replace(/:/g, '');
  const bg = `bm-bg-${uid}`;
  const stroke = `bm-stroke-${uid}`;
  const ring = `bm-ring-${uid}`;
  const glow = `bm-glow-${uid}`;

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[22%]',
        'shadow-[0_1px_2px_rgba(15,23,42,0.12),0_8px_20px_-10px_rgba(14,165,233,0.45)]',
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" className="h-full w-full" fill="none">
        <rect width="32" height="32" rx="9" fill={`url(#${bg})`} />
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="8"
          stroke={`url(#${ring})`}
          strokeWidth="1"
          opacity="0.85"
        />
        <circle cx="16" cy="16" r="10" fill={`url(#${glow})`} opacity="0.4" />
        <path
          d="M19.2 10.4c-1.1-1-2.55-1.55-4.2-1.55-3.35 0-5.9 2.45-5.9 6.15s2.55 6.15 5.9 6.15c1.65 0 3.1-.55 4.2-1.55"
          stroke={`url(#${stroke})`}
          strokeWidth="2.15"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M15 13.1v5.8M12.1 16h5.8"
          stroke="#5EEAD4"
          strokeWidth="1.85"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id={bg} x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0F172A" />
            <stop offset="1" stopColor="#0B0F19" />
          </linearGradient>
          <linearGradient id={stroke} x1="9" y1="9" x2="22" y2="23" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" />
            <stop offset="1" stopColor="#2DD4BF" />
          </linearGradient>
          <linearGradient id={ring} x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" stopOpacity="0.5" />
            <stop offset="1" stopColor="#2DD4BF" stopOpacity="0.3" />
          </linearGradient>
          <radialGradient
            id={glow}
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(16 16) scale(11)"
          >
            <stop stopColor="#22D3EE" stopOpacity="0.55" />
            <stop offset="1" stopColor="#0B0F19" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </span>
  );
}

export default function BrandMark({
  size = 'md',
  tone = 'dark',
  asLink = false,
  showIcon = true,
  showWordmark = true,
  className,
  to = '/',
}) {
  const s = sizeMap[size] || sizeMap.md;
  const isLight = tone === 'light';

  const content = (
    <span
      className={cn(
        'group inline-flex items-center select-none',
        s.gap,
        className
      )}
    >
      {showIcon && <LogoIcon className={s.icon} />}
      {showWordmark && (
        <span
          className={cn(
            'font-brand font-medium leading-none tracking-[-0.045em]',
            s.word,
            isLight ? 'text-white' : 'text-ink'
          )}
        >
          Clino
          <span
            className={cn(
              'bg-clip-text text-transparent',
              isLight
                ? 'bg-gradient-to-r from-sky-300 via-cyan-300 to-teal-300'
                : 'bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600'
            )}
          >
            va
          </span>
        </span>
      )}
    </span>
  );

  if (asLink) {
    return (
      <Link
        to={to}
        className="inline-flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 focus-visible:ring-offset-2"
        aria-label="Clinova home"
      >
        {content}
      </Link>
    );
  }

  return content;
}
