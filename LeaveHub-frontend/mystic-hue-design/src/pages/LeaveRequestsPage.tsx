import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import LeaveTable, { LeaveRequest } from "@/components/LeaveTable";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

const LeaveRequestsPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [form, setForm] = useState({ type: "Annual", from: "", to: "", reason: "" });
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const data = await api.getMyLeaves();
      setRequests(
        data.map((r) => ({
          id: r.id,
          employee: r.employee?.fullName?.trim() || user?.fullName?.trim() || "Unknown",
          type: r.leaveType,
          from: r.startDate.slice(0, 10),
          to: r.endDate.slice(0, 10),
          days:
            Math.ceil(
              (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24)
            ) + 1,
          status: r.status,
          reason: r.reason,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchRequests();
  }, [user]);

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const handleSubmit = async () => {
    if (!form.from || !form.to || !form.reason.trim()) return;
    await api.createLeave({
      leaveType: form.type,
      reason: form.reason,
      startDate: form.from,
      endDate: form.to,
    });
    setForm({ type: "Annual", from: "", to: "", reason: "" });
    setShowForm(false);
    setLoading(true);
    fetchRequests();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-semibold tracking-tight">
            My Leave Requests
          </motion.h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">leave.requests // {requests.length} total</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold glow-primary hover:scale-[0.98] transition-transform">
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="surface-glass rounded-lg p-5 space-y-4">
          <span className="label-text">Submit Leave Request</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-3 py-2 bg-secondary rounded-md text-sm border border-border focus:border-primary focus:outline-none">
              <option>Annual</option>
              <option>Sick</option>
              <option>Personal</option>
              <option>Maternity</option>
              <option>Paternity</option>
            </select>
            <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason" className="px-3 py-2 bg-secondary rounded-md text-sm border border-border focus:border-primary focus:outline-none" />
            <input type="date" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} className="px-3 py-2 bg-secondary rounded-md text-sm border border-border focus:border-primary focus:outline-none" />
            <input type="date" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} className="px-3 py-2 bg-secondary rounded-md text-sm border border-border focus:border-primary focus:outline-none" />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={handleSubmit} className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold">Submit</button>
            <button onClick={() => setShowForm(false)} className="w-full sm:w-auto px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm">Cancel</button>
          </div>
        </motion.div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${
              filter === f ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="surface-glass rounded-lg p-5">
        {loading ? (
          <p className="text-muted-foreground font-mono text-sm animate-pulse">loading.requests...</p>
        ) : (
          <LeaveTable requests={filtered} />
        )}
      </motion.div>
    </div>
  );
};

export default LeaveRequestsPage;
