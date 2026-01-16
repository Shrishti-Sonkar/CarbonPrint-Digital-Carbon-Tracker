import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export const StatsCard = ({ title, value, subtitle, icon: Icon, trend, className }: StatsCardProps) => {
  return (
    <Card className={cn("hover:shadow-lg transition-shadow duration-300", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div>
              <h3 className="text-3xl font-bold text-foreground">{value}</h3>
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            </div>
          </div>
          <div className={cn(
            "p-3 rounded-lg",
            trend === "down" && "bg-primary/10",
            trend === "up" && "bg-destructive/10",
            !trend && "bg-accent/10"
          )}>
            <Icon className={cn(
              "w-6 h-6",
              trend === "down" && "text-primary",
              trend === "up" && "text-destructive",
              !trend && "text-accent"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
