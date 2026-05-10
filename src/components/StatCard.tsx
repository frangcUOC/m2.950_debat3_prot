import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "destructive" | "info";
}

const toneMap: Record<NonNullable<Props["tone"]>, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-[var(--success)]/15 text-[var(--success)]",
  warning: "bg-[var(--warning)]/20 text-[var(--warning)]",
  destructive: "bg-destructive/15 text-destructive",
  info: "bg-[var(--info)]/15 text-[var(--info)]",
};

export function StatCard({ title, value, hint, icon: Icon, tone = "default" }: Props) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold mt-2 text-foreground">{value}</p>
            {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          </div>
          <div className={cn("rounded-lg p-2.5", toneMap[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
