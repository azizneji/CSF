import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0f9f4',
          100: '#d9f0e3',
          200: '#b5e1cb',
          300: '#84caa9',
          400: '#50ad83',
          500: '#2e9168',
          600: '#1f7453',
          700: '#195e43',
          800: '#164b37',
          900: '#123d2d',
          950: '#0a2219',
        },
        sand: {
          50:  '#fdf8f0',
          100: '#faefd8',
          200: '#f4dcaf',
          300: '#ecc37d',
          400: '#e2a44a',
          500: '#d98a2a',
          600: '#c0701f',
          700: '#9f561b',
          800: '#81451d',
          900: '#6a3a1a',
        },
      },
      borderRadius: {
        'xl':  '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 20px rgba(0,0,0,0.06)',
        'card': '0 4px 32px rgba(0,0,0,0.08)',
        'glow': '0 0 40px rgba(46,145,104,0.15)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
