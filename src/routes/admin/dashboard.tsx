import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { getAdminRSVPs, deleteAdminRSVP, verifyAdmin } from "@/services/actions";
import type { RSVPRecord, RSVPStats } from "@/services/db";
import {
  Users,
  UserCheck,
  UserX,
  Sparkles,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  LogOut,
  Loader2,
  RefreshCw,
  ExternalLink,
  Calendar,
  X,
} from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<string>("Host Admin");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [rsvps, setRsvps] = useState<RSVPRecord[]>([]);
  const [stats, setStats] = useState<RSVPStats>({
    total: 0,
    accepting: 0,
    declining: 0,
    totalConfirmedAttendees: 0,
  });

  // Table Controls State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "attending" | "declined">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [selectedRSVP, setSelectedRSVP] = useState<RSVPRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Authentication check & initial load
  useEffect(() => {
    const savedToken = localStorage.getItem("bossman_admin_token");
    const savedUser = localStorage.getItem("bossman_admin_username");

    if (!savedToken) {
      navigate({ to: "/admin/login" });
      return;
    }

    setToken(savedToken);
    if (savedUser) setAdminUser(savedUser);

    loadData(savedToken);
  }, [navigate]);

  const loadData = async (activeToken: string) => {
    setRefreshing(true);
    try {
      const auth = await verifyAdmin({ data: activeToken });
      if (!auth.authenticated) {
        localStorage.removeItem("bossman_admin_token");
        navigate({ to: "/admin/login" });
        return;
      }

      const res = await getAdminRSVPs({ data: activeToken });
      if (res.success) {
        setRsvps(res.rsvps || []);
        setStats(res.stats || { total: 0, accepting: 0, declining: 0, totalConfirmedAttendees: 0 });
      } else {
        localStorage.removeItem("bossman_admin_token");
        navigate({ to: "/admin/login" });
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("bossman_admin_token");
    localStorage.removeItem("bossman_admin_username");
    navigate({ to: "/admin/login" });
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this RSVP response?");
    if (!confirmDelete) return;

    setDeletingId(id);
    try {
      const res = await deleteAdminRSVP({ data: { token, id } });
      if (res.success) {
        await loadData(token);
        if (selectedRSVP?.id === id) {
          setSelectedRSVP(null);
        }
      } else {
        alert("Could not delete RSVP. Please try again.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting record.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filter & Search Logic
  const filteredRSVPs = useMemo(() => {
    return rsvps
      .filter((item) => {
        const matchesSearch = item.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.contactInfo && item.contactInfo.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.message && item.message.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus =
          statusFilter === "all" ? true : item.response === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
      });
  }, [rsvps, searchQuery, statusFilter, sortOrder]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredRSVPs.length / itemsPerPage));
  const paginatedRSVPs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRSVPs.slice(start, start + itemsPerPage);
  }, [filteredRSVPs, currentPage]);

  // CSV Export
  const handleExportCSV = () => {
    if (rsvps.length === 0) {
      alert("No RSVP data to export.");
      return;
    }

    const headers = [
      "Guest Name",
      "Response",
      "Accompanying Guests",
      "Total In Party",
      "Contact Info",
      "Message",
      "Submitted Date",
    ];

    const rows = rsvps.map((r) => [
      `"${r.guestName.replace(/"/g, '""')}"`,
      r.response === "attending" ? "Accepted with pleasure" : "Declined with regret",
      r.accompanyingGuests || 0,
      r.response === "attending" ? 1 + (r.accompanyingGuests || 0) : 0,
      `"${(r.contactInfo || "").replace(/"/g, '""')}"`,
      `"${(r.message || "").replace(/"/g, '""')}"`,
      `"${new Date(r.createdAt).toLocaleString()}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bossman-laxman-50-rsvps-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#100602] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#ffd700] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#120702] text-[#f5ebd7] font-body selection:bg-[#d4a33c]/30 selection:text-white pb-20">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <header className="w-full bg-[#1c0d05] border-b border-[#d4a33c]/30 py-4 px-4 sm:px-8 flex items-center justify-between shadow-xl sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#3d200f] border border-[#d4a33c] text-[#ffd700] flex items-center justify-center font-bold font-display">
            50
          </div>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold text-white tracking-wide">
              The Bossman Laxman's Big 50 Bash
            </h1>
            <p className="text-xs text-[#e8c07d]/70 uppercase tracking-widest">
              RSVP Management Portal • {adminUser}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#e8c07d]/70 hover:text-white transition-colors px-3 py-2 rounded-lg bg-[#2a1408] border border-[#d4a33c]/30"
          >
            <span>View Invitation</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => token && loadData(token)}
            disabled={refreshing}
            className="p-2 rounded-lg bg-[#2a1408] border border-[#d4a33c]/30 text-[#e8c07d] hover:text-[#ffd700] transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60 transition-colors text-xs uppercase tracking-wider font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        {/* ── Summary Stats Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Total Responses */}
          <div className="bg-gradient-to-br from-[#241208] to-[#140602] border-2 border-[#d4a33c]/40 rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <p className="font-display text-xs uppercase tracking-widest text-[#e8c07d] font-semibold mb-1">
                Total Responses
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
                {stats.total}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#3d200f] border border-[#d4a33c]/60 text-[#ffd700] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Accepting */}
          <div className="bg-gradient-to-br from-[#122416] to-[#051408] border-2 border-[#10b981]/40 rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <p className="font-display text-xs uppercase tracking-widest text-[#a7f3d0] font-semibold mb-1">
                Accepted with Pleasure
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#10b981]">
                {stats.accepting}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#0e3a1f] border border-[#10b981]/60 text-[#10b981] flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>

          {/* Declining */}
          <div className="bg-gradient-to-br from-[#2b1010] to-[#150505] border-2 border-[#ef4444]/40 rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <p className="font-display text-xs uppercase tracking-widest text-[#fca5a5] font-semibold mb-1">
                Declined with Regret
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#ef4444]">
                {stats.declining}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#451010] border border-[#ef4444]/60 text-[#ef4444] flex items-center justify-center">
              <UserX className="w-6 h-6" />
            </div>
          </div>

          {/* Total Confirmed Attendees */}
          <div className="bg-gradient-to-br from-[#2b1b08] to-[#170a01] border-2 border-[#ffd700]/60 rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div>
              <p className="font-display text-xs uppercase tracking-widest text-[#ffd700] font-semibold mb-1">
                Confirmed Attendees
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold gold-gradient-text">
                {stats.totalConfirmedAttendees}
              </h2>
              <span className="text-[10px] text-[#e8c07d]/60">Includes guests & companions</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#4a2608] border border-[#ffd700] text-[#ffd700] flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* ── Filter, Search & Export Bar ─────────────────────────────────── */}
        <div className="bg-gradient-to-b from-[#1f0f06] to-[#140602] border border-[#d4a33c]/40 rounded-2xl p-4 sm:p-6 mb-6 shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#e8c07d]/50">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by guest name, phone, message..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#2e170a] border border-[#d4a33c]/30 text-white placeholder:text-[#e8c07d]/40 focus:outline-none focus:border-[#ffd700] text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-[#2e170a] border border-[#d4a33c]/30 rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-[#e8c07d]" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs uppercase tracking-wider text-white focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#241208]">All Responses ({rsvps.length})</option>
                <option value="attending" className="bg-[#241208]">Accepted ({stats.accepting})</option>
                <option value="declined" className="bg-[#241208]">Declined ({stats.declining})</option>
              </select>
            </div>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-[#2e170a] border border-[#d4a33c]/30 rounded-xl px-3 py-2 text-xs uppercase tracking-wider text-white focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-[#241208]">Newest First</option>
              <option value="oldest" className="bg-[#241208]">Oldest First</option>
            </select>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#e5b550] via-[#c48d28] to-[#996515] text-[#1a0a00] font-display font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* ── RSVP Responses Table ────────────────────────────────────────── */}
        <div className="bg-[#190b04] border border-[#d4a33c]/40 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#291307] border-b border-[#d4a33c]/30 text-xs font-display uppercase tracking-widest text-[#ffd700]">
                <tr>
                  <th className="py-4 px-4 sm:px-6">Guest Name</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Guests</th>
                  <th className="py-4 px-4">Contact</th>
                  <th className="py-4 px-4">Message</th>
                  <th className="py-4 px-4">Date / Time</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d4a33c]/15">
                {paginatedRSVPs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#e8c07d]/60 font-body">
                      No RSVP responses found.
                    </td>
                  </tr>
                ) : (
                  paginatedRSVPs.map((rsvp) => (
                    <tr
                      key={rsvp.id}
                      className="hover:bg-[#261206]/80 transition-colors group"
                    >
                      {/* Name */}
                      <td className="py-4 px-4 sm:px-6 font-display font-bold text-white text-base">
                        {rsvp.guestName}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        {rsvp.response === "attending" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                            <UserCheck className="w-3 h-3" />
                            <span>Accepted</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/40">
                            <UserX className="w-3 h-3" />
                            <span>Declined</span>
                          </span>
                        )}
                      </td>

                      {/* Accompanying Count */}
                      <td className="py-4 px-4 font-body text-white">
                        {rsvp.response === "attending" ? (
                          rsvp.accompanyingGuests > 0 ? (
                            <span className="font-semibold text-[#ffd700]">
                              1 + {rsvp.accompanyingGuests}
                            </span>
                          ) : (
                            <span className="text-[#e8c07d]/70">1 (Just guest)</span>
                          )
                        ) : (
                          <span className="text-[#e8c07d]/30">—</span>
                        )}
                      </td>

                      {/* Contact Info */}
                      <td className="py-4 px-4 text-xs font-mono text-[#e8c07d]/90">
                        {rsvp.contactInfo || <span className="text-[#e8c07d]/30">—</span>}
                      </td>

                      {/* Message Snippet */}
                      <td className="py-4 px-4 text-xs text-[#fce09b]/90 max-w-xs truncate">
                        {rsvp.message || <span className="text-[#e8c07d]/30">—</span>}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-xs text-[#e8c07d]/60 whitespace-nowrap">
                        {new Date(rsvp.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedRSVP(rsvp)}
                            className="p-1.5 rounded-lg bg-[#33180a] hover:bg-[#4d2510] text-[#ffd700] transition-colors"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rsvp.id)}
                            disabled={deletingId === rsvp.id}
                            className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 transition-colors"
                            title="Delete RSVP"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination Footer ─────────────────────────────────────────── */}
          <div className="bg-[#241106] border-t border-[#d4a33c]/20 py-3.5 px-4 sm:px-6 flex items-center justify-between text-xs text-[#e8c07d]/70">
            <span>
              Showing {filteredRSVPs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredRSVPs.length)} of {filteredRSVPs.length} responses
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-[#33180a] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#4d2510] transition-colors"
              >
                Previous
              </button>
              <span className="px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-[#33180a] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#4d2510] transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── View Details Modal ────────────────────────────────────────────── */}
      {selectedRSVP && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-gradient-to-b from-[#241208] to-[#120702] border-2 border-[#d4a33c] rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-fade-in text-left">
            <button
              onClick={() => setSelectedRSVP(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-[#3d200f] text-[#ffd700] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#3d200f] border border-[#d4a33c] text-[#ffd700] flex items-center justify-center font-bold">
                {selectedRSVP.guestName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold text-white">
                  {selectedRSVP.guestName}
                </h3>
                <span className="text-xs text-[#e8c07d]/60">
                  Submitted {new Date(selectedRSVP.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-4 my-6">
              <div className="p-3.5 rounded-xl bg-[#2e170a] border border-[#d4a33c]/20">
                <span className="block text-[11px] uppercase tracking-wider text-[#e8c07d] mb-1">
                  Response Status
                </span>
                <p className="text-base font-semibold text-white">
                  {selectedRSVP.response === "attending"
                    ? "🎉 Attending (Accepted with pleasure)"
                    : "💔 Declined with regret"}
                </p>
              </div>

              {selectedRSVP.response === "attending" && (
                <div className="p-3.5 rounded-xl bg-[#2e170a] border border-[#d4a33c]/20">
                  <span className="block text-[11px] uppercase tracking-wider text-[#e8c07d] mb-1">
                    Party Size
                  </span>
                  <p className="text-base font-semibold text-[#ffd700]">
                    Total {1 + (selectedRSVP.accompanyingGuests || 0)} Guests ({selectedRSVP.guestName} + {selectedRSVP.accompanyingGuests || 0} companions)
                  </p>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-[#2e170a] border border-[#d4a33c]/20">
                <span className="block text-[11px] uppercase tracking-wider text-[#e8c07d] mb-1">
                  Contact Information
                </span>
                <p className="text-sm font-mono text-white">
                  {selectedRSVP.contactInfo || "None provided"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#2e170a] border border-[#d4a33c]/20">
                <span className="block text-[11px] uppercase tracking-wider text-[#e8c07d] mb-1">
                  Message / Wishes to Host
                </span>
                <p className="text-sm text-[#fce09b] italic leading-relaxed">
                  "{selectedRSVP.message || "No message provided."}"
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#d4a33c]/20">
              <button
                onClick={() => setSelectedRSVP(null)}
                className="px-5 py-2.5 rounded-xl bg-[#3d200f] text-[#ffd700] hover:text-white font-display text-xs uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
