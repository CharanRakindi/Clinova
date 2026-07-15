/** @type {import('tailwindcss').Config} */
/**
 * Clinova design tokens — derived from the marketing About section.
 *
 * Light: white cards · warm paper canvas · cool slate type
 * Dark:  slate-950 panels · sky + emerald atmospheric accents
 * Brand: sky → cyan → teal (wordmark) · emerald for live/positive
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand accent scale (About dark panel + wordmark)
        brand: {
          DEFAULT: '#0EA5E9', // sky-500
          soft: '#E0F2FE', // sky-100
          muted: '#7DD3FC', // sky-300
          strong: '#0284C7', // sky-600
          deep: '#0369A1', // sky-700
          glow: 'rgba(14, 165, 233, 0.15)',
          teal: '#2DD4BF',
          emerald: '#34D399', // emerald-400 — About list dots / live
          emeraldSoft: 'rgba(52, 211, 153, 0.12)',
        },
        // Interactive primary (About CTAs: slate-900)
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
        // Type — slate scale from About (slate-900 / 800 / 600 / 500 / 400)
        ink: {
          DEFAULT: '#0F172A', // slate-900
          secondary: '#1E293B', // slate-800
          muted: '#475569', // slate-600
          faint: '#94A3B8', // slate-400
          inverse: '#FFFFFF',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F7F6F3', // warm paper canvas (site body / About)
          subtle: '#F1F5F9', // slate-100
          inverse: '#020617', // slate-950 — About dark panel
        },
        line: {
          DEFAULT: '#E2E8F0', // slate-200
          strong: '#CBD5E1', // slate-300
          soft: 'rgba(226, 232, 240, 0.8)',
        },
        success: {
          DEFAULT: '#059669', // emerald-600 — readable on light
          soft: '#ECFDF5',
          border: '#A7F3D0',
          bright: '#34D399', // emerald-400 — dark panels
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
          DEFAULT: '#0284C7', // sky-600 — brand-aligned
          soft: '#E0F2FE',
          border: '#BAE6FD',
        },
        // Legacy aliases
        background: '#F7F6F3',
        card: '#FFFFFF',
        sidebar: '#020617',
        accent: {
          DEFAULT: '#0EA5E9',
          soft: '#E0F2FE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        brand: ['Syne', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.04em' }],
        xs: ['0.75rem', { lineHeight: '1.125rem', letterSpacing: '-0.005em' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem', letterSpacing: '-0.01em' }],
        base: ['0.875rem', { lineHeight: '1.375rem', letterSpacing: '-0.01em' }],
        md: ['0.9375rem', { lineHeight: '1.5rem', letterSpacing: '-0.015em' }],
        lg: ['1.0625rem', { lineHeight: '1.5rem', letterSpacing: '-0.02em' }],
        xl: ['1.25rem', { lineHeight: '1.625rem', letterSpacing: '-0.025em' }],
        '2xl': ['1.375rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
        '3xl': ['1.75rem', { lineHeight: '2rem', letterSpacing: '-0.03em' }],
      },
      maxWidth: {
        content: '1340px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(15, 23, 42, 0.04)',
        sm: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px -4px rgba(15, 23, 42, 0.06)',
        md: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -8px rgba(15, 23, 42, 0.08)',
        lg: '0 4px 12px rgba(15, 23, 42, 0.04), 0 24px 48px -16px rgba(15, 23, 42, 0.12)',
        premium: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -8px rgba(15, 23, 42, 0.08)',
        'premium-lg': '0 4px 12px rgba(15, 23, 42, 0.04), 0 24px 48px -16px rgba(15, 23, 42, 0.12)',
        glow: '0 0 0 1px rgba(15, 23, 42, 0.06)',
        'glow-brand': '0 0 0 1px rgba(14, 165, 233, 0.18)',
        'glow-green': '0 0 0 1px rgba(52, 211, 153, 0.2)',
        glass: '0 4px 20px rgba(15, 23, 42, 0.04)',
      },
      borderRadius: {
        sm: '0.375rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1rem',
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
