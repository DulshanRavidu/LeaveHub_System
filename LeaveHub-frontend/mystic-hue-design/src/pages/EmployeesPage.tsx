import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EmployeeProfile {
  id: number;
  fullName: string;
  email: string;
  department: string;
  role: string;
  designation?: string;
}

type FormState = {
  fullName: string;
  email: string;
  department: string;
  role: "employee" | "manager" | "admin";
};

const roleStyles: Record<string, string> = {
  admin: "bg-primary/20 text-primary",
  manager: "bg-warning/20 text-warning",
  employee: "bg-secondary text-secondary-foreground",
};

const formatRole = (role: string) => role.toUpperCase();

const getLeaveBalance = (id: number) => {
  const base = 6 + (id % 15);
  return `${base} days left`;
};

const EmployeesPage = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    department: "",
    role: "employee",
  });

  const canManageEmployeeActions =
    (role === "manager" || role === "admin") &&
    Boolean(user?.email?.toLowerCase().endsWith("@company.com"));

  const loadEmployees = async () => {
    try {
      const employeesData = await api.getEmployees();
      setEmployees(
        employeesData.map((emp) => ({
          id: emp.id,
          fullName: emp.fullName,
          email: emp.email,
          department: emp.department ?? "General",
          role: emp.role,
          designation: emp.designation,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEmployees();
  }, []);

  const filtered = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveEmployee = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      setMessage("Full name and email are required.");
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      if (editingEmployeeId) {
        await api.updateEmployee(editingEmployeeId, {
          fullName: form.fullName.trim(),
          department: form.department.trim() || undefined,
          role: form.role,
          designation: form.role === "manager" ? "Manager" : undefined,
        });
        setMessage("Employee updated successfully.");
      } else {
        await api.createEmployee({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          department: form.department.trim() || undefined,
          role: form.role,
          designation: form.role === "manager" ? "Manager" : undefined,
          password: "Welcome@123",
        });
        setMessage("Employee added successfully. Default password: Welcome@123");
      }

      setForm({ fullName: "", email: "", department: "", role: "employee" });
      setEditingEmployeeId(null);
      await loadEmployees();
    } catch (error) {
      const parsed = error instanceof Error ? error.message : "Failed to create employee";
      setMessage(parsed);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setForm({ fullName: "", email: "", department: "", role: "employee" });
    setEditingEmployeeId(null);
    setMessage(null);
    setShowForm(false);
  };

  const handleEditEmployee = (employee: EmployeeProfile) => {
    setEditingEmployeeId(employee.id);
    setForm({
      fullName: employee.fullName,
      email: employee.email,
      department: employee.department,
      role: employee.role === "admin" || employee.role === "manager" ? employee.role : "employee",
    });
    setShowForm(true);
    setMessage(null);
  };

  const handleDeleteEmployee = (employee: EmployeeProfile) => {
    setEmployeeToDelete(employee);
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) {
      return;
    }

    setDeleting(true);
    setMessage(null);
    try {
      await api.deleteEmployee(employeeToDelete.id);
      setEmployeeToDelete(null);
      setMessage("Employee deleted successfully.");
      toast({
        title: "Employee Deleted",
        description: `${employeeToDelete.fullName} was removed successfully.`,
      });
      await loadEmployees();
    } catch (error) {
      const parsed = error instanceof Error ? error.message : "Failed to delete employee";
      setMessage(parsed);
      toast({
        title: "Delete Failed",
        description: parsed,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <AlertDialog open={employeeToDelete !== null} onOpenChange={(open) => !open && setEmployeeToDelete(null)}>
        <AlertDialogContent className="border border-destructive/50 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Employee
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently remove the employee and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmDeleteEmployee();
              }}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-semibold tracking-tight">
            Employees
          </motion.h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">registry.employees // {employees.length} records</p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-primary hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-glass rounded-lg p-4 md:p-5 space-y-4"
        >
          <span className="label-text">{editingEmployeeId ? "Edit Employee" : "New Employee"}</span>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <input
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              placeholder="Full Name"
              className="w-full px-3 py-2.5 bg-secondary rounded-md text-sm border border-border focus:border-primary focus:outline-none"
            />

            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Email"
              disabled={editingEmployeeId !== null}
              className="w-full px-3 py-2.5 bg-secondary rounded-md text-sm border border-border focus:border-primary focus:outline-none"
            />

            <input
              value={form.department}
              onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
              placeholder="Department"
              className="w-full px-3 py-2.5 bg-secondary rounded-md text-sm border border-border focus:border-primary focus:outline-none"
            />

            <Select value={form.role} onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as FormState["role"] }))}>
              <SelectTrigger className="w-full px-3 py-2.5 bg-secondary rounded-md text-sm border border-border focus:border-primary focus:outline-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={handleSaveEmployee}
              disabled={submitting}
              className="w-full sm:w-auto rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all disabled:opacity-60"
            >
              {submitting ? "Saving..." : editingEmployeeId ? "Update" : "Save"}
            </button>
            <button
              onClick={handleCancel}
              className="w-full sm:w-auto rounded-md bg-secondary px-4 py-2 text-sm text-secondary-foreground"
            >
              Cancel
            </button>
          </div>

          {message && <p className="text-xs font-mono text-muted-foreground">{message}</p>}
        </motion.div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employees..."
          className="w-full pl-10 pr-4 py-2.5 bg-secondary rounded-md text-sm border border-border focus:border-primary focus:outline-none"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground font-mono text-sm animate-pulse">loading.employees...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp, i) => (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="surface-glass rounded-lg p-5 border border-border/60"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-mono text-primary">
                  {emp.fullName.split(" ").map((n) => n[0]).join("").toUpperCase()}
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${roleStyles[emp.role] ?? roleStyles.employee}`}>
                  {formatRole(emp.role)}
                </span>
              </div>
              <h3 className="font-medium text-sm">{emp.fullName}</h3>
              <p className="text-xs text-muted-foreground font-mono">{emp.email}</p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">{emp.department}</span>
                <span className="font-mono text-xs text-primary">{getLeaveBalance(emp.id)}</span>
              </div>

              {canManageEmployeeActions && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEditEmployee(emp)}
                    title="Edit employee"
                    aria-label="Edit employee"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:brightness-110 transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteEmployee(emp)}
                    title="Delete employee"
                    aria-label="Delete employee"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
      </div>
    </>
  );
};

export default EmployeesPage;
