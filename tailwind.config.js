/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        'primary-text': 'var(--color-primary-text)',
        accent: 'var(--color-accent)',
        'secondary-text': 'var(--color-secondary-text)',
        'subtle-elements': 'var(--color-subtle-elements)',
        success: 'var(--color-success)',
        error: 'var(--color-error)',
        'dark-accent': 'var(--color-dark-accent)',
      },
    },
  },
  plugins: [],
}