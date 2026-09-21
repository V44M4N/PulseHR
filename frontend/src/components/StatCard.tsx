import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  accent?: "primary" | "accent" | "warning" | "info";
}

const accentMap = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
};

export function StatCard({ label, value, delta, trend = "neutral", icon: Icon, accent = "accent" }: StatCardProps) {
  return (
    <div className="card-surface p-5 hover:shadow-elevated transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
          <div className="text-2xl md:text-3xl font-display font-bold text-foreground mt-2">{value}</div>
          {delta && (
            <div className={cn(
              "text-xs font-medium mt-1",
              trend === "up" && "text-success",
              trend === "down" && "text-destructive",
              trend === "neutral" && "text-muted-foreground",
            )}>
              {trend === "up" ? "▲" : trend === "down" ? "▼" : "•"} {delta}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", accentMap[accent])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}