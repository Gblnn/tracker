/** @type {import('tailwindcss').Config} */
export const darkMode = ["class"];
export const content = [
  './pages/**/*.{ts,tsx}',
  './components/**/*.{ts,tsx}',
  './app/**/*.{ts,tsx}',
  './src/**/*.{ts,tsx}',
];
export const prefix = "";
export const theme = {
  container: {
    center: true,
    padding: "2rem",
    screens: {
      "2xl": "1400px",
    },
  },
  extend: {
    keyframes: {
      "fade-in": {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
      "fade-out": {
        from: { opacity: 1 },
        to: { opacity: 0 },
      },
      "slide-in-from-top": {
        from: { transform: "translateY(-100%)" },
        to: { transform: "translateY(0)" },
      },
      "slide-out-to-bottom": {
        from: { transform: "translateY(0)" },
        to: { transform: "translateY(100%)" },
      },
      "zoom-in": {
        from: { transform: "scale(0.95)" },
        to: { transform: "scale(1)" },
      },
      "zoom-out": {
        from: { transform: "scale(1)" },
        to: { transform: "scale(0.95)" },
      },
    },
    animation: {
      "fade-in": "fade-in 300ms ease-out",
      "fade-out": "fade-out 300ms ease-out",
      "slide-in": "slide-in-from-top 300ms ease-out",
      "slide-out": "slide-out-to-bottom 300ms ease-out",
      "zoom-in": "zoom-in 300ms ease-out",
      "zoom-out": "zoom-out 300ms ease-out",
      "in": "fade-in 300ms ease-out, slide-in 300ms ease-out, zoom-in 300ms ease-out",
      "out": "fade-out 300ms ease-out, slide-out 300ms ease-out, zoom-out 300ms ease-out",
    },
    colors: {
      border: "hsl(var(--border))",
      input: "hsl(var(--input))",
      ring: "hsl(var(--ring))",
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
      primary: {
        DEFAULT: "hsl(var(--primary))",
        foreground: "hsl(var(--primary-foreground))",
      },
      secondary: {
        DEFAULT: "hsl(var(--secondary))",
        foreground: "hsl(var(--secondary-foreground))",
      },
      destructive: {
        DEFAULT: "hsl(var(--destructive))",
        foreground: "hsl(var(--destructive-foreground))",
      },
      muted: {
        DEFAULT: "hsl(var(--muted))",
        foreground: "hsl(var(--muted-foreground))",
      },
      accent: {
        DEFAULT: "hsl(var(--accent))",
        foreground: "hsl(var(--accent-foreground))",
      },
      popover: {
        DEFAULT: "hsl(var(--popover))",
        foreground: "hsl(var(--popover-foreground))",
      },
      card: {
        DEFAULT: "hsl(var(--card))",
        foreground: "hsl(var(--card-foreground))",
      },
    },
    borderRadius: {
      lg: "var(--radius)",
      md: "calc(var(--radius) - 2px)",
      sm: "calc(var(--radius) - 4px)",
    },
    keyframes: {
      "accordion-down": {
        from: { height: "0" },
        to: { height: "var(--radix-accordion-content-height)" },
      },
      "accordion-up": {
        from: { height: "var(--radix-accordion-content-height)" },
        to: { height: "0" },
      },
    },
    animation: {
      "accordion-down": "accordion-down 0.2s ease-out",
      "accordion-up": "accordion-up 0.2s ease-out",
    },
  },
};
export const plugins = [("tailwindcss-animate")];