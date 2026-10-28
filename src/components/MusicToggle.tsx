import { useState, useRef, useEffect } from "react";
import { weddingData } from "@/config/wedding";

export function MusicToggle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Attempt to play if auto-play is allowed (usually blocked by browser until interaction)
    const playAudio = async () => {
      try {
        if (audioRef.current && isPlaying) {
          await audioRef.current.play();
        } else if (audioRef.current) {
          audioRef.current.pause();
        }
      } catch (err) {
        console.log("Audio autoplay prevented", err);
        setIsPlaying(false);
      }
    };
    
    playAudio();
  }, [isPlaying]);

  if (!weddingData.musicUrl) return null;

  return (
    <>
      <audio
        ref={audioRef}
        loop
        preload="auto"
      >
        <source src="/music.mpeg" type="audio/mpeg" />
        <source src="/music.mp3" type="audio/mp3" />
      </audio>
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="fixed top-6 left-6 z-50 p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-white flex items-center gap-2 group transition-all"
        aria-label="Toggle Music"
      >
        <span className="text-sm font-medium tracking-widest uppercase hidden md:block opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0">
          Music
        </span>
        <div className="relative w-5 h-5 flex items-center justify-center">
          {isPlaying ? (
            <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 opacity-60" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6zM4.27 3L3 4.27l9 9v.28c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4v-1.73l4.73 4.73L21 19.73 4.27 3z" />
            </svg>
          )}
        </div>
      </button>
    </>
  );
}
