/** @type {import('tailwindcss').Config} */

module.exports = {
  mode: 'jit',
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    // classes that are generated dynamically, e.g. `rounded-${size}` and must
    // be kept
    safeList: [],
    content: [
      './index.html',
      './src/**/*.{vue,js,ts}',
      // etc.
    ],
  },
  theme: {
    fontFamily: {
      'geist-mono': ['Geist-Mono-Light', 'monospace'],
    },
    fontSize: {
      'root-screen': '1.75vh',
      'root-desktop': '1.75vh',
      'root-mobile': '1.5vh',

      lg: [
        '6rem', // 32
        {
          lineHeight: '1.15em', // 38
          letterSpacing: '-0.045em',
        },
      ],
      md: [
        '1.5rem', // 20
        {
          lineHeight: '1.1', // 26
          letterSpacing: '-0.01em',
        },
      ],
      sm: [
        '0.9rem', // 20
        {
          lineHeight: '1.15em', // 26
          letterSpacing: '0.05em',
        },
      ],
      xs: [
        '0.7rem', // 20
        {
          lineHeight: '1.15em', // 26
          letterSpacing: '0.05em',
        },
      ],
    },

    // analog to image.config.js
    screens: {
      lg: { min: '1600px' },
      md: { max: '1200px' },
      sm: { max: '600px' },
      xs: { max: '400px' },
      betterhover: { raw: '(hover: hover)' },
      'betterhover-group': { raw: '(hover: hover) {.group :hover}' },
    },
    extend: {
      spacing: {
        'frame-w': 'min(100vw, 100dvw)',
        'frame-h': 'min(100vh, 100dvh)',
        xs: '0.5rem',
        sm: '1rem',
        md: '2rem',
        lg: '4rem',
        depth: 'var(--depth)',
      },
      borderRadius: {},
      transitionDuration: {
        custom: '500ms',
      },
      filter: {
        'blur-custom': 'blur(2px)',
      },
      colors: {
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        highlight: 'lime',
      },
      boxShadow: {
        custom: 'inset 0px 0px 25px 5px var(--darkgrey)',
      },
      animation: {
        blink: 'blink 900ms infinite',
        'path-draw': 'pathDraw 3s ease-in-out forwards',
        'dot-move': 'dotMove 2s infinite alternate',
      },
      backgroundImage: {
        pole: 'linear-gradient(90deg, rgb(80 80 80) 0%, rgb(163 163 163) 17%, rgba(200,200,200, 1) 39%, rgb(104 104 104) 79%, rgba(230, 230, 230, 1) 100%, rgba(80,80,80, 1) 100%)',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 0 },
          '50%': { opacity: 1 },
        },
        pathDraw: {
          from: { strokeDashoffset: '50rem' },
          to: { strokeDashoffset: '0' },
        },
        dotMove: {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(2px, -2px)' },
        },
      },
    },
  },
};
