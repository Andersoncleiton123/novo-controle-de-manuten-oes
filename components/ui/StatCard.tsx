import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";

export function StatCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "green" | "yellow" | "orange" | "red" | "blue";
}) {
  const toneClasses: Record<string, string> = {
    default: "text-gray-900",
    green: "text-green-600",
    yellow: "text-yellow-600",
    orange: "text-orange-600",
    red: "text-red-600",
    blue: "text-blue-600",
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        {icon}
      </div>
      <p className={cn("mt-2 text-2xl font-semibold", toneClasses[tone])}>{value}</p>
    </Card>
  );
}
