"use client";

import { useState } from "react";

export default function AudioAlertToggle() {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#D1FAE5] text-primary p-2 rounded-lg">
            <span className="material-symbols-outlined">volume_up</span>
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Audio Alerts</h3>
            <p className="text-xs text-slate-500">Voice reminders</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={() => setEnabled(!enabled)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
        </label>
      </div>
    </div>
  );
}
