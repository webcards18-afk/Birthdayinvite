import { useEffect, useRef } from "react";
import { birthdayData } from "@/config/wedding";
import { MapPin, Navigation, ExternalLink } from "lucide-react";

export function SectionVenueMap() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Configure continuous background video for iOS Safari
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.defaultMuted = true;
    vid.muted = true;
    vid.playsInline = true;
    vid.setAttribute("playsinline", "true");
    vid.setAttribute("webkit-playsinline", "true");
    vid.setAttribute("x5-playsinline", "true");

    const tryPlay = () => {
      vid.play().catch(() => {});
    };
    tryPlay();

    const onInteraction = () => {
      if (vid && vid.paused) {
        vid.play().catch(() => {});
      }
    };
    window.addEventListener("touchstart", onInteraction, { once: true, passive: true });
    window.addEventListener("scroll", onInteraction, { once: true, passive: true });

    return () => {
      window.removeEventListener("touchstart", onInteraction);
      window.removeEventListener("scroll", onInteraction);
    };
  }, []);

  return (
    <section
      id="venue"
      className="relative w-full py-20 px-4 bg-[#140a04] flex flex-col items-center justify-center text-center overflow-hidden"
    >
      {/* Background Continuous Video (5-vid.mp4) */}
      <video
        ref={videoRef}
        src="/5-vid.mp4"
        autoPlay
        loop
        muted
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Dark Luxury Overlay for high readability */}
      <div className="absolute inset-0 bg-[#0d0502]/85 backdrop-blur-[2px] pointer-events-none" />

      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#d4a33c]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
        {/* Header */}
        <span className="font-display text-sm uppercase tracking-[0.3em] text-[#e8c07d] font-semibold mb-2">
          Location & Directions
        </span>
        <h2 className="font-display text-4xl sm:text-5xl font-serif text-white font-bold tracking-wide uppercase mb-3">
          The Venue
        </h2>
        <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-[#ffd700] to-transparent mb-8" />

        {/* Venue Information Card */}
        <div className="w-full max-w-2xl bg-gradient-to-b from-[#211108]/90 to-[#120702]/95 backdrop-blur-md border-2 border-[#d4a33c]/60 rounded-3xl p-6 sm:p-10 shadow-2xl mb-8 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-[#3d200f] border border-[#d4a33c] text-[#ffd700] flex items-center justify-center mb-4 shadow-lg">
            <MapPin className="w-7 h-7 animate-bounce" />
          </div>

          <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#ffd700] mb-2 tracking-wide">
            {birthdayData.venueName}
          </h3>
          <p className="font-display text-lg sm:text-xl text-white font-medium mb-1">
            {birthdayData.hotelName}
          </p>
          <p className="font-body text-sm text-[#e8c07d]/80 mb-6 max-w-md">
            {birthdayData.location}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 w-full">
            <a
              href={birthdayData.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#e5b550] via-[#c48d28] to-[#996515] text-[#1a0a00] font-display font-bold uppercase tracking-wider text-sm shadow-xl hover:scale-105 transition-all duration-300 border border-[#fff3b0]"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Venue on Map</span>
            </a>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                "Crowne Plaza Muscat, Qurum, Oman"
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#1e1008] hover:bg-[#2e180c] text-[#ffd700] border border-[#d4a33c] font-display font-semibold uppercase tracking-wider text-sm shadow-xl hover:scale-105 transition-all duration-300"
            >
              <Navigation className="w-4 h-4" />
              <span>Get Directions</span>
            </a>
          </div>
        </div>

        {/* Embedded Interactive Google Map */}
        <div className="w-full max-w-3xl h-80 sm:h-96 rounded-2xl overflow-hidden border-2 border-[#d4a33c]/40 shadow-2xl relative">
          <iframe
            title="Sindbad Ballroom, Crowne Plaza Qurum Location Map"
            src={birthdayData.mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full grayscale-[25%] contrast-[105%]"
          />
        </div>
      </div>
    </section>
  );
}
