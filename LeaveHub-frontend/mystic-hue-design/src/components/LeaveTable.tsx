import { motion } from "framer-motion";

type Status = "approved" | "pending" | "rejected";

interface LeaveRequest {
  id: number;
  employee: string;
  type: string;
  from: string;
  to: string;
  days: number;
  status: Status;
  reason: string;
}

const statusStyles: Record<Status, string> = {
  approved: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  rejected: "bg-destructive/10 text-destructive",
};

interface LeaveTableProps {
  requests: LeaveRequest[];
  showActions?: boolean;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}

const LeaveTable = ({ requests, showActions, onApprove, onReject }: LeaveTableProps) => (
  <div className="-mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0">
    <table className="w-full min-w-[640px] text-sm">
      <thead>
        <tr className="border-b border-border">
          <th className="label-text text-left py-3 px-2 sm:px-4">Employee</th>
          <th className="label-text text-left py-3 px-2 sm:px-4">Type</th>
          <th className="label-text text-left py-3 px-2 sm:px-4 hidden sm:table-cell">From</th>
          <th className="label-text text-left py-3 px-2 sm:px-4 hidden sm:table-cell">To</th>
          <th className="label-text text-left py-3 px-2 sm:px-4">Days</th>
          <th className="label-text text-left py-3 px-2 sm:px-4">Status</th>
          {showActions && <th className="label-text text-left py-3 px-2 sm:px-4">Actions</th>}
        </tr>
      </thead>
      <tbody>
        {requests.map((req, i) => (
          <motion.tr
            key={req.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
          >
            <td className="py-2.5 px-2 sm:px-4 font-medium">{req.employee}</td>
            <td className="py-2.5 px-2 sm:px-4 font-mono text-xs">{req.type}</td>
            <td className="py-2.5 px-2 sm:px-4 font-mono text-xs text-muted-foreground hidden sm:table-cell">{req.from}</td>
            <td className="py-2.5 px-2 sm:px-4 font-mono text-xs text-muted-foreground hidden sm:table-cell">{req.to}</td>
            <td className="py-2.5 px-2 sm:px-4 font-mono">{req.days}</td>
            <td className="py-2.5 px-2 sm:px-4">
              <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${statusStyles[req.status]}`}>
                {req.status}
              </span>
            </td>
            {showActions && req.status === "pending" && (
              <td className="py-2.5 px-2 sm:px-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onApprove?.(req.id)}
                    className="px-3 py-1 text-xs font-semibold rounded bg-success/20 text-success hover:bg-success/30 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onReject?.(req.id)}
                    className="px-3 py-1 text-xs font-semibold rounded bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </td>
            )}
            {showActions && req.status !== "pending" && (
              <td className="py-2.5 px-2 sm:px-4 text-xs text-muted-foreground">—</td>
            )}
          </motion.tr>
        ))}
      </tbody>
    </table>
  </div>
);

export { type LeaveRequest, type Status };
export default LeaveTable;
