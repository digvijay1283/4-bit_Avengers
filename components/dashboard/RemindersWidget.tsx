import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const reminders = [
  {
    id: 1,
    title: "Vitamin D",
    time: "Today, 09:00 AM",
    iconBg: "bg-orange-100 text-orange-600",
    indicator: "dot-orange",
    icon: "pill",
  },
  {
    id: 2,
    title: "Hydration",
    time: "Every 2 hours",
    iconBg: "bg-blue-100 text-blue-600",
    indicator: "speaker",
    icon: "water_drop",
  },
  {
    id: 3,
    title: "BP Check",
    time: "Tomorrow, 08:00 AM",
    iconBg: "bg-green-100 text-green-600",
    indicator: "dot-green",
    icon: "monitor_heart",
  },
];

export default function RemindersWidget() {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Reminders</h3>
        <Badge variant="danger">2 New</Badge>
      </div>
      <div className="flex flex-col gap-4">
        {reminders.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group cursor-pointer"
          >
            <div
              className={`${r.iconBg} p-2 rounded-lg group-hover:bg-white transition-colors`}
            >
              <span className="material-symbols-outlined">{r.icon}</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {r.title}
              </h4>
              <p className="text-xs text-slate-500">{r.time}</p>
            </div>
            {r.indicator === "speaker" ? (
              <span className="material-symbols-outlined text-gray-400 text-lg">
                volume_up
              </span>
            ) : (
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  r.indicator === "dot-orange"
                    ? "bg-orange-500"
                    : "bg-green-500"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <button className="w-full mt-4 text-primary text-sm font-bold py-2 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors">
        View Calendar
      </button>
    </Card>
  );
}
