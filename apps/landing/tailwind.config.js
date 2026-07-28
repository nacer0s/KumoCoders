/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx}', './index.html', '../../packages/ui/src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--color-surface)',
        'surface-hover': 'var(--color-surface-hover)',
        'glass-bg': 'var(--color-glass-bg)',
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'nav-bg': 'var(--color-nav-bg)',
        text: 'var(--color-text)',
        'text-inverse': 'var(--color-text-inverse)',
        'text-muted': 'var(--color-text-muted)',
        border: 'var(--color-border)',
        gray: 'var(--color-gray)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
      },
      fontFamily: {
        headline: ['Mozilla Headline', 'system-ui', '-apple-system', 'sans-serif'],
        text: ['Mozilla Text', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'font-size-xs': 'var(--font-size-xs)',
        'font-size-sm': 'var(--font-size-sm)',
        'font-size-base': 'var(--font-size-base)',
        'font-size-lg': 'var(--font-size-lg)',
        'font-size-xl': 'var(--font-size-xl)',
        'font-size-2xl': 'var(--font-size-2xl)',
        'font-size-3xl': 'var(--font-size-3xl)',
      },
      fontWeight: {
        'font-weight-medium': 'var(--font-weight-medium)',
        'font-weight-semibold': 'var(--font-weight-semibold)',
        'font-weight-bold': 'var(--font-weight-bold)',
      },
      spacing: {
        'space-2xs': 'var(--space-2xs)',
        'space-xs': 'var(--space-xs)',
        'space-sm': 'var(--space-sm)',
        'space-md': 'var(--space-md)',
        'space-lg': 'var(--space-lg)',
        'space-xl': 'var(--space-xl)',
        'space-2xl': 'var(--space-2xl)',
        'space-3xl': 'var(--space-3xl)',
        'space-4xl': 'var(--space-4xl)',
      },
      borderRadius: {
        'radius-sm': 'var(--radius-sm)',
        'radius-md': 'var(--radius-md)',
        'radius-lg': 'var(--radius-lg)',
        'radius-full': 'var(--radius-full)',
      },
      boxShadow: {
        glass: 'var(--shadow-glass)',
        'glass-dark': 'var(--shadow-glass-dark)',
        lg: 'var(--shadow-lg)',
      },
      backdropBlur: {
        glass: 'var(--glass-blur)',
      },
      maxWidth: {
        page: 'var(--max-width)',
      },
      animation: {
        blink: 'blink 0.8s step-end infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        },
      },
      transitionDuration: {
        fast: 'var(--transition-fast)',
        base: 'var(--transition-base)',
        250: '250ms',
      },
      borderWidth: {
        3: '3px',
      },
      lineHeight: {
        relaxed: 'var(--line-height-relaxed)',
        tight: 'var(--line-height-tight)',
      },
    },
  },
  plugins: [],
};
