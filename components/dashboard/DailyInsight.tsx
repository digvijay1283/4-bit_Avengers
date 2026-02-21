import Card from "@/components/ui/Card";
import { Brain } from "lucide-react";

export default function DailyInsight() {
  return (
    <Card variant="gradient" className="p-6">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-[#D1FAE5] text-3xl">
          psychology
        </span>
        <div>
          <h4 className="font-bold mb-1">Daily Insight</h4>
          <p className="text-xs text-white/80 leading-relaxed">
            Walking 20 mins a day boosts your immune system by 15%.
          </p>
        </div>
      </div>
    </Card>
  );
}
