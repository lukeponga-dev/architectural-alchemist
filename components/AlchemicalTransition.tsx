/**
 * Alchemical Transition Component
 * Creates magical CSS transitions for video transformations
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { glassmorphism, animations } from "../styles/brand-system";

interface AlchemicalTransitionProps {
  isTransitioning: boolean;
  fromVideo: string;
  toVideo: string;
  onTransitionComplete?: () => void;
  transitionType?: "dissolve" | "morph" | "particle" | "ripple";
  duration?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  velocity: { x: number; y: number };
  life: number;
}

const AlchemicalTransition: React.FC<AlchemicalTransitionProps> = ({
  isTransitioning,
  fromVideo,
  toVideo,
  onTransitionComplete,
  transitionType = "dissolve",
  duration = 1000,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (isTransitioning) {
      startTransition();
    } else {
      resetTransition();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isTransitioning]);

  const startTransition = () => {
    setTransitionProgress(0);

    if (transitionType === "particle") {
      initializeParticles();
      animateParticles();
    }

    // Progress animation
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setTransitionProgress(progress);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        onTransitionComplete?.();
      }
    };

    animate();
  };

  const resetTransition = () => {
    setTransitionProgress(0);
    setParticles([]);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const initializeParticles = () => {
    const newParticles: Particle[] = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        color: `hsl(${180 + Math.random() * 60}, 100%, 50%)`, // Cyan to green range
        velocity: {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
        },
        life: 1,
      });
    }

    setParticles(newParticles);
  };

  const animateParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      setParticles((prevParticles) => {
        return prevParticles
          .map((particle) => {
            const updatedParticle = {
              ...particle,
              x: particle.x + particle.velocity.x,
              y: particle.y + particle.velocity.y,
              life: particle.life - 0.02,
            };

            // Draw particle
            ctx.globalAlpha = updatedParticle.life;
            ctx.fillStyle = updatedParticle.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = updatedParticle.color;

            ctx.beginPath();
            ctx.arc(
              (updatedParticle.x / 100) * canvas.width,
              (updatedParticle.y / 100) * canvas.height,
              updatedParticle.size,
              0,
              Math.PI * 2,
            );
            ctx.fill();

            return updatedParticle.life > 0 ? updatedParticle : null;
          })
          .filter(Boolean) as Particle[];
      });

      if (particles.length > 0) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  };

  const renderTransition = () => {
    switch (transitionType) {
      case "dissolve":
        return (
          <DissolveTransition
            progress={transitionProgress}
            fromVideo={fromVideo}
            toVideo={toVideo}
          />
        );
      case "morph":
        return (
          <MorphTransition
            progress={transitionProgress}
            fromVideo={fromVideo}
            toVideo={toVideo}
          />
        );
      case "ripple":
        return (
          <RippleTransition
            progress={transitionProgress}
            fromVideo={fromVideo}
            toVideo={toVideo}
          />
        );
      case "particle":
        return (
          <ParticleTransition
            progress={transitionProgress}
            fromVideo={fromVideo}
            toVideo={toVideo}
            particles={particles}
          />
        );
      default:
        return (
          <DissolveTransition
            progress={transitionProgress}
            fromVideo={fromVideo}
            toVideo={toVideo}
          />
        );
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <AnimatePresence mode="wait">
        {isTransitioning && (
          <motion.div
            className="absolute inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderTransition()}

            {/* Particle canvas for particle transition */}
            {transitionType === "particle" && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{ mixBlendMode: "screen" }}
              />
            )}

            {/* Loading indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <motion.div
                className={`${glassmorphism.button} px-6 py-3`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-cyan rounded-full animate-pulse" />
                  <span className="text-cyan font-medium">
                    Alchemical Transformation...
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Transition Components
const DissolveTransition: React.FC<{
  progress: number;
  fromVideo: string;
  toVideo: string;
}> = ({ progress, fromVideo, toVideo }) => (
  <div className="relative w-full h-full">
    <video
      src={fromVideo}
      className="absolute inset-0 w-full h-full object-cover"
      style={{ opacity: 1 - progress }}
      autoPlay
      muted
      loop
    />
    <video
      src={toVideo}
      className="absolute inset-0 w-full h-full object-cover"
      style={{
        opacity: progress,
        filter: `brightness(${0.8 + progress * 0.2})`,
      }}
      autoPlay
      muted
      loop
    />
    <div
      className="absolute inset-0 bg-gradient-to-r from-cyan/20 to-blue/20"
      style={{ opacity: Math.sin(progress * Math.PI) * 0.3 }}
    />
  </div>
);

const MorphTransition: React.FC<{
  progress: number;
  fromVideo: string;
  toVideo: string;
}> = ({ progress, fromVideo, toVideo }) => (
  <div className="relative w-full h-full">
    <video
      src={fromVideo}
      className="absolute inset-0 w-full h-full object-cover"
      style={{
        clipPath: `polygon(${generateMorphPath(1 - progress)})`,
        filter: `hue-rotate(${(1 - progress) * 30}deg)`,
      }}
      autoPlay
      muted
      loop
    />
    <video
      src={toVideo}
      className="absolute inset-0 w-full h-full object-cover"
      style={{
        clipPath: `polygon(${generateMorphPath(progress)})`,
        filter: `hue-rotate(${progress * 30}deg)`,
      }}
      autoPlay
      muted
      loop
    />
  </div>
);

const RippleTransition: React.FC<{
  progress: number;
  fromVideo: string;
  toVideo: string;
}> = ({ progress, fromVideo, toVideo }) => {
  const rippleCount = 3;
  const ripples = Array.from({ length: rippleCount }, (_, i) => i);

  return (
    <div className="relative w-full h-full">
      <video
        src={fromVideo}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
      />
      <video
        src={toVideo}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
      />
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {ripples.map((i) => (
          <circle
            key={i}
            cx="50%"
            cy="50%"
            r={`${progress * 100 + i * 20}%`}
            fill="none"
            stroke="cyan"
            strokeWidth="2"
            opacity={Math.max(0, 1 - progress - i * 0.3)}
            className="animate-pulse"
          />
        ))}
      </svg>
    </div>
  );
};

const ParticleTransition: React.FC<{
  progress: number;
  fromVideo: string;
  toVideo: string;
  particles: Particle[];
}> = ({ progress, fromVideo, toVideo }) => (
  <div className="relative w-full h-full">
    <video
      src={fromVideo}
      className="absolute inset-0 w-full h-full object-cover"
      style={{ opacity: 1 - progress }}
      autoPlay
      muted
      loop
    />
    <video
      src={toVideo}
      className="absolute inset-0 w-full h-full object-cover"
      style={{ opacity: progress }}
      autoPlay
      muted
      loop
    />
  </div>
);

// Helper functions
const generateMorphPath = (progress: number): string => {
  const points = 8;
  const path = [];

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const radius =
      progress < 0.5
        ? 50 + Math.sin(progress * Math.PI) * 30
        : 50 - Math.sin(progress * Math.PI) * 30;

    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius;

    path.push(`${x}% ${y}%`);
  }

  return path.join(", ");
};

export default AlchemicalTransition;
