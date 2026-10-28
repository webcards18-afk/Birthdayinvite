import { clips } from "@/config/wedding";

export function SectionFiveEvents() {
  const videoSrc = clips.three?.src;
  const posterSrc = clips.three?.poster;

  if (!videoSrc) return null;

  return (
    <section id="events" className="relative w-full bg-ivory overflow-hidden flex items-center justify-center">
      <video
        src={videoSrc}
        poster={posterSrc}
        autoPlay
        loop
        muted
        playsInline
        className="w-full max-h-[100dvh] object-contain block mx-auto"
      />
    </section>
  );
}
