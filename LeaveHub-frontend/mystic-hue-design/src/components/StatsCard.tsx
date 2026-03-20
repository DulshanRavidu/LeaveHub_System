import { motion } from "framer-motion";
import { ReactNode } from "react";

interface StatsCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon: ReactNode;
  color?: "primary" | "success" | "warning" | "destructive";
  delay?: number;
}

const colorMap = {
  primary: "text-primary glow-dot",
  success: "text-success glow-success",
  warning: "text-warning glow-warning",
  destructive: "text-destructive glow-destructive",
};

const StatsCard = ({ label, value, change, icon, color = "primary", delay = 0 }: StatsCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: "spring", stiffness: 300, damping: 30 }}
    className="surface-glass rounded-lg p-5"
  >
    <div className="flex items-center justify-between mb-4">
      <span className="label-text">{label}</span>
      <div className={`w-2 h-2 rounded-full ${colorMap[color]}`} />
    </div>
    <div className="flex items-end justify-between">
      <div>
        <p className="text-2xl font-mono font-semibold tracking-tight">{value}</p>
        {change && (
          <p className="text-xs text-muted-foreground mt-1 font-mono">{change}</p>
        )}
      </div>
      <div className="text-muted-foreground">{icon}</div>
    </div>
  </motion.div>
);

export default StatsCard;
