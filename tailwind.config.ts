import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          green: '#39ff88',
          magenta: '#ff2ee1',
        },
      },
    },
  },
  plugins: [],
};

export default config;
