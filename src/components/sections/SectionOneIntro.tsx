import { useState, useRef, useEffect } from "react";
import { clips } from "@/config/wedding";

let globalAudio: HTMLAudioElement | null = null;

interface SectionOneIntroProps {
  onOpen?: () => void;
  onFinish?: () => void;
}

export function SectionOneIntro({ onOpen, onFinish }: SectionOneIntroProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // When page loads or refreshes, force position to top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  if (!clips.one) return null;

  const handleOpenInvitation = () => {
    setHasStarted(true);
    onOpen?.();

    if (typeof window !== "undefined") {
      if (!globalAudio) {
        globalAudio = new Audio("/music.mpeg");
        globalAudio.loop = true;
      }
      globalAudio.play().catch((err) => {
        console.warn("Primary audio (/music.mpeg) play failed, trying fallback:", err);
        const fallbackAudio = new Audio("/music.mp3");
        fallbackAudio.loop = true;
        fallbackAudio.play().then(() => {
          globalAudio = fallbackAudio;
        }).catch((e) => console.error("Fallback audio play failed:", e));
      });
    }

    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch((err) => {
        console.error("Video play failed:", err);
      });
    }
  };

  const handleVideoEnded = () => {
    setIsVideoFinished(true);
    window.dispatchEvent(new Event("firstVideoFinished"));
    onFinish?.();
  };

  return (
    <section
      id="home"
      className="relative w-full h-[100dvh] min-h-[100dvh] bg-[#120702] flex items-center justify-center select-none overflow-hidden"
    >
      {/* Edge-to-edge mobile container: fills 100% of mobile screen without any letterbox gaps */}
      <div className="relative w-full h-full max-w-[480px] sm:max-w-[540px] flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          src={`${clips.one.src}#t=0.001`}
          preload="auto"
          muted
          playsInline
          onEnded={handleVideoEnded}
          className={`w-full h-full object-cover block transition-all duration-1000 ${
            isVideoFinished ? "filter blur-md scale-105 opacity-60" : "filter-none scale-100 opacity-100"
          }`}
        />

        <div
          className={`absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/75 pointer-events-none transition-opacity duration-1000 ${
            hasStarted && !isVideoFinished ? "opacity-0" : "opacity-100"
          }`}
        />

        {/* Tap to Open Invitation Button */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-end pb-20 sm:pb-24 px-6 z-20 transition-all duration-1000 ${
            hasStarted ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100 pointer-events-auto"
          }`}
        >
          <button
            onClick={handleOpenInvitation}
            className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-[#e5b550] via-[#c48d28] to-[#996515] text-[#140600] border-2 border-[#fff3b0] shadow-[0_10px_35px_rgba(0,0,0,0.85)] font-display font-bold uppercase tracking-widest text-base sm:text-lg hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          >
            Tap to Open Invitation
          </button>
        </div>
      </div>
    </section>
  );
}
