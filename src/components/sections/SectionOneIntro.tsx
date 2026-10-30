import { useState, useRef, useEffect } from "react";
import { clips } from "@/config/wedding";
import { startBackgroundMusic } from "@/services/audioPlayer";

interface SectionOneIntroProps {
  onOpen?: () => void;
  onFinish?: () => void;
  isDismissed?: boolean;
}

export function SectionOneIntro({ onOpen, onFinish, isDismissed = false }: SectionOneIntroProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // When page loads or refreshes, force position to top and prepare video for iOS & Android
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });

    if (videoRef.current) {
      const vid = videoRef.current;
      vid.defaultMuted = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.setAttribute("playsinline", "true");
      vid.setAttribute("webkit-playsinline", "true");
      vid.setAttribute("x5-playsinline", "true");
    }

    return () => {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.removeAttribute("src");
          videoRef.current.load();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  if (!clips.one || isDismissed) return null;

  const handleOpenInvitation = () => {
    setHasStarted(true);
    onOpen?.();

    // 1. Play background music (works on iOS Safari & Android)
    startBackgroundMusic();

    // 2. Play Video 1 on user tap
    if (videoRef.current) {
      const vid = videoRef.current;
      vid.defaultMuted = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.setAttribute("playsinline", "true");
      vid.setAttribute("webkit-playsinline", "true");

      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Video 1 initial play prevented, retrying:", err);
          setTimeout(() => {
            vid.play().catch(() => {});
          }, 100);
        });
      }
    }
  };

  const handleVideoEnded = () => {
    if (isVideoFinished) return;
    setIsVideoFinished(true);
    if (videoRef.current) {
      videoRef.current.pause();
    }
    window.dispatchEvent(new Event("firstVideoFinished"));
    onFinish?.();
  };

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid || isVideoFinished) return;
    if (vid.duration && !isNaN(vid.duration) && vid.duration > 1) {
      if (vid.currentTime >= vid.duration - 0.1) {
        handleVideoEnded();
      }
    }
  };

  return (
    <section
      id="home"
      className={`relative w-full h-[100dvh] min-h-[100dvh] bg-[#120702] flex items-center justify-center select-none overflow-hidden transition-all duration-700 ${
        isVideoFinished ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Edge-to-edge mobile container: fills 100% of mobile screen without any letterbox gaps */}
      <div className="relative w-full h-full max-w-[480px] sm:max-w-[540px] flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          src={clips.one.src}
          preload="auto"
          muted
          playsInline
          webkit-playsinline="true"
          x5-playsinline="true"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          className="w-full h-full object-cover block"
        />

        <div
          className={`absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/75 pointer-events-none transition-opacity duration-1000 ${
            hasStarted ? "opacity-0" : "opacity-100"
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
