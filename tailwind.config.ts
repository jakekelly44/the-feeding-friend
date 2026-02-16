import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'deep-teal': {
          DEFAULT: '#3D7B8C',
          50: '#E8F2F4',
          100: '#D1E5E9',
          200: '#A3CBD3',
          300: '#75B1BD',
          400: '#4797A7',
          500: '#3D7B8C',
          600: '#316270',
          700: '#254A54',
          800: '#183138',
          900: '#0C191C',
        },
        'soft-peach': {
          DEFAULT: '#F4B5A0',
          50: '#FDF5F2',
          100: '#FBEBE5',
          200: '#F9DDD2',
          300: '#F6C9B9',
          400: '#F4B5A0',
          500: '#EF9A7E',
        },
        'light-cream': '#F9F7F4',
        charcoal: '#2C2C2C',
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        button: '12px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
