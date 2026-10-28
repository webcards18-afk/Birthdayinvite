import { birthdayData } from "@/config/wedding";
import { Phone, MessageCircle } from "lucide-react";

export function SectionContactButtons() {
  return (
    <section
      id="contact"
      className="relative w-full py-16 px-4 bg-[#180d06] flex flex-col items-center justify-center text-center overflow-hidden border-t border-[#d4a33c]/30"
    >
      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center">
        <span className="font-display text-sm uppercase tracking-[0.3em] text-[#e8c07d] font-semibold mb-2">
          Questions or Assistance?
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-serif text-white font-bold tracking-wide uppercase mb-3">
          Get in Touch
        </h2>
        <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-[#ffd700] to-transparent mb-4" />

        <p className="font-body text-sm sm:text-base text-[#e8c07d]/80 mb-2">
          Have any questions about the party or venue? Contact the host team:
        </p>
        <p className="font-display text-2xl font-bold gold-gradient-text tracking-widest mb-8">
          {birthdayData.contactPhoneFormatted}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 w-full">
          {/* Call Button */}
          <a
            href={`tel:${birthdayData.contactPhone}`}
            className="flex-1 min-w-[200px] max-w-xs flex items-center justify-center gap-3 px-6 py-4 rounded-full bg-gradient-to-r from-[#e5b550] via-[#c48d28] to-[#996515] text-[#1a0a00] font-display font-bold uppercase tracking-wider text-sm shadow-xl hover:scale-105 transition-all duration-300 border border-[#fff3b0]"
          >
            <Phone className="w-5 h-5 fill-current" />
            <span>Call Us</span>
          </a>

          {/* WhatsApp Button */}
          <a
            href={`https://wa.me/${birthdayData.whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[200px] max-w-xs flex items-center justify-center gap-3 px-6 py-4 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-display font-bold uppercase tracking-wider text-sm shadow-xl hover:scale-105 transition-all duration-300"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>Contact on WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  );
}
