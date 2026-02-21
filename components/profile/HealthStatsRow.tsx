interface Stat {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  suffix?: string;
  /** If true, renders the green gradient hero card style */
  hero?: boolean;
  heroBadge?: string;
}

interface HealthStatsRowProps {
  stats: Stat[];
}

export default function HealthStatsRow({ stats }: HealthStatsRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((s) =>
        s.hero ? (
          <div
            key={s.label}
            className="bg-gradient-to-br from-primary to-[#0f542b] p-5 rounded-2xl text-white shadow-md relative overflow-hidden group"
          >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3 opacity-90">
                <span className="material-symbols-outlined">{s.icon}</span>
                <span className="text-xs font-semibold">{s.label}</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{s.value}</span>
                {s.suffix && (
                  <span className="text-xs mb-1 opacity-70">{s.suffix}</span>
                )}
              </div>
              {s.heroBadge && (
                <p className="text-[10px] mt-2 bg-white/20 inline-block px-2 py-0.5 rounded-full">
                  {s.heroBadge}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div
            key={s.label}
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between group hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2 text-slate-500">
              <div
                className={`p-1.5 ${s.iconBg} rounded-md ${s.iconColor}`}
              >
                <span className="material-symbols-outlined text-lg">
                  {s.icon}
                </span>
              </div>
              <span className="text-xs font-semibold">{s.label}</span>
            </div>
            <div>
              <span className="text-3xl font-bold text-slate-900">
                {s.value}
              </span>
              {s.suffix && (
                <span className="text-xs text-slate-400 ml-1">{s.suffix}</span>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
