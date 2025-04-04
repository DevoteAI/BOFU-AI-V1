/** @type {import('tailwindcss').Config} */
import { colors, shadows, gradients } from './src/theme/colors';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        neutral: colors.neutral,
        success: colors.success,
        error: colors.error,
        warning: colors.warning,
      },
      boxShadow: {
        'soft': shadows.soft,
        'medium': shadows.medium,
        'hard': shadows.hard,
        'primary': shadows.primary,
        'secondary': shadows.secondary,
        'glow': '0 0 20px rgba(255, 230, 0, 0.3)',
        'glow-strong': '0 0 30px rgba(255, 230, 0, 0.5)',
      },
      backgroundImage: {
        'gradient-primary': `linear-gradient(to right, ${colors.primary[500]}, ${colors.primary[600]})`,
        'gradient-primary-subtle': `linear-gradient(to right, ${colors.primary[400]}, ${colors.primary[500]})`,
        'gradient-primary-hover': `linear-gradient(to right, ${colors.primary[600]}, ${colors.primary[700]})`,
        'gradient-dark': `linear-gradient(to bottom, ${colors.secondary[900]}, ${colors.secondary[950]})`,
        'gradient-page': `radial-gradient(ellipse at top, var(--tw-gradient-stops))`,
        'gradient-dots': 'radial-gradient(circle, rgba(255, 230, 0, 0.15) 1px, transparent 1px)',
        'circuit-board': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zM22.343 0L13.8 8.544l1.414 1.414 9.9-9.9h-2.77zm22.628 0L53.8 8.828l-1.415 1.415L41.8 0h3.17zm-16.97 0L36.8 8.6 35.384 10.014 24.8 0h3.2zM27.484 0L36 8.515l-1.414 1.414L25.07 0h2.413zm16.97 0L53.8 8.828l-1.415 1.415-9.9-9.9h2.827zm-16.97 0L41.8 14.314l-1.415 1.415L29.9 5.242 27.484 0zm5.657 0L47.8 14.314l-1.415 1.415-9.9-9.9h2.827zm5.657 0L53.8 14.314l-1.415 1.415-9.9-9.9h2.827zM0 0l.828.828-1.414 1.414L0 2.828V0zm5.373 0l.83.828-1.415 1.415L0 2.828V0h5.373zM0 5.373l.828.83-1.414 1.414L0 8.2V5.374zm0 5.657l.828.83-1.414 1.414L0 13.858v-2.828zm0 5.657l.828.83-1.414 1.414L0 19.514v-2.828zm0 5.657l.828.83-1.414 1.414L0 25.172v-2.828zm0 5.657l.828.83-1.414 1.414L0 30.828v-2.828zm0 5.657l.828.83-1.414 1.414L0 36.486v-2.828zm0 5.657l.828.83-1.414 1.414L0 42.143v-2.828zm0 5.657l.828.83-1.414 1.414L0 47.8v-2.828zm0 5.657l.828.83-1.414 1.414L0 53.456v-2.828zm0 5.657l.828.83-1.414 1.414L0 59.113v-2.828zM54.627 60L60 54.627v2.828L57.455 60h-2.828zm-5.656 0L60 48.97v2.83L51.8 60h-2.828zm-5.657 0L60 43.314v2.828L46.143 60h-2.828zm-5.657 0L60 37.657v2.828L40.486 60h-2.828zm-5.657 0L60 32v2.828L34.83 60h-2.83zm-5.657 0L60 26.344v2.828L29.172 60h-2.828zm-5.657 0L60 20.687v2.828L23.515 60h-2.828zm-5.657 0L60 15.03v2.828L17.858 60h-2.828zm-5.657 0L60 9.373v2.828L12.2 60H9.373zm-5.657 0L60 3.716v2.828L6.544 60H3.716z' fill='${encodeURIComponent(colors.primary[500])}' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`,
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'bounce-slow': 'bounce 3s infinite',
        'text': 'text 5s ease infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        text: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        glow: {
          '0%, 100%': { 
            'box-shadow': '0 0 20px rgba(255, 230, 0, 0.3)',
            'border-color': 'rgba(255, 230, 0, 0.5)'
          },
          '50%': { 
            'box-shadow': '0 0 30px rgba(255, 230, 0, 0.6)',
            'border-color': 'rgba(255, 230, 0, 0.8)'
          },
        },
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};