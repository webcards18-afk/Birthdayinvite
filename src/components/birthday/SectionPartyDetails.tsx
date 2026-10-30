import { useEffect, useRef, useState } from "react";
import { clips } from "@/config/wedding";

export function SectionPartyDetails() {
  const videoSrc = clips.four ? clips.four.src : "/4-vid.mp4";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const hasPlayedRef = useRef(false);
  const stoppedRef = useRef(false);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    // Explicitly configure for iOS Safari playback
    vid.defaultMuted = true;
    vid.muted = true;
    vid.playsInline = true;
    vid.setAttribute("playsinline", "true");
    vid.setAttribute("webkit-playsinline", "true");
    vid.setAttribute("x5-playsinline", "true");

    let rafId: number;

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

    const startPlayback = () => {
      if (hasPlayedRef.current || stoppedRef.current) return;
      hasPlayedRef.current = true;
      vid.defaultMuted = true;
      vid.muted = true;

      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            rafId = requestAnimationFrame(checkEnd);
          })
          .catch((err) => {
            console.warn("Video 4 autoplay waiting for touch/scroll:", err);
            hasPlayedRef.current = false; // Allow retry on user interaction!
            const onInteraction = () => {
              if (vid && !stoppedRef.current) {
                hasPlayedRef.current = true;
                vid.play().then(() => {
                  rafId = requestAnimationFrame(checkEnd);
                }).catch(() => {});
              }
            };
            window.addEventListener("touchstart", onInteraction, { once: true, passive: true });
            window.addEventListener("scroll", onInteraction, { once: true, passive: true });
          });
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          startPlayback();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(vid);

    // Fallback: Check scroll position in case IntersectionObserver is throttled on mobile
    const handleScrollCheck = () => {
      if (hasPlayedRef.current || stoppedRef.current) return;
      const rect = vid.getBoundingClientRect();
      if (rect.height > 50 && rect.top < window.innerHeight * 0.85 && rect.bottom > window.innerHeight * 0.15) {
        startPlayback();
      }
    };
    window.addEventListener("scroll", handleScrollCheck, { passive: true });
    window.addEventListener("touchstart", handleScrollCheck, { passive: true });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScrollCheck);
      window.removeEventListener("touchstart", handleScrollCheck);
      if (vid) {
        try {
          vid.pause();
        } catch {}
      }
    };
  }, []);

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

    if (vid.duration && !isNaN(vid.duration) && vid.duration > 0) {
      if (vid.currentTime >= vid.duration - 0.08) {
        freezeAtEnd();
      }
    }
  };

  if (!videoSrc) return null;

  return (
    <section
      id="details"
      className="relative w-full h-[100dvh] min-h-[100dvh] bg-[#120702] overflow-hidden flex items-center justify-center select-none"
    >
      {/* Edge-to-edge container: covers mobile viewport completely with 0 gaps */}
      <div className="relative w-full h-full max-w-[480px] sm:max-w-[540px] flex items-center justify-center overflow-hidden">
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
          className="w-full h-full object-cover block mx-auto"
        />

        {/* Scroll hint — white color at bottom center */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 sm:bottom-6 flex flex-col items-center text-white animate-bounce z-30 pointer-events-none transition-opacity duration-1000">
          <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.2em] font-semibold text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] text-white">
            Scroll Down
          </span>
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-white mt-0.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
}
