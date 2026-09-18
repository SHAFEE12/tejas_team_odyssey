import * as React from "react";
import { useEffect, useRef } from "react";

const TAU = Math.PI * 2;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function hex(r, g, b, a = 1) {
  return `rgba(${r},${g},${b},${a})`;
}

export default function CareerOdysseyLogoSurge({
  style,
  width,
  height,
  density = 900,
  dotSize = 1.7,
  speed = 1,
  surge = 1,
  pointer = true,
  logoSrc = "/careeerOdyssey-logo.png",
  background = "transparent",
}) {
  const canvasRef = useRef(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const imageRef = useRef(null);
  const particlesRef = useRef([]);
  const readyRef = useRef(false);

  const settingsRef = useRef({
    density,
    dotSize,
    speed,
    surge,
    pointer,
  });

  settingsRef.current = { density, dotSize, speed, surge, pointer };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let phase = 0;

    const drag = {
      active: false,
      lx: 0,
      ly: 0,
      yaw: 0,
      pitch: 0,
      vx: 0,
      vy: 0,
    };

    const buildParticles = (img) => {
      const sampleW = 360;
      const ratio = img.naturalHeight / img.naturalWidth;
      const sampleH = Math.max(1, Math.round(sampleW * ratio));

      const offscreen = document.createElement("canvas");
      offscreen.width = sampleW;
      offscreen.height = sampleH;

      const octx = offscreen.getContext("2d");
      if (!octx) return;

      octx.drawImage(img, 0, 0, sampleW, sampleH);
      const imgData = octx.getImageData(0, 0, sampleW, sampleH);
      const data = imgData.data;

      const candidates = [];

      for (let y = 0; y < sampleH; y++) {
        for (let x = 0; x < sampleW; x++) {
          const i = (y * sampleW + x) * 4;
          const a = data[i + 3];
          if (a < 40) continue;

          candidates.push({
            x: x / sampleW - 0.5,
            y: y / sampleH - 0.5,
            color: hex(data[i], data[i + 1], data[i + 2], a / 255),
          });
        }
      }

      if (!candidates.length) return;

      const count = clamp(
        Math.round(settingsRef.current.density),
        150,
        Math.min(1800, candidates.length)
      );

      const particles = [];

      for (let i = 0; i < count; i++) {
        const c = candidates[
          Math.floor(hash(i * 7.31 + 2.17) * candidates.length)
        ];

        particles.push({
          tx: c.x,
          ty: c.y,
          color: c.color,
          seed: hash(i * 13.37 + 5.91),
        });
      }

      particlesRef.current = particles;
      readyRef.current = true;
    };

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      imageRef.current = img;
      buildParticles(img);
    };
    img.onerror = () => {
      if (cancelled) return;
      if (!img.src.includes('%20') && !img.src.includes('LOGO')) {
        img.src = '/careeerOdyssey%20LOGO.png';
      }
    };
    img.src = logoSrc;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = width || canvas.clientWidth || 320;
      const h = height || canvas.clientHeight || 180;

      sizeRef.current = { w, h };

      const bw = Math.max(1, Math.round(w * dpr));
      const bh = Math.max(1, Math.round(h * dpr));

      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onDown = (e) => {
      if (!settingsRef.current.pointer) return;

      drag.active = true;
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      drag.vx = 0;
      drag.vy = 0;

      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
    };

    const onMove = (e) => {
      if (!drag.active) return;

      const dx = e.clientX - drag.lx;
      const dy = e.clientY - drag.ly;

      drag.lx = e.clientX;
      drag.ly = e.clientY;

      drag.yaw += dx * 0.006;
      drag.pitch += dy * 0.004;

      drag.vx = dx * 0.0008;
      drag.vy = dy * 0.0006;
    };

    const onUp = () => {
      drag.active = false;
    };

    const render = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      resize();

      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);

      if (background !== "transparent") {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, w, h);
      }

      if (!readyRef.current) {
        raf = requestAnimationFrame(render);
        return;
      }

      const S = settingsRef.current;

      phase = (phase + dt * 0.55 * S.speed) % 1;

      // Loop:
      // 0.00 -> 0.38 : logo particles surge outward
      // 0.38 -> 1.00 : particles collapse back into the logo.
      const surgePhase = phase < 0.38
        ? phase / 0.38
        : 1 - (phase - 0.38) / 0.62;

      const wave = easeInOutCubic(clamp(surgePhase, 0, 1));

      if (!drag.active) {
        drag.yaw += drag.vx;
        drag.pitch += drag.vy;
        drag.vx *= Math.pow(0.92, dt * 60);
        drag.vy *= Math.pow(0.92, dt * 60);
      }

      // Fit the logo naturally with generous margins so outward surging particles
      // never exceed or get cut off by the canvas boundaries.
      const maxSurgeFactorY = 1 + 0.5 * S.surge;
      const maxSurgeFactorX = 1 + 0.35 * S.surge;

      const maxW = (w * 0.88) / maxSurgeFactorX;
      const maxH = (h * 0.72) / maxSurgeFactorY;

      const logoW = Math.min(340, maxW, maxH * 2);
      const logoH = logoW * 0.5;

      const cx = w / 2;
      const cy = h / 2;

      const particles = particlesRef.current;
      const expansion = wave * (0.25 + 0.75 * S.surge);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Deterministic per-particle direction.
        const angle = p.seed * TAU * 7.0;
        const radial = 0.15 + p.seed * 0.85;

        const burstX = Math.cos(angle) * radial;
        const burstY = Math.sin(angle) * radial;

        const localWave =
          Math.sin(
            (p.tx + p.ty) * 16 +
            phase * TAU * 2.2 +
            p.seed * TAU
          ) * 0.5 + 0.5;

        const pulse = localWave * expansion;

        let x =
          p.tx * logoW +
          burstX * logoW * 0.22 * expansion +
          Math.sin(p.seed * 31 + phase * TAU) * logoW * 0.012 * pulse;

        let y =
          p.ty * logoH +
          burstY * logoH * 0.28 * expansion +
          Math.cos(p.seed * 23 + phase * TAU) * logoH * 0.018 * pulse;

        const rx = x * Math.cos(drag.yaw) - y * Math.sin(drag.pitch) * 0.18;
        const ry = y * Math.cos(drag.pitch) + x * Math.sin(drag.yaw) * 0.08;

        x = rx;
        y = ry;

        const depth =
          0.78 +
          0.22 *
            Math.sin(
              p.seed * 20 +
              phase * TAU * (1.2 + S.surge)
            );

        const screenX = cx + x * depth;
        const screenY = cy + y * depth;

        const baseSize = S.dotSize * (0.72 + p.seed * 1.35);
        const particleSize =
          baseSize *
          (0.65 + 0.55 * (1 - expansion)) *
          (0.75 + 0.45 * localWave);

        const alpha = clamp(
          0.34 +
            0.66 * (1 - expansion) +
            localWave * 0.14,
          0.12,
          1
        );

        // Soft vignette edge falloff
        const padX = Math.max(16, w * 0.06);
        const padY = Math.max(16, h * 0.08);
        let edgeAlpha = 1;
        if (screenX < padX) edgeAlpha = Math.min(edgeAlpha, screenX / padX);
        else if (screenX > w - padX) edgeAlpha = Math.min(edgeAlpha, (w - screenX) / padX);
        if (screenY < padY) edgeAlpha = Math.min(edgeAlpha, screenY / padY);
        else if (screenY > h - padY) edgeAlpha = Math.min(edgeAlpha, (h - screenY) / padY);

        ctx.globalAlpha = alpha * clamp(edgeAlpha, 0, 1);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(0.45, particleSize), 0, TAU);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(render);
    };

    resize();

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    raf = requestAnimationFrame(render);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [logoSrc, width, height, background]);

  return (
    <div
      style={{
        position: "relative",
        overflow: "visible",
        width: typeof width === "number" && width > 0 ? width : "100%",
        height: typeof height === "number" && height > 0 ? height : "100%",
        minWidth: 24,
        minHeight: 24,
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          touchAction: "none",
        }}
      />
    </div>
  );
}
