export type AppRole = "admin" | "manager" | "employee";

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: AppRole;
  department?: string;
  designation?: string;
}

export interface LeaveItem {
  id: number;
  employeeId: number;
  employee?: AuthUser;
  leaveType: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected";
  managerComment?: string;
  approvedById?: number;
  approvedBy?: AuthUser;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardOverview {
  totalEmployees: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  myPendingLeaves?: number;
  myApprovedLeaves?: number;
  myRejectedLeaves?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const TOKEN_KEY = "leavehub_token";
const USER_KEY = "leavehub_user";

type EnvelopeResponse<T> = {
  status: number;
  message: string;
  data: T;
};

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  getUser: (): AuthUser | null => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },
  setUser: (user: AuthUser) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clearUser: () => localStorage.removeItem(USER_KEY),
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};

  const isEnvelope =
    typeof data.status === "number" &&
    typeof data.message === "string" &&
    Object.prototype.hasOwnProperty.call(data, "data");

  if (!response.ok) {
    const error =
      (isEnvelope && typeof data.message === "string" && data.message) ||
      (typeof data.error === "string" && data.error) ||
      "Request failed";
    throw new Error(error);
  }

  if (isEnvelope) {
    return (data as EnvelopeResponse<T>).data;
  }

  return data as T;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface CreateEmployeePayload {
  fullName: string;
  email: string;
  password: string;
  role: AppRole;
  department?: string;
  designation?: string;
}

interface UpdateEmployeePayload {
  fullName?: string;
  role?: AppRole;
  department?: string;
  designation?: string;
}

export const api = {
  signUp: (payload: { fullName: string; email: string; password: string; department?: string; designation?: string }) =>
    request<AuthResponse>("/auth/signup", { method: "POST", body: JSON.stringify(payload) }),

  signIn: (payload: { email: string; password: string }) =>
    request<AuthResponse>("/auth/signin", { method: "POST", body: JSON.stringify(payload) }),

  me: async () => {
    const res = await request<{ user: AuthUser }>("/me");
    return res.user;
  },

  dashboardOverview: async () => {
    const res = await request<DashboardOverview>("/dashboard/overview");
    return res;
  },

  getEmployees: async () => {
    const res = await request<{ employees: AuthUser[] }>("/employees");
    return res.employees;
  },

  createEmployee: async (payload: CreateEmployeePayload) => {
    const res = await request<{ employee: AuthUser }>("/employees", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.employee;
  },

  updateEmployee: async (id: number, payload: UpdateEmployeePayload) => {
    const res = await request<{ employee: AuthUser }>(`/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return res.employee;
  },

  deleteEmployee: async (id: number) => {
    await request<{ message: string }>(`/employees/${id}`, {
      method: "DELETE",
    });
  },

  getMyLeaves: async () => {
    const res = await request<{ leaves: LeaveItem[] }>("/leaves/my");
    return res.leaves;
  },

  getAllLeaves: async (status?: "pending" | "approved" | "rejected") => {
    const query = status ? `?status=${status}` : "";
    const res = await request<{ leaves: LeaveItem[] }>(`/leaves${query}`);
    return res.leaves;
  },

  createLeave: async (payload: { leaveType: string; reason: string; startDate: string; endDate: string }) => {
    const res = await request<{ leave: LeaveItem }>("/leaves", { method: "POST", body: JSON.stringify(payload) });
    return res.leave;
  },

  approveLeave: async (id: number, managerComment = "") => {
    const res = await request<{ leave: LeaveItem }>(`/leaves/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ managerComment }),
    });
    return res.leave;
  },

  rejectLeave: async (id: number, managerComment = "") => {
    const res = await request<{ leave: LeaveItem }>(`/leaves/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ managerComment }),
    });
    return res.leave;
  },
};
