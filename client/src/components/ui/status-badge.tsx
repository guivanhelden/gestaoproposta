import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  variant?: "success" | "warning" | "danger" | "info" | "pending" | "muted" | "primary" | "secondary" | "accent";
  children: React.ReactNode;
  className?: string;
};

export function StatusBadge({ variant = "info", children, className }: StatusBadgeProps) {
  const baseClasses = "inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full";
  
  const variantClasses: Record<string, string> = {
    success: "bg-green-500/10 text-green-500",
    warning: "bg-amber-500/10 text-amber-500",
    danger: "bg-red-500/10 text-red-500",
    info: "bg-blue-500/10 text-blue-500",
    pending: "bg-purple-600/10 text-purple-600",
    muted: "bg-gray-400/10 text-gray-400",
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/10 text-accent"
  };
  
  return (
    <span className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </span>
  );
}
