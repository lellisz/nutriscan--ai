/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Backgrounds (sistema v3 "Obsidian Warm")
        bg:    "#09080C",
        c1:    "#0F0E13",
        c2:    "#161420",
        c3:    "#1E1C28",
        c4:    "#262232",
        c5:    "#2E2A3A",
        // Texto — escala ivory
        t1:    "#EBE4D2",
        t2:    "#C0B8A4",
        t3:    "#7A7268",
        t4:    "#3E3830",
        t5:    "#252020",
        // Accent
        gold:  "#C9A96E",
        success: "#7ea88c",
        danger:  "#c47e6e",
      },
      fontFamily: {
        serif: ["CormorantGaramond_300Light", "serif"],
        "serif-regular": ["CormorantGaramond_400Regular", "serif"],
        mono: ["DMSans_300Light", "monospace"],
        "mono-regular": ["DMSans_400Regular", "monospace"],
        sans: ["Jost_300Light", "sans-serif"],
        "sans-regular": ["Jost_400Regular", "sans-serif"],
        "sans-medium": ["Jost_500Medium", "sans-serif"],
      },
    },
  },
  plugins: [],
};
