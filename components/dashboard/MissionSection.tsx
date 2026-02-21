import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";

export default function MissionSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Our Mission */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">spa</span>
          Our Mission
        </h2>
        <p className="text-slate-500 dark:text-slate-300 text-sm leading-relaxed">
          Empowering your wellness journey through intelligent, preventive care
          monitoring. We combine cutting-edge AI with human expertise to ensure
          you stay ahead of health risks.
        </p>
      </Card>

      {/* Progress */}
      <Card className="p-6 flex flex-col justify-center gap-4">
        <ProgressBar
          value={92}
          label="System Analysis"
          showPercent
          color="bg-primary"
        />
        <ProgressBar
          value={64}
          label="Model Training"
          showPercent
          color="bg-primary"
        />
        <ProgressBar
          value={88}
          label="Development"
          showPercent
          color="bg-primary"
        />
      </Card>
    </div>
  );
}
