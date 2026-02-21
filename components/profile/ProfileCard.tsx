"use client";

import Image from "next/image";

interface ProfileCardProps {
  name: string;
  avatarUrl: string;
  isPremium?: boolean;
  weight: string;
  height: string;
  age: number;
}

export default function ProfileCard({
  name,
  avatarUrl,
  isPremium = true,
  weight,
  height,
  age,
}: ProfileCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
      {/* Gradient header band */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary/10 to-[#D1FAE5]/30 z-0" />

      {/* Avatar */}
      <div className="relative z-10 w-28 h-28 p-1 bg-white rounded-full mb-4 mt-6 shadow-md">
        {avatarUrl ? (
          <Image
            alt={name}
            src={avatarUrl}
            width={112}
            height={112}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
            {name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
        )}
        <button className="absolute bottom-1 right-1 bg-slate-900 text-white p-1.5 rounded-full hover:bg-primary transition-colors">
          <span className="material-symbols-outlined text-xs">edit</span>
        </button>
      </div>

      {/* Name */}
      <h2 className="text-xl font-bold text-slate-900 relative z-10">{name}</h2>

      {/* Badge */}
      {isPremium && (
        <div className="flex items-center gap-1 mt-1 mb-6 relative z-10">
          <span className="material-symbols-outlined text-primary text-sm">
            verified
          </span>
          <span className="text-xs font-semibold text-primary bg-[#D1FAE5] px-2 py-0.5 rounded-full">
            Premium Member
          </span>
        </div>
      )}

      {/* Stats row */}
      <div className="flex w-full justify-between px-4 py-4 bg-slate-50 rounded-xl">
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Weight</p>
          <p className="font-bold text-slate-900">{weight}</p>
        </div>
        <div className="w-px bg-slate-200" />
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Height</p>
          <p className="font-bold text-slate-900">{height}</p>
        </div>
        <div className="w-px bg-slate-200" />
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Age</p>
          <p className="font-bold text-slate-900">{age}</p>
        </div>
      </div>
    </div>
  );
}
