"use client";

export interface TimeSlot {
  time: string;
  available: boolean;
  highlighted?: boolean;
}

interface QuickBookProps {
  doctorName: string;
  slots: TimeSlot[];
}

export default function QuickBook({ doctorName, slots }: QuickBookProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex-1">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-slate-900">Quick Book</h3>
        <span className="text-xs text-primary font-semibold cursor-pointer">
          View All
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Available slots for {doctorName}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {slots.map((slot) => {
          if (!slot.available) {
            return (
              <button
                key={slot.time}
                disabled
                className="text-xs py-2 px-1 border border-slate-200 rounded-lg text-slate-400 cursor-not-allowed bg-slate-50"
              >
                {slot.time}
              </button>
            );
          }
          return (
            <button
              key={slot.time}
              className={`text-xs py-2 px-1 rounded-lg font-semibold transition-colors ${
                slot.highlighted
                  ? "border border-primary text-primary bg-[#D1FAE5]/20 hover:bg-[#D1FAE5]"
                  : "border border-slate-200 text-slate-600 hover:border-primary hover:text-primary"
              }`}
            >
              {slot.time}
            </button>
          );
        })}
      </div>

      <button className="w-full mt-6 bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all hover:bg-primary/90 flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-sm">add_circle</span>
        Book New Appointment
      </button>
    </div>
  );
}
