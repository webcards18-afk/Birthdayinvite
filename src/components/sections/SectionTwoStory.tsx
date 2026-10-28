import { useEffect, useRef } from "react";
import { clips } from "@/config/wedding";

export function SectionTwoStory() {
  const videoSrc = clips.two ? clips.two.src : clips.one?.src;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      },
      { threshold: 0.2 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!videoSrc) return null;

  return (
    <section id="story" className="relative w-full bg-ivory overflow-hidden flex items-center justify-center">
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        className="w-full max-h-[100dvh] object-contain block mx-auto"
      />
    </section>
  );
}
