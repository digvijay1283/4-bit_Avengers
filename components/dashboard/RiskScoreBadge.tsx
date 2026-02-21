import Card from "@/components/ui/Card";

interface RiskScoreProps {
  score?: number | null;
  maxScore?: number;
  label?: string;
}

export default function RiskScoreBadge({
  score = null,
  maxScore = 100,
  label = "AI Risk Score",
}: RiskScoreProps) {
  const percent = score === null ? 0 : (score / maxScore) * 100;
  const circumference = 2 * Math.PI * 40; // radius = 40
  const offset = circumference - (percent / 100) * circumference;

  const getCondition = (s: number) => {
    if (s >= 80) return { text: "Excellent Condition", color: "text-green-600 bg-green-50" };
    if (s >= 60) return { text: "Good Condition", color: "text-blue-600 bg-blue-50" };
    if (s >= 40) return { text: "Needs Attention", color: "text-orange-600 bg-orange-50" };
    return { text: "Critical", color: "text-red-600 bg-red-50" };
  };

  const condition =
    score === null
      ? { text: "No Data", color: "text-slate-600 bg-slate-100" }
      : getCondition(score);

  return (
    <Card className="md:col-span-1 p-6 flex flex-col items-center justify-center min-h-60">
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#E2E8F0"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#106534"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900 dark:text-white">
            {score === null ? "-" : score}
          </span>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            / {maxScore}
          </span>
        </div>
      </div>
      <h3 className="mt-4 font-bold text-lg">{label}</h3>
      <p
        className={`text-sm px-3 py-1 rounded-full mt-2 font-medium ${condition.color}`}
      >
        {condition.text}
      </p>
    </Card>
  );
}
