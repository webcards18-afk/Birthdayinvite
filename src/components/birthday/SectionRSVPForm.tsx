import { useState } from "react";
import { submitRSVP } from "@/services/actions";
import { CheckCircle2, XCircle, HeartHandshake, Loader2, Sparkles } from "lucide-react";

export function SectionRSVPForm() {
  const [guestName, setGuestName] = useState("");
  const [response, setResponse] = useState<"attending" | "declined">("attending");
  const [accompanyingGuests, setAccompanyingGuests] = useState<number>(0);
  const [contactInfo, setContactInfo] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    confirmed: boolean;
    name: string;
    response: "attending" | "declined";
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!guestName.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    setLoading(true);

    try {
      const result = await submitRSVP({
        data: {
          guestName: guestName.trim(),
          response,
          accompanyingGuests: response === "attending" ? accompanyingGuests : 0,
          contactInfo: contactInfo.trim() || undefined,
          message: message.trim() || undefined,
        },
      });

      if (!result.success) {
        setErrorMessage(result.error || "Failed to submit RSVP. Please try again.");
      } else {
        setSuccessInfo({
          confirmed: true,
          name: result.record.guestName,
          response: result.record.response,
          message: result.message,
        });
      }
    } catch (err: any) {
      console.error("RSVP error:", err);
      setErrorMessage("Network error occurred. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessInfo(null);
    setGuestName("");
    setContactInfo("");
    setMessage("");
    setAccompanyingGuests(0);
    setResponse("attending");
    setErrorMessage(null);
  };

  return (
    <section
      id="rsvp"
      className="relative w-full py-20 px-4 vintage-wood-sunburst flex flex-col items-center justify-center text-center overflow-hidden"
    >
      {/* Decorative Gold Stars */}
      <div className="absolute top-10 left-10 pointer-events-none opacity-40">
        <Sparkles className="w-8 h-8 text-[#ffd700] animate-pulse" />
      </div>
      <div className="absolute bottom-10 right-10 pointer-events-none opacity-40">
        <Sparkles className="w-8 h-8 text-[#ffd700] animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center">
        {/* Heading */}
        <span className="font-display text-sm uppercase tracking-[0.3em] text-[#e8c07d] font-semibold mb-2">
          Kindly Respond
        </span>
        <h2 className="font-display text-4xl sm:text-5xl font-serif text-white font-bold tracking-wide uppercase mb-3">
          Will You Join the Celebration?
        </h2>
        <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-[#ffd700] to-transparent mb-8" />

        {/* Success Confirmation Card */}
        {successInfo ? (
          <div className="w-full bg-gradient-to-b from-[#251307] to-[#120702] border-2 border-[#d4a33c] rounded-3xl p-8 sm:p-10 shadow-2xl animate-fade-in flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#3d200f] border-2 border-[#ffd700] text-[#ffd700] flex items-center justify-center mb-4 shadow-lg">
              {successInfo.response === "attending" ? (
                <CheckCircle2 className="w-8 h-8 text-[#10b981]" />
              ) : (
                <HeartHandshake className="w-8 h-8 text-[#ffd700]" />
              )}
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
              {successInfo.response === "attending" ? "You're on the Guest List!" : "Response Recorded"}
            </h3>

            <p className="font-body text-[#fce09b] text-base sm:text-lg mb-6 max-w-md leading-relaxed">
              {successInfo.message}
            </p>

            <button
              onClick={handleReset}
              className="text-xs uppercase tracking-widest text-[#e8c07d] underline hover:text-white transition-colors"
            >
              Submit another response or update
            </button>
          </div>
        ) : (
          /* RSVP Form */
          <form
            onSubmit={handleSubmit}
            className="w-full bg-gradient-to-b from-[#211108] to-[#100602] border-2 border-[#d4a33c]/60 rounded-3xl p-6 sm:p-10 shadow-2xl text-left"
          >
            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-sm flex items-center gap-2">
                <XCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Field 1: Guest Name (Required) */}
            <div className="mb-6">
              <label htmlFor="guestName" className="block font-display text-xs sm:text-sm uppercase tracking-widest text-[#e8c07d] font-semibold mb-2">
                Your Full Name <span className="text-red-400">*</span>
              </label>
              <input
                id="guestName"
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                className="w-full px-4 py-3.5 rounded-xl bg-[#2e170a] border border-[#d4a33c]/40 text-white placeholder:text-[#e8c07d]/40 focus:outline-none focus:border-[#ffd700] transition-colors"
              />
            </div>

            {/* Field 2: RSVP Response (Required) */}
            <div className="mb-6">
              <label className="block font-display text-xs sm:text-sm uppercase tracking-widest text-[#e8c07d] font-semibold mb-2">
                Will you attend? <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setResponse("attending")}
                  className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl border font-display text-sm uppercase tracking-wider transition-all duration-300 ${
                    response === "attending"
                      ? "bg-gradient-to-r from-[#e5b550] via-[#c48d28] to-[#996515] text-[#140600] font-bold border-[#fff3b0] shadow-lg scale-[1.02]"
                      : "bg-[#251208] text-[#e8c07d] border-[#d4a33c]/30 hover:border-[#d4a33c]/60"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accepts with pleasure</span>
                </button>

                <button
                  type="button"
                  onClick={() => setResponse("declined")}
                  className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl border font-display text-sm uppercase tracking-wider transition-all duration-300 ${
                    response === "declined"
                      ? "bg-gradient-to-r from-[#8b2525] to-[#591414] text-white font-bold border-red-400 shadow-lg scale-[1.02]"
                      : "bg-[#251208] text-[#e8c07d] border-[#d4a33c]/30 hover:border-[#d4a33c]/60"
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Declines with regret</span>
                </button>
              </div>
            </div>

            {/* Field 3: Number of Accompanying Guests (If Attending) */}
            {response === "attending" && (
              <div className="mb-6 animate-fade-in">
                <label htmlFor="accompanying" className="block font-display text-xs sm:text-sm uppercase tracking-widest text-[#e8c07d] font-semibold mb-2">
                  Number of Accompanying Guests (Excluding Yourself)
                </label>
                <div className="flex items-center gap-3">
                  <select
                    id="accompanying"
                    value={accompanyingGuests}
                    onChange={(e) => setAccompanyingGuests(Number(e.target.value))}
                    className="w-full px-4 py-3.5 rounded-xl bg-[#2e170a] border border-[#d4a33c]/40 text-white focus:outline-none focus:border-[#ffd700] transition-colors"
                  >
                    <option value={0}>0 (Attending alone)</option>
                    <option value={1}>+1 Guest</option>
                    <option value={2}>+2 Guests</option>
                    <option value={3}>+3 Guests</option>
                    <option value={4}>+4 Guests</option>
                    <option value={5}>+5 Guests</option>
                  </select>
                </div>
              </div>
            )}

            {/* Field 4: Contact Information (Optional) */}
            <div className="mb-6">
              <label htmlFor="contactInfo" className="block font-display text-xs sm:text-sm uppercase tracking-widest text-[#e8c07d] font-semibold mb-2">
                Phone Number or Email (Optional)
              </label>
              <input
                id="contactInfo"
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="e.g. +968 91234567 or your@email.com"
                className="w-full px-4 py-3.5 rounded-xl bg-[#2e170a] border border-[#d4a33c]/40 text-white placeholder:text-[#e8c07d]/40 focus:outline-none focus:border-[#ffd700] transition-colors"
              />
            </div>

            {/* Field 5: Message to the Host (Optional) */}
            <div className="mb-8">
              <label htmlFor="message" className="block font-display text-xs sm:text-sm uppercase tracking-widest text-[#e8c07d] font-semibold mb-2">
                Special Wishes / Message to Laxman (Optional)
              </label>
              <textarea
                id="message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your warm birthday wishes or special notes..."
                className="w-full px-4 py-3 rounded-xl bg-[#2e170a] border border-[#d4a33c]/40 text-white placeholder:text-[#e8c07d]/40 focus:outline-none focus:border-[#ffd700] transition-colors resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#e5b550] via-[#c48d28] to-[#996515] text-[#1a0a00] font-display font-bold uppercase tracking-widest text-base shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-[#fff3b0] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting RSVP...</span>
                </>
              ) : (
                <span>Confirm RSVP</span>
              )}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
