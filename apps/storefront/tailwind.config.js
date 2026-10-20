const path = require("path")

module.exports = {
  darkMode: "class",
  presets: [require("@medusajs/ui-preset")],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/modules/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      transitionProperty: {
        width: "width margin",
        height: "height",
        bg: "background-color",
        display: "display opacity",
        visibility: "visibility",
        padding: "padding-top padding-right padding-bottom padding-left",
      },
      colors: {
        // 3rd Eye Supply — dark cosmic palette
        cosmos: {
          bg: "#0B0B10", // near-black with a violet hint — never pure black
          surface: "#12121A",
          raised: "#16161F",
          border: "#26262F",
          borderSoft: "#1E1E28",
          text: "#EDEAE2", // warm off-white
          muted: "#9B978C",
          faint: "#6E6A60",
          gold: "#C9A227",
          goldBright: "#E3B94E",
          violet: "#8B7BC7",
          teal: "#5E9C8F",
        },
        // 3rd Eye Supply — bright apothecary palette (issue #20)
        // Warm paper surfaces, ink text, stone-tone hairlines, and one
        // disciplined accent: deep botanical green. Cosmos tokens above stay
        // in place during the migration; this group is additive.
        paper: {
          bg: "#FAF6EF", // warm cream — default page surface
          surface: "#F4EEE1", // deeper cream — panels, shelves
          raised: "#FFFDF7", // warm near-white — specimen cards
          border: "#D9CFBB", // muted stone hairline
          borderSoft: "#E5DDCC", // softer hairline
          text: "#23201B", // ink
          muted: "#6E675A", // warm stone gray — secondary text
          faint: "#A39A86", // labels, captions
          stone: "#B4A888", // mid stone tone — fills, markers
          accent: "#2E5339", // deep botanical green — the one accent
          accentBright: "#3C6E4B", // accent hover state
          accentSoft: "#E4E9DC", // accent tint — chips, badges
        },
        grey: {
          0: "#FFFFFF",
          5: "#F9FAFB",
          10: "#F3F4F6",
          20: "#E5E7EB",
          30: "#D1D5DB",
          40: "#9CA3AF",
          50: "#6B7280",
          60: "#4B5563",
          70: "#374151",
          80: "#1F2937",
          90: "#111827",
        },
      },
      borderRadius: {
        none: "0px",
        soft: "2px",
        base: "4px",
        specimen: "3px", // apothecary specimen-card radius (issue #20)
        rounded: "8px",
        large: "16px",
        circle: "9999px",
      },
      maxWidth: {
        "8xl": "100rem",
      },
      screens: {
        "2xsmall": "320px",
        xsmall: "512px",
        small: "1024px",
        medium: "1280px",
        large: "1440px",
        xlarge: "1680px",
        "2xlarge": "1920px",
      },
      fontSize: {
        "3xl": "2rem",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Ubuntu",
          "sans-serif",
        ],
        display: ["Fraunces", "Georgia", "serif"],
        // Bright apothecary body voice (issue #20): plain humanist sans.
        // Use as `font-humanist`. Loading Source Sans 3 in layout.tsx is a
        // follow-up; the stack degrades to system humanist faces until then.
        humanist: [
          "Source Sans 3",
          "Source Sans Pro",
          "Segoe UI",
          "Frutiger",
          "system-ui",
          "sans-serif",
        ],
      },
      keyframes: {
        ring: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "fade-in-right": {
          "0%": {
            opacity: "0",
            transform: "translateX(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "fade-in-top": {
          "0%": {
            opacity: "0",
            transform: "translateY(-10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "fade-out-top": {
          "0%": {
            height: "100%",
          },
          "99%": {
            height: "0",
          },
          "100%": {
            visibility: "hidden",
          },
        },
        "accordion-slide-up": {
          "0%": {
            height: "var(--radix-accordion-content-height)",
            opacity: "1",
          },
          "100%": {
            height: "0",
            opacity: "0",
          },
        },
        "accordion-slide-down": {
          "0%": {
            "min-height": "0",
            "max-height": "0",
            opacity: "0",
          },
          "100%": {
            "min-height": "var(--radix-accordion-content-height)",
            "max-height": "none",
            opacity: "1",
          },
        },
        enter: {
          "0%": { transform: "scale(0.9)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        leave: {
          "0%": { transform: "scale(1)", opacity: 1 },
          "100%": { transform: "scale(0.9)", opacity: 0 },
        },
        "slide-in": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        ring: "ring 2.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
        "fade-in-right":
          "fade-in-right 0.3s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "fade-in-top": "fade-in-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "fade-out-top":
          "fade-out-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "accordion-open":
          "accordion-slide-down 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards",
        "accordion-close":
          "accordion-slide-up 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards",
        enter: "enter 200ms ease-out",
        "slide-in": "slide-in 1.2s cubic-bezier(.41,.73,.51,1.02)",
        leave: "leave 150ms ease-in forwards",
      },
    },
  },
  plugins: [require("tailwindcss-radix")()],
}
