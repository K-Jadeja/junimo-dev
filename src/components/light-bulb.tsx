"use client";

import { useEffect, useRef, useState } from "react";

const pixelPattern = [
  "   1   ",
  "  111  ",
  " 11111 ",
  "1111111",
  "1111111",
  " 11111 ",
  "  111  ",
  "   1   ",
];

export function LightBulb() {
  const assemblyRef = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState(false);

  useEffect(() => {
    const assembly = assemblyRef.current;
    if (!assembly) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      assembly.style.transform = "translate3d(0, 0, 0) rotate(0deg)";
      return;
    }

    let animationFrame = 0;
    let lightTimer: ReturnType<typeof setTimeout> | undefined;
    let previousTime = performance.now();
    let position = -190;
    let velocity = 0;
    let rotation = 0;
    let angularVelocity = 0;
    let settled = false;
    let settledAt = 0;

    const animate = (time: number) => {
      const delta = Math.min((time - previousTime) / 1000, 0.04);
      previousTime = time;

      if (!settled) {
        velocity += 1700 * delta;
        position += velocity * delta;
        rotation += angularVelocity * delta;
        angularVelocity += (-rotation * 18 - angularVelocity * 7) * delta;

        if (position >= 0) {
          position = 0;
          if (Math.abs(velocity) > 28) {
            velocity *= -0.25;
            angularVelocity += velocity * -0.003;
          } else {
            velocity = 0;
            settled = true;
            settledAt = time;
            lightTimer = setTimeout(() => setLit(true), 130);
          }
        }
      } else {
        const idleTime = time - settledAt;
        position = Math.sin(idleTime * 0.0014) * 0.8;
        rotation = Math.sin(idleTime * 0.0011) * 0.007;
      }

      assembly.style.transform = `translate3d(0, ${position.toFixed(2)}px, 0) rotate(${rotation.toFixed(4)}rad)`;
      animationFrame = requestAnimationFrame(animate);
    };

    assembly.style.transform = "translate3d(0, -190px, 0) rotate(0deg)";
    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      if (lightTimer) clearTimeout(lightTimer);
    };
  }, []);

  return (
    <div className={`light-bulb ${lit ? "is-lit" : ""}`} aria-hidden="true">
      <div className="light-bulb__assembly" ref={assemblyRef}>
        <span className="light-bulb__cord" />
        <span className="light-bulb__socket">
          <span />
          <span />
          <span />
        </span>
        <span className="light-bulb__glass">
          <span className="light-bulb__glow" />
          <span className="light-bulb__dots">
            {pixelPattern.flatMap((row, rowIndex) =>
              Array.from(row).map((cell, columnIndex) =>
                cell === "1" ? <i key={`${rowIndex}-${columnIndex}`} style={{ gridColumn: columnIndex + 1, gridRow: rowIndex + 1 }} /> : null,
              ),
            )}
          </span>
        </span>
      </div>
    </div>
  );
}
