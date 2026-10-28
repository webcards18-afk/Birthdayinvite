import { useEffect, useRef, useState } from "react";
import { clips } from "@/config/wedding";

export function SectionMainInvitation() {
  const videoSrc = clips.three ? clips.three.src : "/3-vid.mp4";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const hasPlayedRef = useRef(false);
  const stoppedRef = useRef(false);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    let rafId: number;

    // High precision frame-by-frame check to freeze exactly 2.0s before completion (~6.93s)
    const checkStopPoint = () => {
      if (vid && !vid.paused && !stoppedRef.current) {
        const duration = vid.duration;
        const targetTime =
          duration && !isNaN(duration) && duration > 2.5
            ? duration - 2.0
            : 6.93;

        if (vid.currentTime >= targetTime) {
          stoppedRef.current = true;
          vid.pause();
          vid.currentTime = targetTime;
          setIsVideoEnded(true);
          return;
        }
      }

      if (!stoppedRef.current) {
        rafId = requestAnimationFrame(checkStopPoint);
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
              rafId = requestAnimationFrame(checkStopPoint);
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
      const targetTime =
        vid.duration && !isNaN(vid.duration) && vid.duration > 2.5
          ? vid.duration - 2.0
          : 6.93;
      vid.currentTime = targetTime;
    }
  };

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid || stoppedRef.current) return;

    if (vid.duration && !isNaN(vid.duration) && vid.duration > 2.5) {
      const stopThreshold = vid.duration - 2.0;
      if (vid.currentTime >= stopThreshold) {
        freezeAtEnd();
      }
    }
  };

  if (!videoSrc) return null;

  return (
    <section
      id="invitation"
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
