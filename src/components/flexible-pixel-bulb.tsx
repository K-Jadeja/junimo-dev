"use client";

import { useEffect, useRef } from "react";

type Point = {
  x: number;
  y: number;
  px: number;
  py: number;
  invMass: number;
};

type Dot = {
  x: number;
  y: number;
  glass: boolean;
  lum: number;
  delay: number;
  boot: number;
  shutdown: number;
};

type Position = { x: number; y: number };
type DragSample = Position & { time: number };
type LampState = "waiting" | "igniting" | "lit" | "extinguishing" | "off" | "waiting-dark";

const CANON_W = 126;
const CANON_H = 190;
const PITCH = 3.45;
const DOT_RADIUS = 1.18;
const STEP = 1 / 120;
const MAX_STEPS = 5;

export function FlexiblePixelBulb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const hero = heroRef.current!;
    if (!canvas || !hero) return;

    const ctx = canvas.getContext("2d", { alpha: true })!;
    const replay = hero.querySelector<HTMLButtonElement>(".flexible-pixel-bulb__replay")!;
    const toggle = hero.querySelector<HTMLButtonElement>(".flexible-pixel-bulb__toggle")!;
    if (!ctx || !replay || !toggle) {
      throw new Error("FlexiblePixelBulb could not initialize its canvas controls.");
    }

    const params = new URLSearchParams(window.location.search);
    const reducedMotion = params.has("static") || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const dots: Dot[] = [];
    const glassPath = new Path2D();
    glassPath.moveTo(-18, 39);
    glassPath.bezierCurveTo(-20, 47, -25, 51, -35, 57);
    glassPath.bezierCurveTo(-53, 69, -61, 89, -61, 113);
    glassPath.bezierCurveTo(-61, 150, -35, 180, 0, 184);
    glassPath.bezierCurveTo(35, 180, 61, 150, 61, 113);
    glassPath.bezierCurveTo(61, 89, 53, 69, 35, 57);
    glassPath.bezierCurveTo(25, 51, 20, 47, 18, 39);
    glassPath.bezierCurveTo(9, 35, -9, 35, -18, 39);
    glassPath.closePath();

    const capPath = new Path2D();
    capPath.roundRect(-17, 0, 34, 38, 5);

    function hash(x: number, y: number) {
      const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
      return n - Math.floor(n);
    }

    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = 220;
    maskCanvas.height = 260;
    const maskContext = maskCanvas.getContext("2d");
    if (!maskContext) throw new Error("FlexiblePixelBulb could not create its geometry mask.");

    for (let y = 0; y <= CANON_H; y += PITCH) {
      for (let x = -CANON_W / 2; x <= CANON_W / 2; x += PITCH) {
        const glass = maskContext.isPointInPath(glassPath, x, y);
        const cap = maskContext.isPointInPath(capPath, x, y);
        if (!glass && !cap) continue;
        if (hash(x, y) < (glass ? 0.025 : 0.04)) continue;

        let lum = 0.46;
        if (glass) {
          const highlight = Math.exp(-(((x + 24) ** 2) / 340 + ((y - 83) ** 2) / 1050));
          const center = Math.exp(-((x ** 2) / 1250 + ((y - 112) ** 2) / 3400));
          lum = 0.35 + highlight * 0.48 + center * 0.1;
        } else {
          lum = 0.42 + 0.22 * (1 - Math.abs(x) / 18) + 0.09 * Math.sin(y * 0.55);
        }
        dots.push({
          x,
          y,
          glass,
          lum: Math.max(0.18, Math.min(1, lum)),
          delay: glass ? hash(x * 1.71, y * 2.13) * 0.16 : 0,
          boot: glass ? Math.max(0, Math.min(1, ((y - 38) / 146) * 0.72 + hash(x * 2.11, y * 1.87) * 0.28)) : 0,
          shutdown: glass ? Math.max(0, Math.min(1, ((184 - y) / 146) * 0.56 + (Math.abs(x) / 61) * 0.22 + hash(x * 1.37, y * 2.71) * 0.22)) : 0,
        });
      }
    }

    let cssWidth = 0;
    let cssHeight = 0;
    let dpr = 1;
    let raf = 0;
    let previous = performance.now();
    let accumulator = 0;
    let started = previous;
    let points: Point[] = [];
    let segmentLength = 0;
    let bodyAngle = 0;
    let bodyAngularVelocity = 0;
    let tautAt = Infinity;
    let settledFrames = 0;
    let lampState: LampState = reducedMotion ? "lit" : "waiting";
    let lampStateAt = previous;
    let light = reducedMotion ? 1 : 0;
    let renderNow = previous;
    let pressPointer: { id: number; x: number; y: number } | null = null;
    let dragging = false;
    let dragTarget: Position | null = null;
    let dragVelocityX = 0;
    let dragVelocityY = 0;
    let dragSample: DragSample | null = null;
    let suppressClick = false;
    let physicsSleeping = false;
    let lastInteractionAt = previous;

    function clamp01(value: number) {
      return Math.max(0, Math.min(1, value));
    }

    function easeOutCubic(value: number) {
      return 1 - Math.pow(1 - clamp01(value), 3);
    }

    function mix(a: number, b: number, t: number) {
      return a + (b - a) * t;
    }

    function smoothstep(a: number, b: number, value: number) {
      const t = clamp01((value - a) / (b - a));
      return t * t * (3 - 2 * t);
    }

    function dotPower(dot: Dot, intensity: number) {
      const ms = renderNow - lampStateAt;
      if (lampState === "igniting") {
        const sweep = clamp01((ms - 72) / 245);
        const scan = smoothstep(dot.boot - 0.07, dot.boot + 0.105, sweep);
        let pulse = 1;
        if (ms < 52) pulse = easeOutCubic(ms / 52) * 0.36;
        else if (ms < 98) pulse = mix(0.36, 0.035, (ms - 52) / 46);
        else if (ms < 148) pulse = mix(0.035, 0.31, easeOutCubic((ms - 98) / 50));
        else if (ms < 202) pulse = mix(0.31, 0.11, (ms - 148) / 54);
        else pulse = mix(0.11, 1, easeOutCubic((ms - 202) / 118));
        return clamp01(scan * pulse);
      }
      if (lampState === "extinguishing") {
        const collapse = clamp01(ms / 190);
        const remain = 1 - smoothstep(dot.shutdown - 0.075, dot.shutdown + 0.09, collapse);
        let pulse = 1;
        if (ms < 42) pulse = mix(1, 0.16, easeOutCubic(ms / 42));
        else if (ms < 82) pulse = mix(0.16, 0.44, (ms - 42) / 40);
        else pulse = mix(0.44, 0, easeOutCubic((ms - 82) / 108));
        return clamp01(remain * pulse);
      }
      return intensity;
    }

    function ignition(ms: number) {
      if (ms <= 0) return 0;
      if (ms < 52) return easeOutCubic(ms / 52) * 0.36;
      if (ms < 98) return mix(0.36, 0.035, (ms - 52) / 46);
      if (ms < 148) return mix(0.035, 0.31, easeOutCubic((ms - 98) / 50));
      if (ms < 202) return mix(0.31, 0.11, (ms - 148) / 54);
      if (ms < 320) return mix(0.11, 1, easeOutCubic((ms - 202) / 118));
      return 1;
    }

    function extinguish(ms: number) {
      if (ms <= 0) return 1;
      if (ms < 48) return mix(1, 0.18, easeOutCubic(ms / 48));
      if (ms < 92) return mix(0.18, 0.48, (ms - 48) / 44);
      if (ms < 190) return mix(0.48, 0, easeOutCubic((ms - 92) / 98));
      return 0;
    }

    function geometry() {
      const mobile = cssWidth < 760;
      return {
        mobile,
        visualHeight: mobile ? 138 : 190,
        scale: (mobile ? 138 : 190) / CANON_H,
        anchor: {
          x: mobile ? cssWidth - 112 : cssWidth - 190,
          y: mobile ? -2 : -4,
        },
        ropeLength: mobile ? 104 : 148,
        nodeCount: mobile ? 14 : 18,
      };
    }

    function initializeRope() {
      const geo = geometry();
      points = [];
      segmentLength = geo.ropeLength / (geo.nodeCount - 1);

      if (reducedMotion) {
        for (let i = 0; i < geo.nodeCount; i++) {
          const t = i / (geo.nodeCount - 1);
          const x = geo.anchor.x;
          const y = geo.anchor.y + geo.ropeLength * t;
          points.push({ x, y, px: x, py: y, invMass: i === 0 ? 0 : (i === geo.nodeCount - 1 ? 0.18 : 1) });
        }
        bodyAngle = 0;
        return;
      }

      for (let i = 0; i < geo.nodeCount; i++) {
        const t = i / (geo.nodeCount - 1);
        const x = geo.anchor.x - geo.ropeLength * 0.72 * t;
        const y = geo.anchor.y + geo.ropeLength * (0.1 * t + 0.24 * Math.sin(Math.PI * t));
        points.push({
          x,
          y,
          px: x + (i === geo.nodeCount - 1 ? 1.8 : 0),
          py: y,
          invMass: i === 0 ? 0 : (i === geo.nodeCount - 1 ? 0.18 : 1),
        });
      }
      const n = points.length;
      const dx = points[n - 1].x - points[n - 2].x;
      const dy = points[n - 1].y - points[n - 2].y;
      bodyAngle = -Math.atan2(dx, dy);
    }

    function solveConstraints(geo: ReturnType<typeof geometry>) {
      for (let iteration = 0; iteration < 11; iteration++) {
        points[0].x = geo.anchor.x;
        points[0].y = geo.anchor.y;

        for (let i = 0; i < points.length - 1; i++) {
          const a = points[i];
          const b = points[i + 1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 1;
          const error = (dist - segmentLength) / dist;
          const total = a.invMass + b.invMass;
          if (total <= 0) continue;
          const ax = dx * error * (a.invMass / total);
          const ay = dy * error * (a.invMass / total);
          const bx = dx * error * (b.invMass / total);
          const by = dy * error * (b.invMass / total);
          if (a.invMass > 0) { a.x += ax; a.y += ay; }
          if (b.invMass > 0) { b.x -= bx; b.y -= by; }
        }

        for (let i = 1; i < points.length - 1; i++) {
          const p = points[i];
          const mx = (points[i - 1].x + points[i + 1].x) * 0.5;
          const my = (points[i - 1].y + points[i + 1].y) * 0.5;
          p.x += (mx - p.x) * 0.012;
          p.y += (my - p.y) * 0.012;
        }
      }
      points[0].x = geo.anchor.x;
      points[0].y = geo.anchor.y;
    }

    function beginIgnition(now: number) {
      lampState = "igniting";
      lampStateAt = now;
    }

    function stepPhysics(dt: number, elapsed: number) {
      if (physicsSleeping && !dragging) return;
      const geo = geometry();
      const gravity = 1540;
      const damping = 0.995;

      for (let i = 1; i < points.length; i++) {
        const p = points[i];
        if (dragging && i === points.length - 1 && dragTarget) {
          p.x = dragTarget.x;
          p.y = dragTarget.y;
          p.px = p.x;
          p.py = p.y;
          continue;
        }
        const vx = (p.x - p.px) * damping;
        const vy = (p.y - p.py) * damping;
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + gravity * dt * dt * (i === points.length - 1 ? 1 : 0.48);
      }

      solveConstraints(geo);

      const last = points[points.length - 1];
      const prev = points[points.length - 2];
      const ropeTarget = -Math.atan2(last.x - prev.x, last.y - prev.y);
      let angleDelta = ropeTarget - bodyAngle;
      while (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
      while (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
      bodyAngularVelocity += angleDelta * 46 * dt;
      bodyAngularVelocity *= Math.exp(-7.4 * dt);
      bodyAngle += bodyAngularVelocity * dt;

      const straightness = Math.hypot(last.x - geo.anchor.x, last.y - geo.anchor.y) / geo.ropeLength;
      if (tautAt === Infinity && straightness > 0.975) {
        tautAt = elapsed;
        bodyAngularVelocity += 0.16;
      }

      const motionAge = performance.now() - lastInteractionAt;
      if (!dragging && motionAge > 3200) {
        const settle = clamp01((motionAge - 3200) / 900) * 0.085;
        for (let i = 1; i < points.length; i++) {
          const p = points[i];
          const targetX = geo.anchor.x;
          const targetY = geo.anchor.y + segmentLength * i;
          p.x = mix(p.x, targetX, settle);
          p.y = mix(p.y, targetY, settle);
          p.px = mix(p.px, targetX, settle * 0.82);
          p.py = mix(p.py, targetY, settle * 0.82);
        }
        bodyAngle *= 1 - settle;
        bodyAngularVelocity *= 1 - settle;
      }
      if (!dragging && motionAge > 4700 && (lampState === "lit" || lampState === "off")) {
        for (let i = 1; i < points.length; i++) {
          const p = points[i];
          p.x = geo.anchor.x;
          p.y = geo.anchor.y + segmentLength * i;
          p.px = p.x;
          p.py = p.y;
        }
        bodyAngle = 0;
        bodyAngularVelocity = 0;
        physicsSleeping = true;
      }

      const speed = Math.hypot(last.x - last.px, last.y - last.py) / dt;
      const nearlyVertical = Math.abs(ropeTarget) < 0.06;
      if (elapsed > 1050 && speed < 21 && nearlyVertical) settledFrames += 1;
      else settledFrames = 0;
      if (lampState === "waiting" && (settledFrames >= 10 || elapsed > 2450)) beginIgnition(performance.now());
      if (!dragging && settledFrames >= 72 && (lampState === "lit" || lampState === "off")) physicsSleeping = true;
    }

    function updateLamp(now: number) {
      if (reducedMotion) {
        light = lampState === "off" ? 0 : 1;
        lampState = light ? "lit" : "off";
        hero.dataset.lit = light ? "true" : "false";
      } else {
        const elapsed = now - lampStateAt;
        if (lampState === "waiting") light = 0;
        else if (lampState === "igniting") {
          light = ignition(elapsed);
          if (elapsed >= 320) { light = 1; lampState = "lit"; }
        } else if (lampState === "lit") light = 1;
        else if (lampState === "extinguishing") {
          light = extinguish(elapsed);
          if (elapsed >= 190) { light = 0; lampState = "off"; }
        } else if (lampState === "off") light = 0;
        else if (lampState === "waiting-dark") {
          light = 0;
          if (elapsed >= 230) beginIgnition(now);
        }

        hero.dataset.lit = light > 0.82 ? "true" : "false";
      }

      hero.dataset.state = lampState;
      hero.dataset.taut = tautAt < Infinity ? "true" : "false";
      hero.dataset.light = light.toFixed(3);
      toggle.dataset.lampState = lampState;
      toggle.dataset.light = light.toFixed(3);
      toggle.setAttribute("aria-label", lampState === "lit" || lampState === "igniting" ? "Turn the bulb off" : "Turn the bulb on");
    }

    function desiredBeamTarget() {
      return { x: cssWidth * 0.39, y: cssHeight * 0.55 };
    }

    let beamX = 0;
    let beamY = 0;

    function drawEnvironment(centerX: number, centerY: number, intensity: number) {
      if (intensity < 0.002) return;
      const desired = desiredBeamTarget();
      beamX += (desired.x - beamX) * 0.065;
      beamY += (desired.y - beamY) * 0.065;
      const targetX = beamX;
      const targetY = beamY;
      const angle = Math.atan2(targetY - centerY, targetX - centerX);

      ctx.save();
      ctx.globalCompositeOperation = "screen";

      for (const layer of [
        { t: 0.42, sx: 2.9, sy: 0.72, radius: 228, alpha: 0.072 },
        { t: 0.58, sx: 2.15, sy: 0.48, radius: 206, alpha: 0.052 },
        { t: 0.72, sx: 1.55, sy: 0.34, radius: 180, alpha: 0.034 },
      ]) {
        const midX = mix(centerX, targetX, layer.t);
        const midY = mix(centerY, targetY, layer.t);
        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(-angle);
        ctx.scale(layer.sx, layer.sy);
        const beam = ctx.createRadialGradient(0, 0, 8, 0, 0, layer.radius);
        beam.addColorStop(0, `rgba(255,224,145,${layer.alpha * intensity})`);
        beam.addColorStop(0.42, `rgba(255,207,84,${layer.alpha * 0.46 * intensity})`);
        beam.addColorStop(1, "rgba(255,200,60,0)");
        ctx.fillStyle = beam;
        ctx.beginPath(); ctx.arc(0, 0, layer.radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const halo = ctx.createRadialGradient(centerX, centerY, 3, centerX, centerY, 128);
      halo.addColorStop(0, `rgba(255,234,170,${0.21 * intensity})`);
      halo.addColorStop(0.24, `rgba(255,216,109,${0.11 * intensity})`);
      halo.addColorStop(0.56, `rgba(255,204,76,${0.038 * intensity})`);
      halo.addColorStop(1, "rgba(255,197,55,0)");
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(centerX, centerY, 128, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function drawRope(intensity: number) {
      if (!points.length) return;
      ctx.save();
      const first = points[0];
      const last = points[points.length - 1];
      const gradient = ctx.createLinearGradient(first.x, first.y, last.x, last.y);
      gradient.addColorStop(0, "rgba(74,78,70,.86)");
      gradient.addColorStop(0.7, intensity > 0.25 ? "rgba(143,119,60,.92)" : "rgba(92,96,87,.94)");
      gradient.addColorStop(1, intensity > 0.25 ? "rgba(191,155,69,.98)" : "rgba(106,109,99,.96)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.25;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (intensity > 0.2) {
        ctx.shadowColor = `rgba(255,207,91,${0.18 * intensity})`;
        ctx.shadowBlur = 5;
      }

      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        const midX = (current.x + next.x) * 0.5;
        const midY = (current.y + next.y) * 0.5;
        ctx.quadraticCurveTo(current.x, current.y, midX, midY);
      }
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
      ctx.restore();
    }

    function drawBulb(pivot: Point, angle: number, scale: number, intensity: number) {
      const centerLocalY = 106;
      const centerX = pivot.x - centerLocalY * scale * Math.sin(angle);
      const centerY = pivot.y + centerLocalY * scale * Math.cos(angle);
      drawEnvironment(centerX, centerY, intensity);

      ctx.save();
      ctx.translate(pivot.x, pivot.y);
      ctx.rotate(angle);
      ctx.scale(scale, scale);

      ctx.fillStyle = intensity > 0.25 ? "rgba(191,157,72,.92)" : "rgba(90,94,85,.96)";
      ctx.beginPath(); ctx.roundRect(-5, -2, 10, 6, 2); ctx.fill();
      ctx.strokeStyle = intensity > 0.25 ? "rgba(236,198,99,.72)" : "rgba(112,116,105,.75)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-10, 4); ctx.lineTo(10, 4); ctx.stroke();

      if (intensity > 0.04) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        for (const dot of dots) {
          if (!dot.glass) continue;
          const dotLight = dotPower(dot, intensity);
          if (dotLight <= 0.01) continue;
          ctx.fillStyle = `rgba(255,202,68,${(0.055 * dotLight).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, DOT_RADIUS * 2.05, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      for (const dot of dots) {
        const base = dot.lum;
        const dotLight = dot.glass ? dotPower(dot, intensity) : intensity * 0.16;
        let r: number;
        let g: number;
        let b: number;
        let a: number;
        if (!dot.glass) {
          const metal = 86 + base * 94;
          r = mix(metal, 210, dotLight);
          g = mix(metal + 2, 180, dotLight);
          b = mix(metal - 4, 91, dotLight);
          a = 0.72 + base * 0.2;
        } else {
          const off = 63 + base * 66;
          r = mix(off, 255, dotLight);
          g = mix(off + 4, 218 + base * 28, dotLight);
          b = mix(off - 1, 73 + base * 68, dotLight);
          a = 0.54 + base * 0.42;
        }
        ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, DOT_RADIUS * (0.9 + base * 0.16), 0, Math.PI * 2);
        ctx.fill();
      }

      if (intensity > 0.05) {
        const filamentAlpha = Math.min(1, intensity * 1.55);
        ctx.strokeStyle = `rgba(255,235,166,${(0.28 * filamentAlpha).toFixed(3)})`;
        ctx.shadowColor = `rgba(255,211,92,${(0.65 * filamentAlpha).toFixed(3)})`;
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(-11, 107);
        ctx.quadraticCurveTo(-4, 96, 0, 106);
        ctx.quadraticCurveTo(4, 116, 11, 107);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      ctx.strokeStyle = intensity > 0.25 ? "rgba(232,194,91,.5)" : "rgba(34,37,33,.92)";
      ctx.lineWidth = 1;
      for (const y of [8, 15, 22, 29]) {
        ctx.beginPath(); ctx.moveTo(-14, y); ctx.lineTo(14, y); ctx.stroke();
      }
      ctx.restore();

      return { centerX, centerY };
    }

    function updateToggle(centerX: number, centerY: number, scale: number) {
      const canvasRect = canvas.getBoundingClientRect();
      const heroRect = hero.getBoundingClientRect();
      const width = CANON_W * scale + 28;
      const height = CANON_H * scale + 18;
      const rawLeft = canvasRect.left - heroRect.left + centerX - width * 0.5;
      const rawTop = canvasRect.top - heroRect.top + centerY - height * 0.52;
      const maxLeft = Math.max(0, heroRect.width - width);
      toggle.style.width = `${width}px`;
      toggle.style.height = `${height}px`;
      toggle.style.left = `${Math.max(0, Math.min(maxLeft, rawLeft))}px`;
      toggle.style.top = `${rawTop}px`;
    }

    function canvasPoint(event: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function clampDragPoint(point: Position) {
      const geo = geometry();
      const dx = point.x - geo.anchor.x;
      const dy = point.y - geo.anchor.y;
      const distance = Math.hypot(dx, dy) || 1;
      const maxDistance = geo.ropeLength * 0.985;
      const minDistance = geo.ropeLength * 0.28;
      const clamped = Math.max(minDistance, Math.min(maxDistance, distance));
      return {
        x: geo.anchor.x + (dx / distance) * clamped,
        y: geo.anchor.y + (dy / distance) * clamped,
      };
    }

    function releaseDrag() {
      if (!dragging || !points.length) return;
      const last = points[points.length - 1];
      last.invMass = 0.18;
      last.px = last.x - dragVelocityX * 0.86;
      last.py = last.y - dragVelocityY * 0.86;
      bodyAngularVelocity += dragVelocityX * 0.0024;
      physicsSleeping = false;
      lastInteractionAt = performance.now();
      dragging = false;
      dragTarget = null;
      toggle.dataset.dragging = "false";
    }

    function toggleLamp() {
      const now = performance.now();
      if (lampState === "lit" || lampState === "igniting") {
        lampState = "extinguishing";
        lampStateAt = now;
        hero.dataset.lit = "false";
        return;
      }
      if (lampState === "off") {
        lampState = "waiting-dark";
        lampStateAt = now;
        light = 0;
        physicsSleeping = false;
        lastInteractionAt = now;
        if (points.length) {
          const last = points[points.length - 1];
          last.px += -1.25;
          bodyAngularVelocity += -0.012;
        }
      }
    }

    function reset() {
      cancelAnimationFrame(raf);
      previous = performance.now();
      accumulator = 0;
      started = previous;
      tautAt = Infinity;
      settledFrames = 0;
      bodyAngularVelocity = 0;
      physicsSleeping = false;
      lastInteractionAt = previous;
      lampState = reducedMotion ? "lit" : "waiting";
      lampStateAt = previous;
      light = reducedMotion ? 1 : 0;
      hero.dataset.lit = reducedMotion ? "true" : "false";
      initializeRope();
      raf = requestAnimationFrame(frame);
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      cssWidth = Math.max(1, rect.width);
      cssHeight = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      beamX = cssWidth * 0.39;
      beamY = cssHeight * 0.55;
      reset();
    }

    function frame(now: number) {
      renderNow = now;
      const frameSeconds = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      const elapsed = now - started;
      accumulator += frameSeconds;

      if (!reducedMotion) {
        let steps = 0;
        while (accumulator >= STEP && steps < MAX_STEPS) {
          stepPhysics(STEP, elapsed);
          accumulator -= STEP;
          steps += 1;
        }
        if (steps === MAX_STEPS) accumulator = 0;
      }

      updateLamp(now);
      ctx.clearRect(0, 0, cssWidth, cssHeight);
      const geo = geometry();
      const last = points[points.length - 1];
      drawRope(light);
      const center = drawBulb(last, bodyAngle, geo.scale, light);
      updateToggle(center.centerX, center.centerY, geo.scale);
      raf = requestAnimationFrame(frame);
    }

    function handleReplay() {
      reset();
    }

    function handlePointerDown(event: PointerEvent) {
      pressPointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      dragSample = { ...canvasPoint(event), time: event.timeStamp };
      dragVelocityX = 0;
      dragVelocityY = 0;
      suppressClick = false;
      toggle.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event: PointerEvent) {
      if (!pressPointer || event.pointerId !== pressPointer.id || !dragSample) return;
      const moved = Math.hypot(event.clientX - pressPointer.x, event.clientY - pressPointer.y);
      if (!dragging && moved > 5) {
        physicsSleeping = false;
        lastInteractionAt = performance.now();
        dragging = true;
        suppressClick = true;
        toggle.dataset.dragging = "true";
        if (points.length) points[points.length - 1].invMass = 0;
      }
      if (!dragging) return;

      const raw = canvasPoint(event);
      dragTarget = clampDragPoint(raw);
      const dt = Math.max(8, event.timeStamp - dragSample.time);
      dragVelocityX = (raw.x - dragSample.x) * 16 / dt;
      dragVelocityY = (raw.y - dragSample.y) * 16 / dt;
      dragSample = { ...raw, time: event.timeStamp };
    }

    function handlePointerUp(event: PointerEvent) {
      if (!pressPointer || event.pointerId !== pressPointer.id) return;
      releaseDrag();
      pressPointer = null;
      dragSample = null;
      try { toggle.releasePointerCapture(event.pointerId); } catch {}
    }

    function handlePointerCancel(event: PointerEvent) {
      releaseDrag();
      pressPointer = null;
      dragSample = null;
      try { toggle.releasePointerCapture(event.pointerId); } catch {}
    }

    function handleClick(event: MouseEvent) {
      if (suppressClick) {
        event.preventDefault();
        suppressClick = false;
        return;
      }
      toggleLamp();
    }

    function handleDragStart(event: DragEvent) {
      event.preventDefault();
    }

    hero.dataset.renderer = "canvas";
    hero.dataset.effect = "flexible-pixel-v4";
    hero.dataset.state = lampState;
    hero.dataset.taut = "false";
    hero.dataset.light = light.toFixed(3);
    toggle.dataset.dragging = "false";

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("resize", resize, { passive: true });
    replay.addEventListener("click", handleReplay);
    toggle.addEventListener("pointerdown", handlePointerDown);
    toggle.addEventListener("pointermove", handlePointerMove);
    toggle.addEventListener("pointerup", handlePointerUp);
    toggle.addEventListener("pointercancel", handlePointerCancel);
    toggle.addEventListener("click", handleClick);
    toggle.addEventListener("dragstart", handleDragStart);
    resize();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      replay.removeEventListener("click", handleReplay);
      toggle.removeEventListener("pointerdown", handlePointerDown);
      toggle.removeEventListener("pointermove", handlePointerMove);
      toggle.removeEventListener("pointerup", handlePointerUp);
      toggle.removeEventListener("pointercancel", handlePointerCancel);
      toggle.removeEventListener("click", handleClick);
      toggle.removeEventListener("dragstart", handleDragStart);
    };
  }, []);

  return (
    <div ref={heroRef} className="flexible-pixel-bulb" aria-label="Interactive hanging bulb">
      <canvas ref={canvasRef} className="flexible-pixel-bulb__canvas" aria-hidden="true" />
      <button
        className="flexible-pixel-bulb__toggle"
        type="button"
        aria-label="Turn the bulb off"
      />
      <button className="flexible-pixel-bulb__replay" type="button">Replay light</button>
    </div>
  );
}
