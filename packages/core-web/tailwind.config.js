/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    // Tremor
    './node_modules/@tremor/react/dist/**/*.{js,mjs}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
    },
    extend: {
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text',
          '"Helvetica Neue"', 'Helvetica', 'Arial',
          '"Noto Sans TC"', 'PingFang TC', 'Microsoft JhengHei',
          'sans-serif',
        ],
        mono: ['SF Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        // Apple-inspired neutral palette
        apple: {
          50: '#f5f5f7',
          100: '#e8e8ed',
          200: '#d2d2d7',
          300: '#aeaeb2',
          400: '#8e8e93',
          500: '#636366',
          600: '#48484a',
          700: '#363639',
          800: '#2c2c2e',
          900: '#1c1c1e',
          950: '#0a0a0b',
        },
        background: '#f5f3f0',
        foreground: '#1d1d1f',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#1d1d1f',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#1d1d1f',
        },
        primary: {
          DEFAULT: '#1d1d1f',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#f4f3f0',
          foreground: '#1d1d1f',
        },
        muted: {
          DEFAULT: '#f4f3f0',
          foreground: '#8a8885',
        },
        accent: {
          DEFAULT: '#f5f5f7',
          foreground: '#1d1d1f',
        },
        destructive: {
          DEFAULT: '#ff3b30',
          foreground: '#ffffff',
        },
        border: '#d2d2d7',
        input: '#d2d2d7',
        ring: '#1d1d1f',
      },
      borderRadius: {
        xs: '6px',
        sm: '8px',
        md: '10px',
        lg: '12px',
        xl: '14px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'apple-sm': '0 1px 2px rgba(0,0,0,0.04), 0 1px 1px rgba(0,0,0,0.02)',
        'apple': '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        'apple-md': '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.03)',
        'apple-lg': '0 8px 30px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)',
        'apple-xl': '0 20px 60px rgba(0,0,0,0.1), 0 8px 20px rgba(0,0,0,0.06)',
      },
      fontSize: {
        'xs': ['11px', { lineHeight: '1.45' }],
        'sm': ['12px', { lineHeight: '1.5' }],
        'base': ['13px', { lineHeight: '1.5' }],
        'md': ['14px', { lineHeight: '1.45' }],
        'lg': ['15px', { lineHeight: '1.4' }],
        'xl': ['17px', { lineHeight: '1.35' }],
        '2xl': ['20px', { lineHeight: '1.3' }],
        '3xl': ['24px', { lineHeight: '1.25' }],
        '4xl': ['28px', { lineHeight: '1.2' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
