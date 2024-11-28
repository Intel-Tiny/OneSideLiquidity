import {
  shade,
  rounded,
  animations,
  components,
  grays,
  palettes
} from "@tailus/themer";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@tailus/themer/dist/components/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
      animation: {
        fadeIn: 'fadeIn 1s ease-in-out',
      },
      colors: {
        ...palettes.trust,
        gray: grays.neutral,
        softblack: "#000D3D",
        mainbg: "#150505",
        cardbg: "#1d0000",
        modalbg: "#2d0000",
        borderbg: "#2a1010",
        buttonbg: "#5a0000",
      },
      backgroundImage: theme => ({
        'main-bgcolor': 'linear-gradient(to bottom, black, #1a0000)',
      })
    },
  },
  plugins: [shade, components, animations, rounded],
};
