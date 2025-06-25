/** @type {import('tailwindcss').Config} */
import type { Config } from 'tailwindcss';

const config: Config = {
  prefix: "tw-",
  darkMode: "class",
  content: ["./src/app/**/*.{html,ts}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
