/**
 * Architectural Alchemist Brand System
 * SpaceX-Minimalist Design Language
 */

export const brandColors = {
  // Primary Palette - SpaceX Inspired
  primary: {
    charcoal: "#121212", // Deep charcoal background
    cyan: "#00f3ff", // Electric cyan accent
    white: "#ffffff", // Pure white
    gray50: "#f8f9fa", // Light gray
    gray100: "#e9ecef", // Medium light gray
    gray200: "#dee2e6", // Light medium gray
    gray300: "#ced4da", // Medium gray
    gray400: "#adb5bd", // Medium dark gray
    gray500: "#6c757d", // Dark gray
    gray600: "#495057", // Very dark gray
    gray700: "#343a40", // Near black
    gray800: "#212529", // Almost black
  },

  // Semantic Colors
  semantic: {
    success: "#00ff88", // Green success
    warning: "#ff6b35", // Orange warning
    error: "#ff3366", // Red error
    info: "#00f3ff", // Cyan info
  },

  // Glassmorphism Colors
  glass: {
    background: "rgba(18, 18, 18, 0.7)",
    border: "rgba(255, 255, 255, 0.1)",
    backdrop: "rgba(0, 0, 0, 0.3)",
    highlight: "rgba(0, 243, 255, 0.1)",
  },
};

export const typography = {
  fontFamily: {
    sans: ["Inter", "system-ui", "sans-serif"],
    mono: ["JetBrains Mono", "Consolas", "monospace"],
    display: ["Space Grotesk", "Inter", "sans-serif"],
  },
  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }],
    sm: ["0.875rem", { lineHeight: "1.25rem" }],
    base: ["1rem", { lineHeight: "1.5rem" }],
    lg: ["1.125rem", { lineHeight: "1.75rem" }],
    xl: ["1.25rem", { lineHeight: "1.75rem" }],
    "2xl": ["1.5rem", { lineHeight: "2rem" }],
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
    "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
    "5xl": ["3rem", { lineHeight: "1" }],
    "6xl": ["3.75rem", { lineHeight: "1" }],
  },
  fontWeight: {
    thin: "100",
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900",
  },
};

export const spacing = {
  0: "0px",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  32: "8rem",
};

export const shadows = {
  glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
  glow: "0 0 20px rgba(0, 243, 255, 0.3)",
  card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  modal: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
};

export const animations = {
  transitions: {
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    normal: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "500ms cubic-bezier(0.4, 0, 0.2, 1)",
    alchemical: "1s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  keyframes: {
    glow: {
      "0%, 100%": { boxShadow: "0 0 20px rgba(0, 243, 255, 0.3)" },
      "50%": { boxShadow: "0 0 40px rgba(0, 243, 255, 0.6)" },
    },
    float: {
      "0%, 100%": { transform: "translateY(0px)" },
      "50%": { transform: "translateY(-10px)" },
    },
    pulse: {
      "0%, 100%": { opacity: "1" },
      "50%": { opacity: "0.7" },
    },
  },
};

const glassmorphismBase = {
  background: brandColors.glass.background,
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  borderRadius: "16px",
  border: `1px solid ${brandColors.glass.border}`,
};

export const glassmorphism = {
  base: glassmorphismBase,
  card: {
    ...glassmorphismBase,
    boxShadow: shadows.glass,
  },
  panel: {
    ...glassmorphismBase,
    boxShadow: shadows.modal,
  },
  button: {
    background: "rgba(0, 243, 255, 0.1)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    borderRadius: "8px",
    border: `1px solid ${brandColors.primary.cyan}`,
    transition: animations.transitions.normal,
  },
};

export const theme = {
  colors: brandColors,
  typography,
  spacing,
  shadows,
  animations,
  glassmorphism,
};

export default theme;
