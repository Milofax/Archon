import { useState, useRef } from "react";

interface TiltOptions {
  max: number;
  scale: number;
  speed: number;
  perspective: number;
  easing: string;
}

interface TiltStyles {
  transform: string;
  transition: string;
  reflectionOpacity: number;
  reflectionPosition: string;
  glowIntensity: number;
  glowPosition: { x: number; y: number };
}

/**
 * Hook for 3D card tilt effect with reflection and glow tracking
 *
 * Usage:
 * ```tsx
 * const { cardRef, tiltStyles, handlers } = useCardTilt();
 *
 * <div ref={cardRef} {...handlers} style={{ transform: tiltStyles.transform }}>
 *   <div className="card-reflection" style={{ opacity: tiltStyles.reflectionOpacity }} />
 *   {children}
 * </div>
 * ```
 */
export const useCardTilt = (options: Partial<TiltOptions> = {}) => {
  const {
    max = 8, // Max tilt angle in degrees
    scale = 1.03, // Scale on hover
    speed = 300, // Transition duration in ms
    perspective = 1000, // 3D perspective depth
    easing = "cubic-bezier(.03,.98,.52,.99)",
  } = options;

  const [tiltStyles, setTiltStyles] = useState<TiltStyles>({
    transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
    transition: `transform ${speed}ms ${easing}`,
    reflectionOpacity: 0,
    reflectionPosition: "50% 50%",
    glowIntensity: 0,
    glowPosition: { x: 50, y: 50 },
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const isHovering = useRef(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const percentX = (x - centerX) / centerX;
    const percentY = (y - centerY) / centerY;

    const tiltX = max * -1 * percentY;
    const tiltY = max * percentX;

    // Calculate glow position (0-100%)
    const glowX = (x / rect.width) * 100;
    const glowY = (y / rect.height) * 100;

    // Calculate reflection position with movement
    const reflectionX = 50 + percentX * 12;
    const reflectionY = 50 + percentY * 12;

    setTiltStyles({
      transform: `perspective(${perspective}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(${scale}, ${scale}, ${scale})`,
      transition: `transform ${speed}ms ${easing}`,
      reflectionOpacity: 0.12,
      reflectionPosition: `${reflectionX}% ${reflectionY}%`,
      glowIntensity: 1,
      glowPosition: { x: glowX, y: glowY },
    });
  };

  const handleMouseEnter = () => {
    isHovering.current = true;
  };

  const handleMouseLeave = () => {
    isHovering.current = false;
    setTiltStyles({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: `transform ${speed}ms ${easing}`,
      reflectionOpacity: 0,
      reflectionPosition: "50% 50%",
      glowIntensity: 0,
      glowPosition: { x: 50, y: 50 },
    });
  };

  const handleClick = () => {
    // Bounce animation on click
    if (cardRef.current) {
      cardRef.current.style.animation = "card-bounce 0.4s";
      cardRef.current.addEventListener(
        "animationend",
        () => {
          if (cardRef.current) {
            cardRef.current.style.animation = "";
          }
        },
        { once: true }
      );
    }
  };

  return {
    cardRef,
    tiltStyles,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onClick: handleClick,
    },
  };
};
