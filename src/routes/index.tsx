import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SectionOneIntro } from "@/components/sections/SectionOneIntro";
import { SectionAgePoster } from "@/components/birthday/SectionAgePoster";
import { SectionMainInvitation } from "@/components/birthday/SectionMainInvitation";
import { SectionCountdownTimer } from "@/components/birthday/SectionCountdownTimer";
import { SectionPartyDetails } from "@/components/birthday/SectionPartyDetails";
import { SectionVenueMap } from "@/components/birthday/SectionVenueMap";
import { SectionRSVPForm } from "@/components/birthday/SectionRSVPForm";
import { SectionContactButtons } from "@/components/birthday/SectionContactButtons";
import { birthdayData } from "@/config/wedding";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [hasOpenedIntro, setHasOpenedIntro] = useState(false);
  const [isIntroDismissed, setIsIntroDismissed] = useState(false);
  const [hasScratched, setHasScratched] = useState(false);

  // On page load or refresh, always reset scroll to the very top (0, 0)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  // Control body scrolling:
  // 1. Until "Tap to Open Invitation" is clicked: scroll is locked on Section 1
  // 2. Until scratch card is revealed: user cannot scroll down past Section 2
  useEffect(() => {
    if (!hasOpenedIntro) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else if (!hasScratched) {
      // While on Section 2 waiting for scratch, keep scroll contained
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      // Once scratched, completely unlock scrolling for the full celebration page
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [hasOpenedIntro, hasScratched]);

  // When Video 1 ends: transition smoothly to Section 2 and completely dismiss Video 1
  const handleVideoOneFinish = () => {
    setTimeout(() => {
      setIsIntroDismissed(true);
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, 600);
  };

  const handleCardScratched = () => {
    setHasScratched(true);
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  };

  return (
    <div className="relative w-full bg-[#120702] font-body text-[#f5ebd7] overflow-x-hidden selection:bg-[#d4a33c]/30 selection:text-white">
      <main className="w-full flex flex-col">
        {/* Intro Cinematic Video 1 with "Tap to Open Invitation" — disappears after playing */}
        {!isIntroDismissed && (
          <SectionOneIntro
            onOpen={() => setHasOpenedIntro(true)}
            onFinish={handleVideoOneFinish}
            isDismissed={isIntroDismissed}
          />
        )}

        {/* Section 1: Birthday Age Poster with Golden Scratch Card */}
        <SectionAgePoster onScratched={handleCardScratched} />

        {/* All subsequent sections are mounted and revealed ONLY once the card is scratched */}
        {hasScratched && (
          <div className="w-full flex flex-col animate-fade-in">
            {/* Section 2: Main Birthday Invitation (Video 3 — stops 2s before end) */}
            <SectionMainInvitation />

            {/* Section 2.5: Countdown Timer */}
            <SectionCountdownTimer />

            {/* Section 3: Party Details & Dress Code (Video 4) */}
            <SectionPartyDetails />

            {/* Section 4: Venue Map & Navigation Directions */}
            <SectionVenueMap />

            {/* Section 5: Guest RSVP Form */}
            <SectionRSVPForm />

            {/* Section 6: Contact Buttons (Call & WhatsApp) */}
            <SectionContactButtons />

            {/* Section 7: Footer */}
            <footer className="relative w-full py-12 px-4 bg-[#0a0401] border-t border-[#d4a33c]/20 flex flex-col items-center justify-center text-center">
              <p className="font-display text-lg sm:text-xl text-[#fce09b] font-medium tracking-wide mb-1">
                Honoring 50 Years of Excellence
              </p>
              <p className="font-body text-xs sm:text-sm text-[#e8c07d]/70 tracking-widest uppercase mb-6">
                {birthdayData.celebrantTitle}
              </p>

              <div className="w-16 h-[1px] bg-[#d4a33c]/30 mb-6" />

              {/* Creator credit */}
              <p className="text-xs text-[#e8c07d]/60 font-medium tracking-wider">
                Created by @prashantharts
              </p>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}
