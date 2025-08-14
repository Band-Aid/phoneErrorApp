declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number;
    spread?: number;
    origin?: { x?: number; y?: number };
    angle?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    colors?: string[];
    shapes?: string[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }
  type ConfettiFn = (opts?: ConfettiOptions) => void;
  const confetti: ConfettiFn;
  export default confetti;
}
