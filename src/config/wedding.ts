import poster1 from "@/assets/poster-1.jpg.asset.json";
import poster3 from "@/assets/poster-3.jpg.asset.json";
import poster4 from "@/assets/poster-4.jpg.asset.json";
import poster5 from "@/assets/poster-5.jpg.asset.json";
import poster6 from "@/assets/poster-6.jpg.asset.json";

/** ── EDIT EVERYTHING ABOUT THE BIRTHDAY & INVITATION HERE ─────────────────────────── */

export const birthdayData = {
  // Birthday Person Details
  name: "Laxman",
  celebrantTitle: "The Bossman Laxman's Big 50 Bash",
  age: 50,
  ageHeading: "Aged to Perfection",
  tagline: "Something Legendary Is Brewing",

  // Main Invitation
  invitationHeading: "You're Invited",
  invitationSubheading: "To The Bossman Laxman's",
  invitationHighlight: "Big 50 Bash",

  // Party Details
  event: "Big 50 Birthday Bash",
  heading: "Let the Birthday Celebration Begin",
  subheading: "Let the Madness Begin",
  date: "Friday, 20 November 2026",
  displayDate: "FRIDAY, 20TH NOVEMBER",
  isoDate: "2026-11-20T19:30:00",
  time: "7:30 PM onwards",
  timeLabel: "Party O'Clock!",

  // Venue & Location
  venue: "Sindbad Ballroom, Crowne Plaza Qurum",
  venueLabel: "The Hotspot!",
  venueName: "Sindbad Ballroom",
  hotelName: "Crowne Plaza Qurum",
  location: "Crowne Plaza Qurum, Muscat, Oman",
  mapUrl: "https://maps.app.goo.gl/gvFWQ2ZqpVk4jusr9?g_st=iw",
  directionsUrl: "https://maps.app.goo.gl/gvFWQ2ZqpVk4jusr9?g_st=iw",
  // Standard embeddable map location for Crowne Plaza Muscat / Qurum
  mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3656.7801828789313!2d58.49007327606774!3d23.612239478763527!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e91f090b3967819%3A0xc47b4d1c5d9e5b9f!2sCrowne%20Plaza%20Muscat%2C%20an%20IHG%20Hotel!5e0!3m2!1sen!2som!4v1714500000000!5m2!1sen!2som",

  // Dress Code
  dressCodeLabel: "Bring Your Bling!",
  dressCode: "Black / Gold / Champagne",
  dressCodeMessage: "Let's party like never before in style!",

  // Contact Details
  contactPhone: "+968 96238033",
  contactPhoneFormatted: "+968 9623 8033",
  whatsappNumber: "96896238033",

  // Music
  musicUrl: "/music.mpeg",
};

/** Backward compatibility alias */
export const weddingDate = birthdayData.isoDate;
export const weddingData = {
  groom: "Laxman",
  bride: "Celebration",
  groomParents: "",
  brideParents: "",
  weddingDate: birthdayData.isoDate,
  displayDate: birthdayData.displayDate,
  venue: birthdayData.venue,
  location: birthdayData.location,
  mapUrl: birthdayData.mapUrl,
  musicUrl: birthdayData.musicUrl,
  events: [
    {
      id: "bash",
      title: birthdayData.event,
      date: birthdayData.date,
      time: birthdayData.time,
      note: birthdayData.dressCodeMessage,
      tone: "gold" as const,
    },
  ],
};

export type Clip = { src: string; poster: string } | null;

export const clips: Record<"one" | "two" | "three" | "four" | "five" | "six", Clip> = {
  one: { src: "/1-vid.mp4", poster: "" },
  two: { src: "/2-vid.mp4", poster: "" },
  three: { src: "/3-vid.mp4", poster: "" },
  four: { src: "/4-vid.mp4", poster: "" },
  five: { src: "/5-vid.mp4", poster: "" },
  six: { src: "/6-vid.mp4", poster: "" },
};

export const navSections = [
  { id: "poster", label: "Celebration" },
  { id: "invitation", label: "Invitation" },
  { id: "details", label: "Party Details" },
  { id: "venue", label: "Venue & Map" },
  { id: "rsvp", label: "RSVP" },
  { id: "contact", label: "Contact" },
];
