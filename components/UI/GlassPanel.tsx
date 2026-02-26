/**
 * GlassPanel Component
 * Glassmorphism UI component for the SpaceX-minimalist design
 */

import React, { forwardRef } from "react";
import { motion, MotionProps } from "framer-motion";
import { glassmorphism, animations } from "../../styles/brand-system";

interface GlassPanelProps extends MotionProps {
  children: React.ReactNode;
  variant?: "card" | "panel" | "button";
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  (
    {
      children,
      variant = "card",
      className = "",
      hover = false,
      glow = false,
      onClick,
      ...motionProps
    },
    ref,
  ) => {
    const baseClasses = glassmorphism[variant];
    const hoverClasses = hover ? "hover:scale-105 cursor-pointer" : "";
    const glowClasses = glow ? "shadow-lg" : "";

    return (
      <motion.div
        ref={ref}
        className={`${baseClasses} ${hoverClasses} ${glowClasses} ${className}`}
        onClick={onClick}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        whileHover={hover ? { scale: 1.02 } : {}}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  },
);

GlassPanel.displayName = "GlassPanel";

export default GlassPanel;
