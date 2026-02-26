/**
 * GlassButton Component
 * Glassmorphism button with hover effects and animations
 */

import React from "react";
import { motion } from "framer-motion";
import { glassmorphism, animations } from "../../styles/brand-system";

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
}) => {
  const baseClasses = glassmorphism.button;

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const variantClasses = {
    primary: "bg-cyan/10 border-cyan text-cyan hover:bg-cyan/20",
    secondary: "bg-white/10 border-white/30 text-white hover:bg-white/20",
    ghost: "bg-transparent border-transparent text-white hover:bg-white/10",
  };

  const stateClasses = disabled
    ? "opacity-50 cursor-not-allowed"
    : loading
      ? "cursor-wait"
      : "cursor-pointer";

  return (
    <motion.button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${stateClasses} ${className}`}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.05 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
      transition={{ duration: 0.15 }}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
          <span>Processing...</span>
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default GlassButton;
