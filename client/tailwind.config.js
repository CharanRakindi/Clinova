/** @type {import('tailwindcss').Config} */
/**
 * Clinova design tokens — single source of truth.
 * Prefer semantic tokens (ink, surface, border) over raw slate/blue in app chrome.
 * Type scale is rem-based; avoid text-[Npx] in product UI.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand / interactive (use sparingly — most chrome is neutral ink)
        primary: {
          DEFAULT: '#0F172A',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          500: '#334155',
          600: '#1E293B',
          700: '#0F172A',
          900: '#020617',
        },
        // Semantic ink scale
        ink: {
          DEFAULT: '#0F172A',
          secondary: '#334155',
          muted: '#64748B',
          faint: '#94A3B8',
          inverse: '#FFFFFF',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F7F6F3',
          subtle: '#F1F5F9',
          inverse: '#0B0F19',
        },
        line: {
          DEFAULT: '#E2E8F0',
          strong: '#CBD5E1',
          soft: 'rgba(226, 232, 240, 0.7)',
        },
        success: {
          DEFAULT: '#047857',
          soft: '#ECFDF5',
          border: '#A7F3D0',
        },
        warning: {
          DEFAULT: '#B45309',
          soft: '#FFFBEB',
          border: '#FDE68A',
        },
        danger: {
          DEFAULT: '#BE123C',
          soft: '#FFF1F2',
          border: '#FECDD3',
        },
        info: {
          DEFAULT: '#1D4ED8',
          soft: '#EFF6FF',
          border: '#BFDBFE',
        },
        // Legacy aliases (prefer ink/surface going forward)
        background: '#F7F6F3',
        card: '#FFFFFF',
        sidebar: '#0B0F19',
        accent: {
          DEFAULT: '#0F172A',
          soft: '#F1F5F9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        brand: ['Syne', 'Inter', 'system-ui', 'sans-serif'],
      },
      // One type scale — use these instead of text-[13.5px]
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.04em' }], // 11 — labels
        xs: ['0.75rem', { lineHeight: '1.125rem', letterSpacing: '-0.005em' }], // 12
        sm: ['0.8125rem', { lineHeight: '1.25rem', letterSpacing: '-0.01em' }], // 13
        base: ['0.875rem', { lineHeight: '1.375rem', letterSpacing: '-0.01em' }], // 14
        md: ['0.9375rem', { lineHeight: '1.5rem', letterSpacing: '-0.015em' }], // 15
        lg: ['1.0625rem', { lineHeight: '1.5rem', letterSpacing: '-0.02em' }], // 17
        xl: ['1.25rem', { lineHeight: '1.625rem', letterSpacing: '-0.025em' }], // 20
        '2xl': ['1.375rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }], // 22
        '3xl': ['1.75rem', { lineHeight: '2rem', letterSpacing: '-0.03em' }], // 28
      },
      maxWidth: {
        content: '1340px',
      },
      boxShadow: {
        // One elevation language
        xs: '0 1px 2px rgba(15, 23, 42, 0.04)',
        sm: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px -4px rgba(15, 23, 42, 0.06)',
        md: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -8px rgba(15, 23, 42, 0.08)',
        lg: '0 4px 12px rgba(15, 23, 42, 0.04), 0 24px 48px -16px rgba(15, 23, 42, 0.12)',
        // Legacy aliases
        premium: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -8px rgba(15, 23, 42, 0.08)',
        'premium-lg': '0 4px 12px rgba(15, 23, 42, 0.04), 0 24px 48px -16px rgba(15, 23, 42, 0.12)',
        glow: '0 0 0 1px rgba(15, 23, 42, 0.06)',
        'glow-green': '0 0 0 1px rgba(4, 120, 87, 0.12)',
        glass: '0 4px 20px rgba(15, 23, 42, 0.04)',
      },
      borderRadius: {
        // Product radius language: sm control · md panel · lg surface · full pill
        sm: '0.375rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1rem', // collapse 2xl → card radius (avoid two competing large radii)
        '3xl': '1.25rem',
      },
      transitionTimingFunction: {
        product: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        product: '200ms',
        enter: '350ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in-up': 'fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        shimmer: 'shimmer 2s linear infinite',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
