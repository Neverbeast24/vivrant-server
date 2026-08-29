"use client";

import { useRef, useState, type ReactNode } from "react";

/** Horizontal swipe (left or right) to remove a row. Ignores inputs, buttons, and vertical scroll. */
export function SwipeRemove({
  onRemove,
  label,
  children,
  className = "rounded-2xl",
  action = "Remove",
}: {
  onRemove: () => void;
  label: string;
  children: ReactNode;
  className?: string;
  action?: string;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const dxRef = useRef(0);
  const dragging = useRef(false);
  const axisLock = useRef<"x" | "y" | null>(null);
  const [dx, setDx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  function reset() {
    start.current = null;
    dragging.current = false;
    axisLock.current = null;
    dxRef.current = 0;
    setIsDragging(false);
    setDx(0);
  }

  function finish() {
    if (Math.abs(dxRef.current) > 72) onRemove();
    reset();
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex w-20 items-center justify-center bg-ember/90 text-[11px] font-black text-white">
        {action}
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-ember/90 text-[11px] font-black text-white">
        {action}
      </div>
      <div
        className="relative touch-pan-y"
        style={{ transform: `translateX(${dx}px)`, transition: isDragging ? "none" : "transform 180ms ease" }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          if ((event.target as HTMLElement).closest("input, button, textarea, a, select, [role='combobox'], [role='checkbox']")) {
            return;
          }
          start.current = { x: event.clientX, y: event.clientY };
          dragging.current = true;
          axisLock.current = null;
          dxRef.current = 0;
          setIsDragging(true);
          setDx(0);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!start.current || !dragging.current) return;
          const nextX = event.clientX - start.current.x;
          const nextY = event.clientY - start.current.y;

          if (!axisLock.current) {
            if (Math.abs(nextX) < 8 && Math.abs(nextY) < 8) return;
            axisLock.current = Math.abs(nextX) >= Math.abs(nextY) ? "x" : "y";
            if (axisLock.current === "y") {
              dragging.current = false;
              try {
                event.currentTarget.releasePointerCapture(event.pointerId);
              } catch {
                /* already released */
              }
              reset();
              return;
            }
          }

          if (axisLock.current !== "x") return;

          event.preventDefault();
          const clamped = Math.max(-120, Math.min(120, nextX));
          dxRef.current = clamped;
          setDx(clamped);
        }}
        onPointerUp={finish}
        onPointerCancel={reset}
        onLostPointerCapture={() => {
          if (dragging.current) finish();
        }}
      >
        {children}
      </div>
      <span className="sr-only">Swipe {label} left or right to {action.toLowerCase()}</span>
    </div>
  );
}
