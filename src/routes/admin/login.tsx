import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { adminLogin, verifyAdmin } from "@/services/actions";
import { Shield, Lock, User, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect to /admin/dashboard
  useEffect(() => {
    const token = localStorage.getItem("bossman_admin_token");
    if (token) {
      verifyAdmin({ data: token })
        .then((res) => {
          if (res.authenticated) {
            navigate({ to: "/admin/dashboard" });
          } else {
            localStorage.removeItem("bossman_admin_token");
            setCheckingAuth(false);
          }
        })
        .catch(() => {
          setCheckingAuth(false);
        });
    } else {
      setCheckingAuth(false);
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password) {
      setErrorMessage("Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await adminLogin({
        data: {
          username: username.trim(),
          password,
        },
      });

      if (!res.success) {
        setErrorMessage(res.error || "Login failed. Check your credentials.");
      } else if (res.token) {
        localStorage.setItem("bossman_admin_token", res.token);
        localStorage.setItem("bossman_admin_username", res.username || username);
        navigate({ to: "/admin/dashboard" });
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMessage("Authentication error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen w-full bg-[#100602] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#ffd700] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full vintage-wood-sunburst flex flex-col items-center justify-center p-4">
      {/* Back to Invitation */}
      <a
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-xs uppercase tracking-widest text-[#e8c07d]/70 hover:text-[#ffd700] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Invitation</span>
      </a>

      {/* Login Box */}
      <div className="w-full max-w-md bg-gradient-to-b from-[#241208] to-[#120702] border-2 border-[#d4a33c]/60 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-[#3d200f] border-2 border-[#ffd700] text-[#ffd700] flex items-center justify-center mb-4 shadow-xl">
          <Shield className="w-8 h-8" />
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-wide uppercase mb-1">
          Host Portal
        </h1>
        <p className="font-body text-xs sm:text-sm text-[#e8c07d]/70 tracking-widest uppercase mb-8">
          The Bossman Laxman's Big 50 Bash
        </p>

        {errorMessage && (
          <div className="w-full mb-6 p-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          <div>
            <label className="block font-display text-xs uppercase tracking-widest text-[#e8c07d] font-semibold mb-2">
              Supabase Email or Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#e8c07d]/50">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter Supabase email or username"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#2e170a] border border-[#d4a33c]/40 text-white placeholder:text-[#e8c07d]/40 focus:outline-none focus:border-[#ffd700] transition-colors text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-display text-xs uppercase tracking-widest text-[#e8c07d] font-semibold mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#e8c07d]/50">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#2e170a] border border-[#d4a33c]/40 text-white placeholder:text-[#e8c07d]/40 focus:outline-none focus:border-[#ffd700] transition-colors text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3.5 rounded-full bg-gradient-to-r from-[#e5b550] via-[#c48d28] to-[#996515] text-[#1a0a00] font-display font-bold uppercase tracking-widest text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-[#fff3b0] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Dashboard</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
