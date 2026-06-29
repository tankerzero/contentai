import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0fafb',
          100: '#d0eeef',
          200: '#a1dcde',
          300: '#62c4c7',
          400: '#33a8ab',
          500: '#1a8e91',
          600: '#0D7377',
          700: '#0a5d61',
          800: '#084a4d',
          900: '#053b3e',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E4C97A',
          dark: '#A88832',
        },
      },
      fontFamily: {
        sans:   ['var(--font-sans)', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-arabic)', 'Segoe UI', 'Tahoma', 'Arial', 'sans-serif'],
      },
      backgroundImage: {
        'geometric-pattern': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cg fill='none' stroke='%230D7377' stroke-width='0.8'%3E%3Crect x='10' y='10' width='60' height='60'/%3E%3Crect x='10' y='10' width='60' height='60' transform='rotate(45 40 40)'/%3E%3Ccircle cx='40' cy='40' r='21'/%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

export default config
