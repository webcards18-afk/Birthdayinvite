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

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasPlayedRef.current) {
          hasPlayedRef.current = true;
          vid.currentTime = 0;
          vid
            .play()
            .then(() => {
              rafId = requestAnimationFrame(checkEnd);
            })
            .catch(() => {});
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(vid);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
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
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onEnded={freezeAtEnd}
          className="w-full h-full object-cover block mx-auto"
        />
      </div>
    </section>
  );
}
