import { clips } from "@/config/wedding";

export function SectionSixHaldi() {
  const videoSrc = clips.four?.src;
  const posterSrc = clips.four?.poster;

  if (!videoSrc) return null;

  return (
    <section className="relative w-full bg-ivory overflow-hidden flex items-center justify-center">
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
