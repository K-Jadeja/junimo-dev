"use client";

import { useEffect, useRef } from "react";

const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform vec2 u_anchor;
  uniform vec2 u_bulb;
  uniform float u_pixel_ratio;
  uniform float u_ignition;
  uniform float u_time;

  float sdBox(vec2 point, vec2 bounds) {
    vec2 distanceToEdge = abs(point) - bounds;
    return length(max(distanceToEdge, 0.0)) + min(max(distanceToEdge.x, distanceToEdge.y), 0.0);
  }

  float sdSegment(vec2 point, vec2 start, vec2 end) {
    vec2 segment = end - start;
    vec2 projected = start + segment * clamp(dot(point - start, segment) / dot(segment, segment), 0.0, 1.0);
    return length(point - projected);
  }

  void main() {
    vec2 point = gl_FragCoord.xy;
    float pixel = u_pixel_ratio;
    float energy = clamp(u_ignition, 0.0, 1.0);
    float electricalFlicker = energy < 1.0 ? 0.82 + 0.18 * sin(u_time * 50.0) : 1.0;
    vec3 warm = vec3(1.0, 0.73, 0.26);
    vec3 hardware = vec3(0.23, 0.25, 0.22);

    vec2 broadField = vec2(
      (point.x - (u_bulb.x - 260.0 * pixel)) / (u_resolution.x * 0.56),
      (point.y - (u_bulb.y - 12.0 * pixel)) / (u_resolution.y * 0.68)
    );
    vec2 nearField = vec2(
      (point.x - u_bulb.x) / (u_resolution.x * 0.24),
      (point.y - u_bulb.y) / (u_resolution.y * 0.42)
    );
    float lightField = (
      exp(-dot(broadField, broadField) * 2.1) * 0.24 +
      exp(-dot(nearField, nearField) * 2.0) * 0.16
    ) * energy;
    vec3 color = warm;
    float alpha = lightField;

    float cord = 1.0 - smoothstep(0.35 * pixel, 1.3 * pixel, sdSegment(point, u_anchor, u_bulb + vec2(0.0, 45.0 * pixel)));
    float socket = 1.0 - smoothstep(0.0, 1.2 * pixel, sdBox(point - (u_bulb + vec2(0.0, 53.0 * pixel)), vec2(18.0, 9.0) * pixel));
    float socketThread = 1.0 - smoothstep(0.0, 1.0 * pixel, abs(abs(point.y - u_bulb.y - 53.0 * pixel) - 5.0 * pixel));
    socketThread *= 1.0 - smoothstep(14.0 * pixel, 20.0 * pixel, abs(point.x - u_bulb.x));

    vec2 bulbSpace = (point - u_bulb) / (vec2(46.0, 53.0) * pixel);
    float ellipse = length(bulbSpace);
    float glass = 1.0 - smoothstep(0.94, 1.02, ellipse);
    float shell = 1.0 - smoothstep(0.0, 0.035, abs(ellipse - 1.0));
    vec2 cell = fract((bulbSpace + 1.0) * 5.5) - 0.5;
    float dot = 1.0 - smoothstep(0.12, 0.28, length(cell));
    float dots = dot * glass;
    float bulb = max(dots, shell * 0.72);
    vec3 bulbColor = mix(hardware, warm, energy * electricalFlicker);

    color = mix(color, bulbColor, bulb);
    alpha = max(alpha, bulb);
    color = mix(color, hardware, max(cord, socket));
    alpha = max(alpha, max(cord, socket));
    color = mix(color, warm, socketThread * energy * 0.86);

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
  }
`;

type PendulumPhase = "dropping" | "pendulum" | "igniting" | "lit";

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create the bulb shader.");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader compilation error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create the bulb shader program.");

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Unknown shader link error.";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

export function LightBulb() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let resizeObserver: ResizeObserver | undefined;
    let animationFrame = 0;
    let cssWidth = 0;
    let cssHeight = 0;
    let pixelRatio = 1;

    try {
      gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        premultipliedAlpha: false,
      });
      if (!gl) throw new Error("WebGL is unavailable.");

      program = createProgram(gl);
      buffer = gl.createBuffer();
      if (!buffer) throw new Error("Unable to create the bulb geometry buffer.");

      const position = gl.getAttribLocation(program, "a_position");
      const uniforms = {
        resolution: gl.getUniformLocation(program, "u_resolution"),
        anchor: gl.getUniformLocation(program, "u_anchor"),
        bulb: gl.getUniformLocation(program, "u_bulb"),
        pixelRatio: gl.getUniformLocation(program, "u_pixel_ratio"),
        ignition: gl.getUniformLocation(program, "u_ignition"),
        time: gl.getUniformLocation(program, "u_time"),
      };

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const pendulumLength = 145;
      const gravity = 1760;
      const damping = 2.8;
      let phase: PendulumPhase = reducedMotion ? "lit" : "dropping";
      let dropOffset = reducedMotion ? 0 : -240;
      let dropVelocity = 0;
      let angle = reducedMotion ? 0 : -0.18;
      let angularVelocity = 0;
      let phaseTime = 0;
      let ignitionStart = 0;
      let previousTime = performance.now();

      wrapper.dataset.renderer = "webgl";
      wrapper.dataset.shader = "pendulum-light-field";
      wrapper.dataset.state = reducedMotion ? "lit" : "dropping";

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        cssWidth = rect.width;
        cssHeight = rect.height;
        pixelRatio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 4);
        const width = Math.max(1, Math.round(cssWidth * pixelRatio));
        const height = Math.max(1, Math.round(cssHeight * pixelRatio));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl?.viewport(0, 0, width, height);
        }
      };

      const draw = (time: number) => {
        const delta = Math.min((time - previousTime) / 1000, 0.04);
        previousTime = time;
        phaseTime += delta;

        if (!reducedMotion && phase === "dropping") {
          dropVelocity += gravity * delta;
          dropOffset += dropVelocity * delta;
          if (dropOffset >= 0) {
            dropOffset = 0;
            dropVelocity *= -0.18;
            angularVelocity = 0.86;
            phase = "pendulum";
            phaseTime = 0;
            wrapper.dataset.state = "pendulum";
          }
        } else if (!reducedMotion && phase === "pendulum") {
          const angularAcceleration = -(gravity / pendulumLength) * Math.sin(angle) - damping * angularVelocity;
          angularVelocity += angularAcceleration * delta;
          angle += angularVelocity * delta;
          dropVelocity += gravity * delta;
          dropOffset += dropVelocity * delta;

          if (dropOffset >= 0) {
            dropOffset = 0;
            dropVelocity *= -0.18;
          }

          const naturallySettled = phaseTime > 1.55 && Math.abs(angle) < 0.045 && Math.abs(angularVelocity) < 0.09 && Math.abs(dropVelocity) < 8;
          if (naturallySettled || phaseTime > 4.2) {
            phase = "igniting";
            ignitionStart = time;
            phaseTime = 0;
            wrapper.dataset.state = "igniting";
          }
        } else if (!reducedMotion && phase === "igniting") {
          if ((time - ignitionStart) / 460 >= 1) {
            phase = "lit";
            phaseTime = 0;
            wrapper.dataset.state = "lit";
          }
        } else if (phase === "lit") {
          angle = reducedMotion ? 0 : Math.sin((time - ignitionStart) * 0.00105) * 0.006;
          dropOffset = reducedMotion ? 0 : Math.sin((time - ignitionStart) * 0.00135) * 0.45;
        }

        resize();
        const anchorX = cssWidth * 0.78;
        const anchorY = 0;
        const bulbX = anchorX + Math.sin(angle) * pendulumLength;
        const bulbY = anchorY + Math.cos(angle) * pendulumLength + dropOffset;
        const ignition = reducedMotion || phase === "lit" ? 1 : phase === "igniting" ? Math.min(1, (time - ignitionStart) / 460) : 0;

        gl?.useProgram(program);
        gl?.uniform2f(uniforms.resolution, canvas.width, canvas.height);
        gl?.uniform2f(uniforms.anchor, anchorX * pixelRatio, (cssHeight - anchorY) * pixelRatio);
        gl?.uniform2f(uniforms.bulb, bulbX * pixelRatio, (cssHeight - bulbY) * pixelRatio);
        gl?.uniform1f(uniforms.pixelRatio, pixelRatio);
        gl?.uniform1f(uniforms.ignition, ignition);
        gl?.uniform1f(uniforms.time, time / 1000);
        gl?.clear(gl.COLOR_BUFFER_BIT);
        gl?.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        animationFrame = requestAnimationFrame(draw);
      };

      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
      window.addEventListener("resize", resize, { passive: true });
      animationFrame = requestAnimationFrame(draw);

      return () => {
        cancelAnimationFrame(animationFrame);
        resizeObserver?.disconnect();
        window.removeEventListener("resize", resize);
        if (buffer) gl?.deleteBuffer(buffer);
        if (program) gl?.deleteProgram(program);
      };
    } catch {
      wrapper.dataset.renderer = "unavailable";
      return () => {
        cancelAnimationFrame(animationFrame);
        resizeObserver?.disconnect();
        if (buffer) gl?.deleteBuffer(buffer);
        if (program) gl?.deleteProgram(program);
      };
    }
  }, []);

  return (
    <div className="light-bulb" ref={wrapperRef} aria-hidden="true">
      <canvas ref={canvasRef} className="light-bulb__canvas" />
    </div>
  );
}
