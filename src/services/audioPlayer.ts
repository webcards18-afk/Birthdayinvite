/**
 * Bulletproof Audio Player for iOS Safari, Android & Desktop browsers.
 *
 * Handles:
 * 1. Synchronous user gesture audio unlocking
 * 2. iOS CoreAudio / Web Audio API hardware unlock (overcomes iPhone silent switch)
 * 3. Standard MP3 audio format with audio/mpeg
 * 4. Document-level touch/click retry listeners if background audio was delayed
 */

let globalAudio: HTMLAudioElement | null = null;
let audioContext: AudioContext | null = null;
let isAudioActive = false;

function unlockWebAudioHardware() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (AudioContextClass) {
      if (!audioContext) {
        audioContext = new AudioContextClass();
      }
      if (audioContext.state === "suspended") {
        audioContext.resume().catch(() => {});
      }
      // Play a 1-sample silent buffer to activate iOS audio hardware
      const buffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
    }
  } catch (err) {
    console.warn("Web Audio unlock warning:", err);
  }
}

export function startBackgroundMusic() {
  isAudioActive = true;
  unlockWebAudioHardware();

  if (typeof window === "undefined") return;

  if (!globalAudio) {
    globalAudio = new Audio();
    globalAudio.loop = true;
    globalAudio.preload = "auto";
    globalAudio.setAttribute("playsinline", "true");
    globalAudio.setAttribute("webkit-playsinline", "true");
    // Standard MP3 format for 100% Safari iOS compatibility
    globalAudio.src = "/music.mp3";
  }

  const playPromise = globalAudio.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn("Initial audio play prevented by Safari, waiting for user touch:", err);
    });
  }

  // Register touch/click listeners to resume immediately on next user tap if needed
  const resumeOnInteraction = () => {
    if (isAudioActive && globalAudio && globalAudio.paused) {
      unlockWebAudioHardware();
      globalAudio.play().catch(() => {});
    }
  };

  window.addEventListener("touchstart", resumeOnInteraction, { passive: true });
  window.addEventListener("touchend", resumeOnInteraction, { passive: true });
  window.addEventListener("click", resumeOnInteraction, { passive: true });
}

export function stopBackgroundMusic() {
  isAudioActive = false;
  if (globalAudio) {
    globalAudio.pause();
  }
}
