import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, CheckCircle, XCircle, Clock, TrendingUp, Clock3 } from "lucide-react";
import StatsCard from "@/components/StatsCard";
import LeaveTable, { LeaveRequest } from "@/components/LeaveTable";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

type DepartmentMetric = {
  department: string;
  pending: number;
  total: number;
  ratio: number;
};

const DEFAULT_DEPARTMENTS = ["Engineering", "Design", "Marketing", "HR", "Finance"];

const formatCurrentTime = (date: Date) => {
  const dayMonthYear = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

  const hours = date.getHours() % 12 || 12;
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const ampm = date.getHours() >= 12 ? "PM" : "AM";

  return `${dayMonthYear}, ${hours}:${minutes} ${ampm}`;
};

const normalizeDepartment = (department?: string) => {
  const trimmed = department?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Unassigned";
};

const buildDepartmentMetrics = (
  employees: Array<{ department?: string }>,
  leaves: Array<{ status: "pending" | "approved" | "rejected"; employee?: { department?: string } }>
): DepartmentMetric[] => {
  const totalByDepartment = new Map<string, number>();
  const pendingByDepartment = new Map<string, number>();

  for (const employee of employees) {
    const department = normalizeDepartment(employee.department);
    totalByDepartment.set(department, (totalByDepartment.get(department) ?? 0) + 1);
  }

  for (const leave of leaves) {
    if (leave.status !== "pending") {
      continue;
    }
    const department = normalizeDepartment(leave.employee?.department);
    pendingByDepartment.set(department, (pendingByDepartment.get(department) ?? 0) + 1);
  }

  const departments = new Set<string>([
    ...DEFAULT_DEPARTMENTS,
    ...totalByDepartment.keys(),
    ...pendingByDepartment.keys(),
  ]);

  return Array.from(departments)
    .map((department) => {
      const total = totalByDepartment.get(department) ?? 0;
      const pending = pendingByDepartment.get(department) ?? 0;
      const ratio = total > 0 ? Math.min(100, Math.round((pending / total) * 100)) : 0;

      return { department, pending, total, ratio };
    })
    .sort((a, b) => b.total - a.total || a.department.localeCompare(b.department));
};

const Dashboard = () => {
  const { user, role } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [departmentOverview, setDepartmentOverview] = useState<DepartmentMetric[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const isManagement = role === "admin" || role === "manager";

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [leaves, overview, employees] = await Promise.all([
          isManagement ? api.getAllLeaves() : api.getMyLeaves(),
          api.dashboardOverview(),
          isManagement ? api.getEmployees() : Promise.resolve([]),
        ]);

        setRequests(
          leaves.map((r) => ({
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

        setEmployeeCount(overview.totalEmployees);

        if (isManagement) {
          const metrics = buildDepartmentMetrics(employees, leaves);
          setDepartmentOverview(metrics.slice(0, 6));
        } else {
          setDepartmentOverview([]);
        }
      } catch {
        setRequests([]);
        setDepartmentOverview([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetch();
  }, [user, isManagement]);

  const pending = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const rejected = requests.filter((r) => r.status === "rejected").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 items-start">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-semibold tracking-tight"
          >
            Dashboard
          </motion.h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">system.overview // {new Date().toLocaleDateString()}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-border/70 px-5 py-4"
          style={{
            background:
              "linear-gradient(160deg, hsl(260 14% 12% / 0.95) 0%, hsl(260 14% 10% / 0.9) 55%, hsl(260 12% 9% / 0.92) 100%)",
            boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.03)",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-muted-foreground text-sm">Current time</p>
              <p className="text-[1.03rem] sm:text-[1.18rem] leading-tight font-medium tracking-tight text-foreground/95 mt-1">
                {formatCurrentTime(now)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border border-border/80 flex items-center justify-center text-foreground/90">
              <Clock3 className="w-4.5 h-4.5" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isManagement && (
          <StatsCard label="Total Employees" value={employeeCount} icon={<Users className="w-5 h-5" />} color="primary" delay={0} />
        )}
        <StatsCard label="Pending Requests" value={pending} change={`${pending} awaiting review`} icon={<Clock className="w-5 h-5" />} color="warning" delay={0.05} />
        <StatsCard label="Approved" value={approved} icon={<CheckCircle className="w-5 h-5" />} color="success" delay={0.1} />
        <StatsCard label="Rejected" value={rejected} icon={<XCircle className="w-5 h-5" />} color="destructive" delay={0.15} />
      </div>

      {isManagement && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="surface-glass rounded-lg p-5"
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="label-text">Department Overview</span>
          </div>

          {loading ? (
            <p className="text-muted-foreground font-mono text-sm animate-pulse">loading.departments...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {departmentOverview.map((item) => (
                <div key={item.department} className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div
                      className="w-16 h-16 rounded-full"
                      style={{
                        background: `conic-gradient(hsl(var(--primary)) ${item.ratio}%, hsl(var(--muted)) 0%)`,
                      }}
                    />
                    <div className="absolute inset-[5px] rounded-full bg-background border border-border flex items-center justify-center">
                      <span className="text-xs font-mono font-semibold">{item.pending}/{item.total}</span>
                    </div>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary glow-dot" />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">{item.department}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="surface-glass rounded-lg p-5"
      >
        <span className="label-text mb-4 block">Recent Leave Requests</span>
        {loading ? (
          <p className="text-muted-foreground font-mono text-sm animate-pulse">loading.data...</p>
        ) : (
          <LeaveTable requests={requests.slice(0, 5)} />
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
