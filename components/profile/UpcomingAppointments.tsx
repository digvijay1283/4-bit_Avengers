import Image from "next/image";

export interface Appointment {
  doctorName: string;
  specialty: string;
  avatarUrl: string;
  date: string;
  time: string;
  /** First item gets the mint highlight treatment */
  highlighted?: boolean;
}

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
}

export default function UpcomingAppointments({
  appointments,
}: UpcomingAppointmentsProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-lg text-slate-900 mb-4">Upcoming</h3>

      <div className="flex flex-col gap-4">
        {appointments.map((a) => (
          <div
            key={a.doctorName + a.date}
            className={`p-3 rounded-xl border ${
              a.highlighted
                ? "bg-[#D1FAE5]/30 border-[#D1FAE5]/50"
                : "bg-slate-50 border-slate-100"
            }`}
          >
            {/* Doctor info */}
            <div className="flex gap-3 items-center mb-2">
              <Image
                alt={a.doctorName}
                src={a.avatarUrl}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {a.doctorName}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                  {a.specialty}
                </p>
              </div>
            </div>

            {/* Date / Time */}
            <div
              className={`flex justify-between items-center text-xs mt-2 pt-2 border-t ${
                a.highlighted
                  ? "border-[#D1FAE5]/30"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-1 text-slate-600">
                <span className="material-symbols-outlined text-sm">event</span>
                <span>{a.date}</span>
              </div>
              <div
                className={`flex items-center gap-1 font-semibold ${
                  a.highlighted ? "text-primary" : "text-slate-600"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  schedule
                </span>
                <span>{a.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
