import { useEffect, useRef } from "react";

/**
 * Animated matrix-style code rain background. Cheap, GPU-friendly.
 * Uses canvas + requestAnimationFrame; pauses when tab is hidden.
 */
export function MatrixRain({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const chars = "01ITIC0PERN1C0{};()=>/*+-_$#@".split("");
    let raf = 0;
    let drops: number[] = [];
    let cols = 0;
    const fontSize = 14;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.scale(dpr, dpr);
      cols = Math.floor(window.innerWidth / fontSize);
      drops = Array(cols)
        .fill(0)
        .map(() => Math.random() * -50);
    };
    resize();
    window.addEventListener("resize", resize);

    let last = 0;
    const draw = (t: number) => {
      if (t - last > 55) {
        last = t;
        ctx.fillStyle = "rgba(10, 10, 10, 0.08)";
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.font = `${fontSize}px "Fira Code", monospace`;
        for (let i = 0; i < drops.length; i++) {
          const ch = chars[Math.floor(Math.random() * chars.length)];
          const y = drops[i] * fontSize;
          ctx.fillStyle = y < 30 ? "#CFFFCF" : "#00FF41";
          ctx.fillText(ch, i * fontSize, y);
          if (y > window.innerHeight && Math.random() > 0.975) drops[i] = 0;
          drops[i] += 1;
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ position: "fixed", inset: 0, zIndex: 0, opacity: 0.35 }}
      aria-hidden
    />
  );
}
