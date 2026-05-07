import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
  "data-testid"?: string;
}

export default function StatCard({ label, value, sub, trend, className, "data-testid": testId }: StatCardProps) {
  return (
    <div
      className={cn("bg-card border border-card-border rounded-lg p-4 space-y-1", className)}
      data-testid={testId}
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
        {trend && trend !== "neutral" && (
          trend === "up"
            ? <TrendingUp className="h-4 w-4 text-green-500 mb-0.5" />
            : <TrendingDown className="h-4 w-4 text-red-500 mb-0.5" />
        )}
      </div>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
