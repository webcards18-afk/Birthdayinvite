import { useCountdown } from "@/hooks/useCountdown";
import { birthdayData } from "@/config/wedding";

export function SectionCountdownTimer() {
  const { days, hours, minutes, seconds, isPast } = useCountdown(birthdayData.isoDate);

  return (
    <section
      id="countdown"
      className="relative w-full py-16 px-4 overflow-hidden select-none"
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, rgba(160,82,38,0.35) 0%, rgba(18,7,2,0.98) 75%), #120702",
      }}
    >
      {/* Decorative gold line top */}
      <div className="mx-auto mb-8 h-[1px] w-24 bg-gradient-to-r from-transparent via-[#d4a33c] to-transparent" />

      {/* Heading */}
      <h2 className="text-center font-display text-2xl sm:text-3xl font-bold text-[#fce09b] tracking-wide uppercase mb-2">
        Countdown to the Bash
      </h2>
      <p className="text-center font-body text-xs sm:text-sm text-[#e8c07d]/70 tracking-widest uppercase mb-10">
        {birthdayData.displayDate} &bull; {birthdayData.time}
      </p>

      {isPast ? (
        <div className="text-center">
          <p className="font-display text-3xl sm:text-4xl font-bold text-[#ffd700] tracking-wide uppercase animate-soft-pulse">
            🎉 The Party Has Begun! 🎉
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-3 sm:gap-5 max-w-lg mx-auto">
          <CountdownBlock value={days} label="Days" />
          <Colon />
          <CountdownBlock value={hours} label="Hours" />
          <Colon />
          <CountdownBlock value={minutes} label="Minutes" />
          <Colon />
          <CountdownBlock value={seconds} label="Seconds" />
        </div>
      )}

      {/* Decorative gold line bottom */}
      <div className="mx-auto mt-10 h-[1px] w-24 bg-gradient-to-r from-transparent via-[#d4a33c] to-transparent" />
    </section>
  );
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[60px] sm:min-w-[72px]">
      <div
        className="w-full rounded-xl py-3 sm:py-4 flex items-center justify-center"
        style={{
          background:
            "linear-gradient(145deg, #fce09b 0%, #d4a33c 35%, #fef3c7 55%, #a87922 100%)",
          boxShadow:
            "0 8px 24px rgba(0,0,0,0.5), 0 0 20px rgba(212,163,60,0.25), inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.3)",
        }}
      >
        <span className="font-display text-3xl sm:text-4xl font-bold text-[#1a0a00] tabular-nums leading-none">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-2 font-body text-[10px] sm:text-xs uppercase tracking-widest text-[#e8c07d]/80 font-medium">
        {label}
      </span>
    </div>
  );
}

function Colon() {
  return (
    <span className="font-display text-2xl sm:text-3xl font-bold text-[#ffd700] self-start mt-3 sm:mt-4 animate-soft-pulse">
      :
    </span>
  );
}
