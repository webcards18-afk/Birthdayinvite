import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";

interface GoldenScratchCardProps {
  onRevealed?: () => void;
  className?: string;
}

// ── Party Bomb Explosion ─────────────────────────────────────────────────
const PARTY_EMOJIS = ["🎉", "🎊", "🥳", "🍾", "🎈", "🎆", "🎇", "✨", "💥", "🎂", "🥂", "⭐"];
const CONFETTI_COLORS = [
  "#ffd700", "#ff4500", "#ff1493", "#00ff88", "#00bfff",
  "#ff6347", "#fce09b", "#e8c07d", "#ff69b4", "#7fff00",
  "#da70d6", "#ffa500", "#ffffff", "#ff0000", "#00ffff",
];

interface ConfettiPiece {
  angle: number;
  distance: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
  shape: "rect" | "circle" | "triangle";
}

interface EmojiParticle {
  emoji: string;
  angle: number;
  distance: number;
  delay: number;
  size: number;
}

interface SparkStar {
  angle: number;
  distance: number;
  delay: number;
  size: number;
}

function usePartyParticles() {
  return useMemo(() => {
    const confetti: ConfettiPiece[] = Array.from({ length: 60 }, (_, i) => {
      const angle = (i / 60) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const shapes: Array<"rect" | "circle" | "triangle"> = ["rect", "circle", "triangle"];
      return {
        angle,
        distance: 80 + Math.random() * 180,
        delay: Math.random() * 400,
        duration: 1200 + Math.random() * 800,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length] ?? "#ffd700",
        size: 4 + Math.random() * 6,
        rotation: Math.random() * 720 - 360,
        shape: shapes[i % 3] ?? "rect",
      };
    });

    const emojis: EmojiParticle[] = Array.from({ length: 16 }, (_, i) => {
      const angle = (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      return {
        emoji: PARTY_EMOJIS[i % PARTY_EMOJIS.length] ?? "🎉",
        angle,
        distance: 60 + Math.random() * 120,
        delay: 100 + Math.random() * 500,
        size: 16 + Math.random() * 14,
      };
    });

    const sparks: SparkStar[] = Array.from({ length: 24 }, (_, i) => {
      const angle = (i / 24) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      return {
        angle,
        distance: 50 + Math.random() * 160,
        delay: Math.random() * 300,
        size: 2 + Math.random() * 4,
      };
    });

    return { confetti, emojis, sparks };
  }, []);
}

function PartyBombExplosion({ show }: { show: boolean }) {
  const { confetti, emojis, sparks } = usePartyParticles();

  if (!show) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-50 overflow-visible"
    >
      {/* Shockwave ring */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 0,
          height: 0,
          border: "3px solid rgba(255, 215, 0, 0.7)",
          boxShadow: "0 0 30px rgba(255, 215, 0, 0.5), inset 0 0 20px rgba(255, 215, 0, 0.3)",
          animation: "shockwave 0.8s ease-out forwards",
        }}
      />

      {/* Second shockwave (delayed) */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 0,
          height: 0,
          border: "2px solid rgba(255, 69, 0, 0.5)",
          boxShadow: "0 0 20px rgba(255, 69, 0, 0.3)",
          animation: "shockwave 1s ease-out 0.15s forwards",
        }}
      />

      {/* Center flash */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 40,
          height: 40,
          background: "radial-gradient(circle, rgba(255,255,255,0.95), rgba(255,215,0,0.6), transparent)",
          animation: "center-flash 0.6s ease-out forwards",
        }}
      />

      {/* Confetti pieces */}
      {confetti.map((piece, i) => {
        const tx = Math.cos(piece.angle) * piece.distance;
        const ty = Math.sin(piece.angle) * piece.distance;

        return (
          <div
            key={`confetti-${i}`}
            className="absolute left-1/2 top-1/2"
            style={{
              width: piece.size,
              height: piece.shape === "circle" ? piece.size : piece.size * 1.5,
              backgroundColor: piece.color,
              borderRadius: piece.shape === "circle" ? "50%" : piece.shape === "triangle" ? "0" : "1px",
              clipPath: piece.shape === "triangle" ? "polygon(50% 0%, 0% 100%, 100% 100%)" : undefined,
              opacity: 0,
              animation: `confetti-burst ${piece.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${piece.delay}ms forwards`,
              ["--tx" as string]: `${tx}px`,
              ["--ty" as string]: `${ty}px`,
              ["--rot" as string]: `${piece.rotation}deg`,
            }}
          />
        );
      })}

      {/* Emoji particles */}
      {emojis.map((p, i) => {
        const tx = Math.cos(p.angle) * p.distance;
        const ty = Math.sin(p.angle) * p.distance;

        return (
          <span
            key={`emoji-${i}`}
            className="absolute left-1/2 top-1/2"
            style={{
              fontSize: p.size,
              lineHeight: 1,
              opacity: 0,
              animation: `emoji-burst 1.6s cubic-bezier(0.22, 1, 0.36, 1) ${p.delay}ms forwards`,
              ["--tx" as string]: `${tx}px`,
              ["--ty" as string]: `${ty}px`,
            }}
          >
            {p.emoji}
          </span>
        );
      })}

      {/* Spark stars */}
      {sparks.map((s, i) => {
        const tx = Math.cos(s.angle) * s.distance;
        const ty = Math.sin(s.angle) * s.distance;

        return (
          <div
            key={`spark-${i}`}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: s.size,
              height: s.size,
              backgroundColor: "#fff",
              boxShadow: `0 0 ${s.size * 3}px #ffd700, 0 0 ${s.size * 6}px rgba(255, 215, 0, 0.5)`,
              opacity: 0,
              animation: `spark-fly 1s ease-out ${s.delay}ms forwards`,
              ["--tx" as string]: `${tx}px`,
              ["--ty" as string]: `${ty}px`,
            }}
          />
        );
      })}

      {/* Inline keyframes for the party bomb */}
      <style>{`
        @keyframes shockwave {
          0% { width: 0; height: 0; opacity: 1; }
          100% { width: 400px; height: 400px; opacity: 0; border-width: 1px; }
        }
        @keyframes center-flash {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(3); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(5); opacity: 0; }
        }
        @keyframes confetti-burst {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) rotate(0deg) scale(0);
            opacity: 1;
          }
          15% {
            opacity: 1;
            transform: translate(-50%, -50%) translate(calc(var(--tx) * 0.3), calc(var(--ty) * 0.3)) rotate(calc(var(--rot) * 0.3)) scale(1.2);
          }
          70% {
            opacity: 0.9;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--tx), calc(var(--ty) + 60px)) rotate(var(--rot)) scale(0.4);
            opacity: 0;
          }
        }
        @keyframes emoji-burst {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) scale(0) rotate(0deg);
            opacity: 1;
          }
          20% {
            transform: translate(-50%, -50%) translate(calc(var(--tx) * 0.4), calc(var(--ty) * 0.4)) scale(1.3) rotate(15deg);
            opacity: 1;
          }
          60% {
            opacity: 0.9;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--tx), calc(var(--ty) + 40px)) scale(0.6) rotate(-10deg);
            opacity: 0;
          }
        }
        @keyframes spark-fly {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) scale(0);
            opacity: 1;
          }
          30% {
            opacity: 1;
            transform: translate(-50%, -50%) translate(calc(var(--tx) * 0.5), calc(var(--ty) * 0.5)) scale(1.5);
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// ── Main Scratch Card ────────────────────────────────────────────────────

export function GoldenScratchCard({ onRevealed, className = "" }: GoldenScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize and paint the luxurious gold foil on the canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    if (width === 0 || height === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.globalCompositeOperation = "source-over";

    // 1. Rich metallic gold base gradient matching the background card
    const goldGrad = ctx.createLinearGradient(0, 0, width, height);
    goldGrad.addColorStop(0.0, "#d9af58");
    goldGrad.addColorStop(0.2, "#c49e50");
    goldGrad.addColorStop(0.4, "#ecd58c");
    goldGrad.addColorStop(0.6, "#d4a33c");
    goldGrad.addColorStop(0.8, "#f3df9b");
    goldGrad.addColorStop(1.0, "#b88a38");
    ctx.fillStyle = goldGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle diagonal shimmer stripes
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 3;
    for (let i = -height; i < width + height; i += 18) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + height, height);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Inner dashed border
    ctx.save();
    ctx.strokeStyle = "rgba(100, 60, 10, 0.45)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.strokeRect(10, 10, width - 20, height - 20);
    ctx.restore();

    // 4. Subtle center medallion glow
    const cx = width / 2;
    const cy = height / 2;
    const radGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.min(width, height) * 0.45);
    radGrad.addColorStop(0, "rgba(255, 255, 255, 0.35)");
    radGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(width, height) * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // 5. Foil Typography
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#3d2204";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("✦  ✦  ✦", cx, cy - 24);

    ctx.font = "bold 15px 'Jost', sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillStyle = "#2d1602";
    ctx.fillText("SCRATCH TO REVEAL", cx, cy - 2);

    ctx.font = "italic 12px 'Cormorant Garamond', Georgia, serif";
    ctx.letterSpacing = "1px";
    ctx.fillStyle = "#4a2806";
    ctx.fillText("Rub with your finger or mouse", cx, cy + 18);

    ctx.font = "14px sans-serif";
    ctx.fillText("✨", cx, cy + 36);
    ctx.restore();

    setIsRevealed(false);
    setScratchPercent(0);
  }, []);

  useEffect(() => {
    initCanvas();
    const handleResize = () => {
      if (!isRevealed) initCanvas();
    };
    window.addEventListener("resize", handleResize);

    let ro: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        if (!isRevealed) initCanvas();
      });
      ro.observe(containerRef.current);
    }

    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        if (!isRevealed) initCanvas();
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      ro?.disconnect();
    };
  }, [initCanvas, isRevealed]);

  // Scratch drawing logic
  const scratchAt = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();

    // Generous scratch brush radius
    const radius = 32 * dpr;

    if (lastPosRef.current) {
      ctx.lineWidth = radius * 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(lastPosRef.current.x * dpr, lastPosRef.current.y * dpr);
      ctx.lineTo(x * dpr, y * dpr);
      ctx.stroke();
    } else {
      ctx.arc(x * dpr, y * dpr, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    lastPosRef.current = { x, y };

    checkPercentage();
  };

  const checkPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const sampleDim = 20;
    const stepX = Math.floor(w / sampleDim);
    const stepY = Math.floor(h / sampleDim);
    const imgData = ctx.getImageData(0, 0, w, h);
    let transparentCount = 0;
    const totalSampled = sampleDim * sampleDim;

    for (let y = 0; y < sampleDim; y++) {
      for (let x = 0; x < sampleDim; x++) {
        const pixelIndex = (y * stepY * w + x * stepX) * 4;
        const alpha = imgData.data[pixelIndex + 3];
        if ((alpha ?? 255) < 60) {
          transparentCount++;
        }
      }
    }

    const percent = Math.min(100, Math.round((transparentCount / totalSampled) * 100));
    setScratchPercent(percent);

    // Auto-reveal once scratched past threshold (clears 100% of card)
    if (percent >= 25 && !isRevealed) {
      setIsRevealed(true);
      onRevealed?.();
    }
  };

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      if (!touch) return null;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isRevealed) return;
    isDrawingRef.current = true;
    const pos = getCoordinates(e);
    if (pos) {
      lastPosRef.current = null;
      scratchAt(pos.x, pos.y);
    }
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || isRevealed) return;
    const pos = getCoordinates(e);
    if (pos) {
      scratchAt(pos.x, pos.y);
    }
  };

  const handleEnd = () => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className}`}
      style={{ touchAction: "none" }}
    >
      {/* Canvas Gold Scratch Foil */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        className={`w-full h-full cursor-crosshair rounded-xl transition-opacity duration-700 ${
          isRevealed ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      />

      {/* Progress badge when scratching */}
      {!isRevealed && scratchPercent > 0 && (
        <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-[#ffd700]/70 text-[10px] text-[#ffd700] font-bold pointer-events-none tracking-wider shadow-lg">
          {scratchPercent}%
        </div>
      )}

      {/* 🎉 Party Bomb Explosion on Reveal */}
      <PartyBombExplosion show={isRevealed} />
    </div>
  );
}
