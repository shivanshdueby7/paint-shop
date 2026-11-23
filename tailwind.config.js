/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // The shop's canvas. Warm, but not another cream-and-terracotta page.
        paper: '#FFF6E9',
        'paper-2': '#FBEBD3',
        'paper-3': '#F5E0C2',
        ink: '#241B14',
        'ink-2': '#4E4034',
        'ink-3': '#8A7663',
        rule: '#EFDFC9',
        'rule-strong': '#DCC5A6',
        // `oxide` is kept as the legacy accent name (admin panel uses it) but is
        // now the shop's ink-indigo, the colour of a fresh tin label.
        oxide: '#2E3A8C',
        'oxide-dark': '#1E2766',
        indigo: '#2E3A8C',
        'indigo-ink': '#1E2766',
        pink: '#F45D7E',
        sun: '#FFC53D',
        mint: '#25A57F',
        tangerine: '#F2793D',
        lilac: '#B79CF0',
        sky: '#6CB8E8',
        open: '#178A5C',
        shut: '#C2473A',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Baloo 2"', '"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1.15rem' }],
      },
      letterSpacing: {
        plate: '0.16em',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      boxShadow: {
        // The signature button: a hard offset shadow that presses flat.
        hard: '4px 4px 0 0 #241B14',
        'hard-sm': '3px 3px 0 0 #241B14',
        'hard-lg': '6px 6px 0 0 #241B14',
        soft: '0 18px 40px -26px rgba(36, 27, 20, 0.5)',
        lift: '0 26px 50px -24px rgba(36, 27, 20, 0.5)',
        print: '3px 3px 0 0 rgba(36, 27, 20, 0.12)',
      },
      maxWidth: {
        shell: '76rem',
      },
      borderRadius: {
        card: '1.75rem',
      },
    },
  },
  plugins: [],
};
