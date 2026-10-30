import { useEffect, useRef, useState } from "react";
import { clips } from "@/config/wedding";
import { GoldenScratchCard } from "@/components/birthday/GoldenScratchCard";

interface SectionAgePosterProps {
  onScratched?: () => void;
}

export function SectionAgePoster({ onScratched }: SectionAgePosterProps) {
  const videoSrc = clips.two ? clips.two.src : "/2-vid.mp4";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const hasPlayedRef = useRef(false);
  const stoppedRef = useRef(false);

  // Configure video for iOS & Android on mount
  useEffect(() => {
    if (videoRef.current) {
      const vid = videoRef.current;
      vid.defaultMuted = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.setAttribute("playsinline", "true");
      vid.setAttribute("webkit-playsinline", "true");
      vid.setAttribute("x5-playsinline", "true");
    }
  }, []);

  // Play video 2 ONLY once after the card is scratched/revealed
  useEffect(() => {
    if (isRevealed && videoRef.current && !hasPlayedRef.current) {
      hasPlayedRef.current = true;
      const vid = videoRef.current;
      vid.defaultMuted = true;
      vid.muted = true;
      vid.playsInline = true;

      let rafId: number;
      const startRafCheck = () => {
        const checkEnd = () => {
          if (vid && !vid.paused && !stoppedRef.current) {
            const duration = vid.duration;
            if (duration && !isNaN(duration) && duration > 0.5) {
              if (vid.currentTime >= duration - 0.06) {
                stoppedRef.current = true;
                vid.pause();
                vid.currentTime = Math.max(0, duration - 0.04);
                setIsVideoEnded(true);
                return;
              }
            }
          }
          if (!stoppedRef.current) {
            rafId = requestAnimationFrame(checkEnd);
          }
        };
        rafId = requestAnimationFrame(checkEnd);
      };

      const tryPlay = () => {
        const playPromise = vid.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              startRafCheck();
            })
            .catch((err) => {
              console.warn("Video 2 play pending mobile gesture:", err);
              hasPlayedRef.current = false; // Allow retry on user touch!
              const onTouchOnce = () => {
                if (vid && !stoppedRef.current) {
                  hasPlayedRef.current = true;
                  vid.play().then(() => startRafCheck()).catch(() => {});
                }
              };
              window.addEventListener("touchstart", onTouchOnce, { once: true, passive: true });
              window.addEventListener("click", onTouchOnce, { once: true, passive: true });
            });
        }
      };

      tryPlay();

      return () => cancelAnimationFrame(rafId);
    }
  }, [isRevealed]);

  const freezeAtEnd = () => {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    setIsVideoEnded(true);

    const vid = videoRef.current;
    if (vid) {
      vid.pause();
      if (vid.duration && !isNaN(vid.duration)) {
        vid.currentTime = Math.max(0, vid.duration - 0.04);
      }
    }
  };

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid || stoppedRef.current) return;
    if (vid.duration && !isNaN(vid.duration) && vid.duration > 0.5) {
      if (vid.currentTime >= vid.duration - 0.08) {
        freezeAtEnd();
      }
    }
  };

  const handleReveal = () => {
    setIsRevealed(true);
    onScratched?.();

    // Directly trigger playback while user touch/drag gesture is active
    const vid = videoRef.current;
    if (vid && !hasPlayedRef.current) {
      hasPlayedRef.current = true;
      vid.defaultMuted = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.play().catch((err) => {
        console.warn("Video 2 immediate play caught:", err);
        hasPlayedRef.current = false;
      });
    }
  };

  if (!videoSrc) return null;

  return (
    <section
      id="poster"
      className="relative w-full h-[100dvh] min-h-[100dvh] bg-[#120702] overflow-hidden flex items-center justify-center select-none"
    >
      {/* Edge-to-edge container fitting mobile screen width without letterbox gaps */}
      <div className="relative w-full h-full max-w-[480px] sm:max-w-[540px] flex items-center justify-center overflow-hidden">
        {/* Background Video 2 — fills container edge to edge */}
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          playsInline
          webkit-playsinline="true"
          x5-playsinline="true"
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onEnded={freezeAtEnd}
          className="w-full h-full object-cover block"
        />

        {/* Interactive Golden Scratch Card overlay — fits exactly over the background card */}
        <div
          className={`absolute z-20 transition-all duration-700 ${
            isRevealed ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"
          }`}
          style={{
            top: "10.5%",
            left: "4%",
            width: "92%",
            height: "45%",
            borderRadius: "16px",
          }}
        >
          <GoldenScratchCard
            onRevealed={handleReveal}
            className="w-full h-full rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.85)] border border-[#ffd700]/40"
          />
        </div>

        {/* Scroll hint shown AFTER scratching the card — white color at bottom right */}
        {isRevealed && (
          <div className="absolute bottom-6 right-4 sm:right-6 flex flex-col items-center text-white animate-bounce z-30 pointer-events-none transition-opacity duration-1000">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] font-semibold text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] text-white">
              Scroll to begin celebration
            </span>
            <svg
              className="w-5 h-5 text-white mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        )}
      </div>
    </section>
  );
}
