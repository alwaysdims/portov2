// VirtualJoystick.jsx — Responsive multi-touch virtual analog stick for mobile gameplay
// Isolates pointerId so thumb movement never interferes with right-hand skill buttons.

import { useRef, useState, useCallback, useEffect } from "react";

/**
 * @param {Object} props
 * @param {(movement: { vx: number, vy: number }) => void} props.onMove - Directional callback with normalized coordinates (-1 to 1)
 * @param {boolean} [props.disabled=false] - When true, resets and blocks input (e.g. during pause or game over)
 * @param {number} [props.size=120] - Diameter of base circle in pixels
 * @param {number} [props.knobSize=46] - Diameter of stick knob in pixels
 * @param {number} [props.maxRadius=42] - Maximum deflection distance from center
 * @param {number} [props.deadZone=6] - Dead-zone threshold below which movement is treated as 0
 */
export function VirtualJoystick({
  onMove,
  disabled = false,
  size = 120,
  knobSize = 46,
  maxRadius = 42,
  deadZone = 6,
}) {
  const baseRef = useRef(null);
  const activePointerId = useRef(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isPressing, setIsPressing] = useState(false);

  const resetStick = useCallback(() => {
    activePointerId.current = null;
    setKnobPos({ x: 0, y: 0 });
    setIsPressing(false);
    onMove?.({ vx: 0, vy: 0 });
  }, [onMove]);

  // Release on window blur
  useEffect(() => {
    const handleBlur = () => resetStick();
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [resetStick]);

  const updateCoordinates = useCallback(
    (clientX, clientY) => {
      if (!baseRef.current) return;
      const rect = baseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist < deadZone) {
        setKnobPos({ x: 0, y: 0 });
        onMove?.({ vx: 0, vy: 0 });
        return;
      }

      const clampedDist = Math.min(dist, maxRadius);
      const angle = Math.atan2(dy, dx);
      const kx = Math.cos(angle) * clampedDist;
      const ky = Math.sin(angle) * clampedDist;

      setKnobPos({ x: kx, y: ky });

      // Normalized unit vector with analog intensity (0.0 to 1.0)
      const ratio = clampedDist / maxRadius;
      const vx = Math.cos(angle) * ratio;
      const vy = Math.sin(angle) * ratio;

      onMove?.({ vx, vy });
    },
    [deadZone, maxRadius, onMove]
  );

  const handlePointerDown = useCallback(
    (e) => {
      if (disabled) return;
      // Multi-touch guard: only track one finger on joystick base
      if (activePointerId.current !== null) return;

      e.stopPropagation();
      activePointerId.current = e.pointerId;
      setIsPressing(true);

      try {
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } catch {
        // Fallback for browsers with restricted pointer capture
      }

      updateCoordinates(e.clientX, e.clientY);
    },
    [disabled, updateCoordinates]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (disabled || e.pointerId !== activePointerId.current) return;
      e.stopPropagation();
      updateCoordinates(e.clientX, e.clientY);
    },
    [disabled, updateCoordinates]
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (e.pointerId !== activePointerId.current) return;
      e.stopPropagation();
      try {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
      } catch {
        // Ignore
      }
      resetStick();
    },
    [resetStick]
  );

  return (
    <div
      ref={baseRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        touchAction: "none",
      }}
      className={`relative rounded-full select-none flex items-center justify-center border-2 transition-colors ${
        disabled
          ? "opacity-30 border-slate-700 bg-slate-900/40 cursor-not-allowed"
          : isPressing
          ? "border-cyan-400/80 bg-slate-950/80 shadow-lg shadow-cyan-500/30"
          : "border-cyan-500/40 bg-slate-950/60 backdrop-blur-md shadow-md shadow-slate-950/60 hover:border-cyan-400/60 cursor-pointer"
      }`}
      aria-label="Virtual Joystick Gerakan Wowo"
      role="group"
    >
      {/* Directional compass indicators */}
      <div className="absolute top-2 w-1.5 h-1.5 rounded-full bg-cyan-400/50" />
      <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-cyan-400/50" />
      <div className="absolute left-2 w-1.5 h-1.5 rounded-full bg-cyan-400/50" />
      <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-cyan-400/50" />

      {/* Inner guide ring */}
      <div
        className="rounded-full border border-dashed border-cyan-500/20 pointer-events-none"
        style={{
          width: `${maxRadius * 2}px`,
          height: `${maxRadius * 2}px`,
        }}
      />

      {/* Movable thumb stick knob */}
      <div
        className={`absolute rounded-full pointer-events-none transition-transform duration-75 flex items-center justify-center ${
          isPressing && !disabled
            ? "bg-gradient-to-br from-cyan-300 via-cyan-400 to-blue-500 shadow-md shadow-cyan-400/60 ring-2 ring-white/70"
            : "bg-gradient-to-br from-cyan-400/80 to-blue-600/80 shadow-sm shadow-cyan-900/40 border border-cyan-300/60"
        }`}
        style={{
          width: `${knobSize}px`,
          height: `${knobSize}px`,
          transform: `translate(${disabled ? 0 : knobPos.x}px, ${disabled ? 0 : knobPos.y}px)`,
        }}
      >
        <div className="w-3.5 h-3.5 rounded-full bg-white/40 shadow-inner" />
      </div>
    </div>
  );
}
