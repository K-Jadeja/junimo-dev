"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

type Theme = "dark" | "light";
type LampState = "lit" | "off" | "transitioning";
type ThemeRgb = [number, number, number];
type ThemeKey = "bg" | "ink" | "muted" | "quiet" | "line" | "warm" | "bulb-ink" | "bulb-wire";

type ThemeTransition = {
  source: Theme;
  target: Theme;
  start: number;
  duration: number;
  origin: { x: number; y: number };
  maxDistance: number;
};

const THEME_KEYS: ThemeKey[] = ["bg", "ink", "muted", "quiet", "line", "warm", "bulb-ink", "bulb-wire"];

const DARK_THEME: Record<ThemeKey, ThemeRgb> = {
  bg: [9, 10, 9],
  ink: [239, 238, 231],
  muted: [153, 155, 148],
  quiet: [111, 115, 107],
  line: [40, 43, 38],
  warm: [255, 212, 106],
  "bulb-ink": [255, 220, 133],
  "bulb-wire": [191, 187, 169],
};

const LIGHT_THEME: Record<ThemeKey, ThemeRgb> = {
  bg: [243, 240, 232],
  ink: [23, 25, 22],
  muted: [98, 102, 95],
  quiet: [133, 137, 128],
  line: [215, 210, 199],
  warm: [166, 107, 0],
  "bulb-ink": [23, 25, 22],
  "bulb-wire": [23, 25, 22],
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(a: number, b: number, value: number) {
  const t = clamp01((value - a) / (b - a));
  return t * t * (3 - 2 * t);
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mixRgb(a: ThemeRgb, b: ThemeRgb, t: number): ThemeRgb {
  return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
}

function rgbCss(color: ThemeRgb) {
  return `rgb(${Math.round(color[0])} ${Math.round(color[1])} ${Math.round(color[2])})`;
}

function rgbaCss(color: ThemeRgb, alpha: number) {
  return `rgba(${Math.round(color[0])} ${Math.round(color[1])} ${Math.round(color[2])} / ${clamp01(alpha)})`;
}

export function FlexiblePixelBulb() {
  const heroRef = useRef<HTMLDivElement>(null);
  const assemblyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const heroElement = heroRef.current;
    const assemblyElement = assemblyRef.current;
    if (!heroElement || !assemblyElement) return;
    const toggleElement = heroElement.querySelector<HTMLButtonElement>(".flexible-pixel-bulb__toggle");
    if (!toggleElement) return;
    const hero = heroElement;
    const assembly = assemblyElement;
    const toggle = toggleElement;

    const transitionCanvas = document.createElement("canvas");
    transitionCanvas.className = "flexible-pixel-bulb__theme-canvas";
    transitionCanvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(transitionCanvas);
    const transitionContextCandidate = transitionCanvas.getContext("2d", { alpha: true });
    if (!transitionContextCandidate) {
      transitionCanvas.remove();
      throw new Error("FlexiblePixelBulb could not initialize its theme canvas.");
    }
    const transitionContext = transitionContextCandidate;

    const params = new URLSearchParams(window.location.search);
    const reducedMotion = params.has("static") || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const body = document.body;
    let theme: Theme = params.get("theme") === "light" ? "light" : "dark";
    let lampState: LampState = theme === "dark" ? "lit" : "off";
    let themeTransition: ThemeTransition | null = null;
    let transitionWidth = 1;
    let transitionHeight = 1;
    let transitionDpr = 1;
    let raf = 0;
    let entrySettleTimer = 0;

    function setThemeVariable(key: ThemeKey, value: ThemeRgb) {
      body.style.setProperty(`--${key}`, rgbCss(value));
    }

    function setThemeVariables(sourceName: Theme, targetName: Theme, progress: number) {
      const source = sourceName === "dark" ? DARK_THEME : LIGHT_THEME;
      const target = targetName === "dark" ? DARK_THEME : LIGHT_THEME;
      const p = clamp01(progress);
      for (const key of THEME_KEYS) setThemeVariable(key, mixRgb(source[key], target[key], p));
      const lightProgress = targetName === "light" ? p : 1 - p;
      body.style.setProperty("--bulb-light-progress", lightProgress.toFixed(4));
      body.style.setProperty("--bulb-dark-progress", (1 - lightProgress).toFixed(4));
    }

    function clearThemeVariableOverrides() {
      for (const key of THEME_KEYS) body.style.removeProperty(`--${key}`);
      body.style.removeProperty("--bulb-light-progress");
      body.style.removeProperty("--bulb-dark-progress");
    }

    function transitionProgressAt(transition: ThemeTransition, now: number) {
      return clamp01((now - transition.start) / transition.duration);
    }

    function resizeTransitionCanvas() {
      transitionWidth = Math.max(1, window.innerWidth);
      transitionHeight = Math.max(1, window.innerHeight);
      transitionDpr = Math.min(window.devicePixelRatio || 1, 2);
      transitionCanvas.width = Math.round(transitionWidth * transitionDpr);
      transitionCanvas.height = Math.round(transitionHeight * transitionDpr);
      transitionContext.setTransform(transitionDpr, 0, 0, transitionDpr, 0, 0);
    }

    function bulbCenter() {
      const rect = toggle.getBoundingClientRect();
      return { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.5 };
    }

    function drawAmbientLight(intensity: number) {
      if (intensity < 0.002) return;

      const center = bulbCenter();
      const haloRadius = 112 + intensity * 48;
      const halo = transitionContext.createRadialGradient(center.x, center.y, 4, center.x, center.y, haloRadius);
      halo.addColorStop(0, `rgba(255,234,170,${0.18 * intensity})`);
      halo.addColorStop(0.24, `rgba(255,216,109,${0.075 * intensity})`);
      halo.addColorStop(0.58, `rgba(255,204,76,${0.018 * intensity})`);
      halo.addColorStop(1, "rgba(255,197,55,0)");
      transitionContext.save();
      transitionContext.globalCompositeOperation = "screen";
      transitionContext.fillStyle = halo;
      transitionContext.fillRect(0, 0, transitionWidth, transitionHeight);
      transitionContext.restore();
    }

    function applyTheme(target: Theme) {
      theme = target;
      themeTransition = null;
      lampState = target === "dark" ? "lit" : "off";
      body.dataset.theme = target;
      body.dataset.transitioning = "false";
      hero.dataset.state = lampState;
      hero.dataset.lit = target === "dark" ? "true" : "false";
      hero.dataset.light = target === "dark" ? "1.000" : "0.000";
      hero.dataset.bulbPalette = target === "dark" ? "0.000" : "1.000";
      toggle.setAttribute(
        "aria-label",
        target === "dark" ? "Turn the bulb off and switch to light mode" : "Turn the bulb on and switch to dark mode",
      );
    }

    function themeOrigin() {
      return bulbCenter();
    }

    function startThemeTransition(target: Theme) {
      const now = performance.now();
      if (!themeTransition && target === theme) return;
      if (themeTransition && target === themeTransition.target) return;

      if (reducedMotion) {
        applyTheme(target);
        clearThemeVariableOverrides();
        return;
      }

      let sourceName = theme;
      let initialProgress = 0;
      if (themeTransition) {
        sourceName = themeTransition.target;
        initialProgress = 1 - transitionProgressAt(themeTransition, now);
      }

      const origin = themeOrigin();
      const maxDistance = Math.max(
        Math.hypot(origin.x, origin.y),
        Math.hypot(transitionWidth - origin.x, origin.y),
        Math.hypot(origin.x, transitionHeight - origin.y),
        Math.hypot(transitionWidth - origin.x, transitionHeight - origin.y),
      );
      const duration = target === "dark"
        ? (transitionWidth < 760 ? 620 : 760)
        : (transitionWidth < 760 ? 420 : 520);

      themeTransition = {
        source: sourceName,
        target,
        start: now - initialProgress * duration,
        duration,
        origin,
        maxDistance,
      };
      lampState = "transitioning";
      body.dataset.transitioning = "true";
      hero.dataset.state = lampState;
      toggle.setAttribute(
        "aria-label",
        target === "dark" ? "Turn the bulb off and switch to light mode" : "Turn the bulb on and switch to dark mode",
      );
    }

    function drawThemeFrame(now: number) {
      transitionContext.clearRect(0, 0, transitionWidth, transitionHeight);

      if (!themeTransition) {
        drawAmbientLight(theme === "dark" ? 1 : 0);
        return;
      }

      const transition = themeTransition;
      const raw = transitionProgressAt(transition, now);
      const progress = smoothstep(0, 1, raw);
      const darkProgress = transition.target === "dark" ? progress : 1 - progress;
      setThemeVariables(transition.source, transition.target, progress);
      hero.dataset.light = darkProgress.toFixed(3);
      hero.dataset.bulbPalette = (1 - darkProgress).toFixed(3);
      hero.dataset.lit = darkProgress > 0.82 ? "true" : "false";

      const fieldRadius = Math.max(120, progress * transition.maxDistance * 1.02);
      const targetPalette = transition.target === "dark" ? DARK_THEME : LIGHT_THEME;
      const field = transitionContext.createRadialGradient(
        transition.origin.x,
        transition.origin.y,
        0,
        transition.origin.x,
        transition.origin.y,
        fieldRadius,
      );
      const fieldLead = (1 - progress) * (transition.target === "dark" ? 0.1 : 0.07);
      field.addColorStop(0, rgbaCss(targetPalette.bg, fieldLead));
      field.addColorStop(0.42, rgbaCss(targetPalette.bg, fieldLead * 0.48));
      field.addColorStop(1, rgbaCss(targetPalette.bg, 0));
      transitionContext.fillStyle = field;
      transitionContext.fillRect(0, 0, transitionWidth, transitionHeight);
      drawAmbientLight(darkProgress * (transition.target === "dark" ? 1 : 0.72));

      if (raw >= 1) {
        applyTheme(transition.target);
        clearThemeVariableOverrides();
      }
    }

    function toggleTheme() {
      startThemeTransition(themeTransition ? themeTransition.source : (theme === "dark" ? "light" : "dark"));
    }

    function handleClick() {
      toggleTheme();
    }

    function handleAnimationEnd(event: AnimationEvent) {
      if (event.animationName !== "bulb-drop-in") return;
      window.clearTimeout(entrySettleTimer);
      hero.dataset.entry = "settled";
    }

    function frame(now: number) {
      drawThemeFrame(now);
      raf = requestAnimationFrame(frame);
    }

    body.dataset.theme = theme;
    body.dataset.transitioning = "false";
    hero.dataset.renderer = "poster-dom";
    hero.dataset.effect = "omori-poster-bulb";
    hero.dataset.motion = "drop-in-v1";
    hero.dataset.physics = "none";
    hero.dataset.entry = reducedMotion ? "settled" : "entering";
    hero.dataset.state = lampState;
    hero.dataset.lit = theme === "dark" ? "true" : "false";
    hero.dataset.light = theme === "dark" ? "1.000" : "0.000";
    hero.dataset.bulbPalette = theme === "dark" ? "0.000" : "1.000";
    hero.dataset.reducedMotion = reducedMotion ? "true" : "false";
    toggle.setAttribute(
      "aria-label",
      theme === "dark" ? "Turn the bulb off and switch to light mode" : "Turn the bulb on and switch to dark mode",
    );

    resizeTransitionCanvas();
    window.addEventListener("resize", resizeTransitionCanvas, { passive: true });
    toggle.addEventListener("click", handleClick);
    assembly.addEventListener("animationend", handleAnimationEnd);
    entrySettleTimer = window.setTimeout(() => {
      hero.dataset.entry = "settled";
    }, reducedMotion ? 0 : 1350);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(entrySettleTimer);
      window.removeEventListener("resize", resizeTransitionCanvas);
      toggle.removeEventListener("click", handleClick);
      assembly.removeEventListener("animationend", handleAnimationEnd);
      body.dataset.theme = "dark";
      body.dataset.transitioning = "false";
      clearThemeVariableOverrides();
      transitionCanvas.remove();
    };
  }, []);

  return (
    <div ref={heroRef} className="flexible-pixel-bulb" aria-label="Interactive hanging bulb">
      <div ref={assemblyRef} className="flexible-pixel-bulb__assembly">
        <span className="flexible-pixel-bulb__wire" aria-hidden="true" />
        <button
          className="flexible-pixel-bulb__toggle"
          type="button"
          aria-label="Turn the bulb off and switch to light mode"
        >
          <Image
            src="/assets/omori-bulb-body.png"
            alt=""
            width={300}
            height={502}
            priority
            sizes="(max-width: 760px) 108px, min(15vw, 176px)"
            className="flexible-pixel-bulb__asset flexible-pixel-bulb__asset--light"
          />
          <Image
            src="/assets/omori-bulb-body.png"
            alt=""
            width={300}
            height={502}
            priority
            sizes="(max-width: 760px) 108px, min(15vw, 176px)"
            className="flexible-pixel-bulb__asset flexible-pixel-bulb__asset--dark"
          />
        </button>
        <span className="flexible-pixel-bulb__hint" aria-hidden="true">click to switch light</span>
      </div>
    </div>
  );
}
