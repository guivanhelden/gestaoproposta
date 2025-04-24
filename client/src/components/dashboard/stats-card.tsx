import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

type StatsCardProps = {
  title: string;
  value: string;
  trend?: number;
  trend_text?: string;
  trendUp?: boolean;
  icon: ReactNode;
  color: "primary" | "secondary" | "accent" | "success" | "warning" | "danger" | "info";
};

const colorMap = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
  success: "bg-green-500/10 text-green-500",
  warning: "bg-amber-500/10 text-amber-500",
  danger: "bg-red-500/10 text-red-500",
  info: "bg-blue-500/10 text-blue-500",
};

const textColorMap = {
  primary: "text-primary",
  secondary: "text-secondary",
  accent: "text-accent",
  success: "text-green-500",
  warning: "text-amber-500",
  danger: "text-red-500",
  info: "text-blue-500",
};

export default function StatsCard({
  title,
  value,
  trend,
  trend_text = "em relação ao mês anterior",
  trendUp = true,
  icon,
  color
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">{value}</h3>
          </div>
          <div className={cn("h-12 w-12 flex items-center justify-center rounded-lg", colorMap[color])}>
            {icon}
          </div>
        </div>
        
        {trend !== undefined && (
          <div className={cn("mt-4 text-sm flex items-center", 
            trendUp ? "text-green-500" : "text-red-500")}>
            {trendUp ? (
              <TrendingUp className="mr-1 h-4 w-4" />
            ) : (
              <TrendingDown className="mr-1 h-4 w-4" />
            )}
            <span>{trend}% {trend_text}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
