const { heroui } = require("@heroui/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: { center: true, padding: '2rem', screens: { '2xl': '1400px' } },
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    heroui({
      addCommonColors: true,
      defaultTheme: 'light',
      layout: {
        radius: { small: '8px', medium: '12px', large: '16px' },
        borderWidth: { small: '1px', medium: '2px', large: '3px' },
      },
      themes: {
        light: {
          colors: {
            background: '#f8fafc',
            foreground: '#0f172a',
            focus: '#6366f1',
            content1: '#ffffff',
            content2: '#f1f5f9',
            content3: '#e2e8f0',
            content4: '#cbd5e1',
            primary: {
              50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe',
              300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1',
              600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81',
              DEFAULT: '#6366f1', foreground: '#ffffff',
            },
            secondary: {
              DEFAULT: '#8b5cf6', foreground: '#ffffff',
              50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
              400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed',
            },
            success: { DEFAULT: '#10b981', foreground: '#ffffff' },
            warning: { DEFAULT: '#f59e0b', foreground: '#ffffff' },
            danger: { DEFAULT: '#ef4444', foreground: '#ffffff' },
            default: {
              50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
              400: '#94a3b8', 500: '#64748b', 600: '#475569',
              DEFAULT: '#64748b', foreground: '#ffffff',
            },
          },
        },
        dark: {
          colors: {
            background: '#0a0f1e',
            foreground: '#f1f5f9',
            focus: '#818cf8',
            content1: '#0f172a',
            content2: '#1e293b',
            content3: '#334155',
            content4: '#475569',
            primary: { DEFAULT: '#818cf8', foreground: '#ffffff' },
            default: { DEFAULT: '#94a3b8', foreground: '#0f172a' },
          },
        },
      },
    }),
  ],
}
