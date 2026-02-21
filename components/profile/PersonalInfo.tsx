interface InfoItem {
  icon: string;
  label: string;
  value: string;
}

interface PersonalInfoProps {
  items: InfoItem[];
  onEdit?: () => void;
}

export default function PersonalInfo({ items, onEdit }: PersonalInfoProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex-1">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg text-slate-900">
          Personal Information
        </h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-slate-400 hover:text-primary transition-colors"
          aria-label="Edit personal information"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
        </button>
      </div>

      <div className="space-y-5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
              <span className="material-symbols-outlined">{item.icon}</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs text-slate-500 font-medium">{item.label}</p>
              <p className="text-sm font-bold text-slate-900 truncate">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
