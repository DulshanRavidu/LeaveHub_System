import { LeaveRequest } from "@/components/LeaveTable";

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: "employee" | "manager" | "admin";
  joinDate: string;
  leaveBalance: number;
}

export const employees: Employee[] = [
  { id: "EMP001", name: "Sarah Chen", email: "sarah@abc.com", department: "Engineering", role: "employee", joinDate: "2024-01-15", leaveBalance: 14 },
  { id: "EMP002", name: "Marcus Johnson", email: "marcus@abc.com", department: "Design", role: "employee", joinDate: "2023-06-20", leaveBalance: 8 },
  { id: "EMP003", name: "Aisha Patel", email: "aisha@abc.com", department: "Engineering", role: "manager", joinDate: "2022-03-10", leaveBalance: 18 },
  { id: "EMP004", name: "David Kim", email: "david@abc.com", department: "Marketing", role: "employee", joinDate: "2024-05-01", leaveBalance: 20 },
  { id: "EMP005", name: "Elena Rodriguez", email: "elena@abc.com", department: "HR", role: "admin", joinDate: "2021-11-08", leaveBalance: 12 },
  { id: "EMP006", name: "James Wilson", email: "james@abc.com", department: "Finance", role: "employee", joinDate: "2023-09-14", leaveBalance: 5 },
  { id: "EMP007", name: "Priya Sharma", email: "priya@abc.com", department: "Engineering", role: "employee", joinDate: "2024-02-28", leaveBalance: 16 },
  { id: "EMP008", name: "Tom Baker", email: "tom@abc.com", department: "Design", role: "employee", joinDate: "2023-12-01", leaveBalance: 10 },
];

export const leaveRequests: LeaveRequest[] = [
  { id: 1, employee: "Sarah Chen", type: "Annual", from: "2026-03-20", to: "2026-03-24", days: 3, status: "pending", reason: "Family vacation" },
  { id: 2, employee: "Marcus Johnson", type: "Sick", from: "2026-03-15", to: "2026-03-16", days: 2, status: "approved", reason: "Medical appointment" },
  { id: 3, employee: "David Kim", type: "Annual", from: "2026-04-01", to: "2026-04-05", days: 5, status: "pending", reason: "Personal travel" },
  { id: 4, employee: "Elena Rodriguez", type: "Personal", from: "2026-03-18", to: "2026-03-18", days: 1, status: "approved", reason: "Moving day" },
  { id: 5, employee: "James Wilson", type: "Sick", from: "2026-03-10", to: "2026-03-12", days: 3, status: "rejected", reason: "No leave balance" },
  { id: 6, employee: "Priya Sharma", type: "Annual", from: "2026-03-25", to: "2026-03-28", days: 4, status: "pending", reason: "Wedding attendance" },
  { id: 7, employee: "Tom Baker", type: "Annual", from: "2026-04-10", to: "2026-04-14", days: 5, status: "pending", reason: "Holiday trip" },
  { id: 8, employee: "Sarah Chen", type: "Personal", from: "2026-04-20", to: "2026-04-21", days: 2, status: "pending", reason: "House closing" },
];
