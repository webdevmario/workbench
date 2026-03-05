/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        wb: {
          bg: '#0a0a0b',
          surface: '#131316',
          'surface-hover': '#1a1a1f',
          border: '#2a2a30',
          text: '#e8e8ed',
          'text-muted': '#8888a0',
          accent: '#00d4aa',
          'accent-dim': 'rgba(0, 212, 170, 0.15)',
          danger: '#ff5c5c',
          'danger-dim': 'rgba(255, 92, 92, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        pulse: 'pulse 2s ease-in-out infinite',
        'toast-in': 'toastIn 0.25s ease',
        'toast-out': 'toastOut 0.25s ease 2.75s forwards',
        'task-complete': 'taskComplete 0.6s ease forwards',
        'celebration-pop': 'celebrationPop 0.8s ease forwards',
        'check-draw': 'checkDraw 0.4s ease 0.15s forwards',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        toastIn: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        toastOut: {
          from: { opacity: '1', transform: 'translateY(0)' },
          to: { opacity: '0', transform: 'translateY(12px)' },
        },
        taskComplete: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '15%': { transform: 'scale(1.02)' },
          '40%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0.6', transform: 'translateX(8px)' },
        },
        celebrationPop: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '20%': { transform: 'scale(1.2)', opacity: '1' },
          '40%': { transform: 'scale(0.95)' },
          '60%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.8)', opacity: '0' },
        },
        checkDraw: {
          to: { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
};
