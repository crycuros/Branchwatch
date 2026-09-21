/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: {
          DEFAULT: 'var(--surface)',
          hover: 'var(--surface-hover)',
          active: 'var(--surface-active)',
        },
        border: 'var(--border)',
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        status: {
          active: '#10b981', // subtle green
          quiet: '#f59e0b', // subtle amber
          stale: '#6b7280', // neutral gray
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          'system-ui',
          'sans-serif'
        ],
        mono: [
          '"SF Mono"',
          'ui-monospace',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ]
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)',
        'apple': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'apple-dark': '0 4px 24px -2px rgba(0, 0, 0, 0.4), 0 2px 8px -1px rgba(0, 0, 0, 0.3)',
        'popover': '0 10px 38px -10px rgba(22, 23, 24, 0.35), 0 10px 20px -15px rgba(22, 23, 24, 0.2)'
      },
      borderRadius: {
        'apple': '12px',
        'apple-sm': '8px',
        'apple-lg': '16px',
        'apple-xl': '20px',
        'apple-2xl': '24px',
      },
      transitionTimingFunction: {
        'apple-spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'apple-bouncy': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'apple-smooth': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'apple-interactive': 'cubic-bezier(0.1, 0.9, 0.2, 1)',
        'apple-decelerate': 'cubic-bezier(0.32, 0.72, 0, 1)',
        'apple-standard': 'cubic-bezier(0.2, 0, 0, 1)',
        'apple-accelerate': 'cubic-bezier(0.4, 0, 1, 1)',
      },
      transitionDuration: {
        'micro': '75ms',
        'short': '150ms',
        'medium': '260ms',
        'long': '380ms',
      }
    },
  },
  plugins: [],
}
