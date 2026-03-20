import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LeaveTable, { LeaveRequest } from "@/components/LeaveTable";
import { api } from "@/lib/api";

const ApprovalsPage = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const data = await api.getAllLeaves();
      setRequests(
        data.map((r) => ({
          id: r.id,
          employee: r.employee?.fullName?.trim() || "Unknown",
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
    fetchRequests();
  }, []);

  const pending = requests.filter((r) => r.status === "pending");
  const history = requests.filter((r) => r.status !== "pending");

  const handleApprove = async (id: number) => {
    await api.approveLeave(id);
    fetchRequests();
  };

  const handleReject = async (id: number) => {
    await api.rejectLeave(id);
    fetchRequests();
  };

  return (
    <div className="space-y-6">
      <div>
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-semibold tracking-tight">
          Approvals
        </motion.h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">
          approval.queue // {pending.length} pending
        </p>
      </div>

      {loading ? (
        <div className="surface-glass rounded-lg p-10 text-center">
          <p className="text-muted-foreground font-mono text-sm animate-pulse">loading.approvals...</p>
        </div>
      ) : pending.length > 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="surface-glass rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-warning glow-warning animate-pulse-glow" />
            <span className="label-text">Pending Approval</span>
          </div>
          <LeaveTable requests={pending} showActions onApprove={handleApprove} onReject={handleReject} />
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="surface-glass rounded-lg p-10 text-center">
          <p className="text-muted-foreground font-mono text-sm">queue.empty // No pending requests</p>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="surface-glass rounded-lg p-5">
        <span className="label-text mb-4 block">Approval History</span>
        <LeaveTable requests={history} />
      </motion.div>
    </div>
  );
};

export default ApprovalsPage;
