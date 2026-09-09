import React, { useEffect, useRef } from "react";

export default function Chart({
  points = [],
  compact = false,
  negative = false,
  label = "Price history",
}) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const draw = () => {
      const width = canvas.clientWidth,
        height = canvas.clientHeight;
      const scale = window.devicePixelRatio || 1;
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx || !width || !height) return;
      ctx.scale(scale, scale);
      const values = points
        .map((p) => (Array.isArray(p) ? p[1] : p))
        .filter(Number.isFinite);
      if (values.length < 2) return;
      const min = Math.min(...values),
        max = Math.max(...values),
        span = max - min || 1;
      const pad = compact ? 3 : 20;
      const position = (value, i) => [
        (i / (values.length - 1)) * width,
        height - pad - ((value - min) / span) * (height - pad * 2),
      ];
      if (!compact) {
        ctx.strokeStyle = "#edf0f4";
        ctx.lineWidth = 1;
        for (let i = 1; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(0, (height * i) / 5);
          ctx.lineTo(width, (height * i) / 5);
          ctx.stroke();
        }
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, negative ? "#dc5a681c" : "#0071e31a");
        gradient.addColorStop(1, "#ffffff00");
        ctx.beginPath();
        values.forEach((v, i) => {
          const [x, y] = position(v, i);
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        });
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.strokeStyle = negative ? "#ca5060" : compact ? "#169777" : "#0071e3";
      ctx.lineWidth = compact ? 1.8 : 2.5;
      ctx.lineJoin = "round";
      values.forEach((v, i) => {
        const [x, y] = position(v, i);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.stroke();
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [points, compact, negative]);
  return (
    <canvas
      ref={ref}
      className={compact ? "sparkline" : "price-chart"}
      role="img"
      aria-label={label}
    />
  );
}
