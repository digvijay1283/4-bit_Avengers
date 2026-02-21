"use client";

import Card from "@/components/ui/Card";
import Image from "next/image";
import Link from "next/link";
import { useProfile, getAge, getInitials } from "@/hooks/useProfile";
import { useSession } from "@/hooks/useSession";

export default function ProfileSnippet() {
  const { user } = useSession();
  const { profile } = useProfile();

  const displayName =
    profile?.fullName || user?.fullName || user?.email?.split("@")[0] || "-";
  const age = getAge(profile?.dateOfBirth ?? null);
  const ageDisplay = age === null ? "-" : String(age);
  const weightDisplay = profile?.weight || "-";
  const heightDisplay = profile?.height || "-";

  return (
    <Card className="p-6 text-center">
      <div className="relative w-24 h-24 mx-auto mb-4">
        {profile?.avatarUrl ? (
          <Image
            src={profile.avatarUrl}
            alt="User profile picture"
            fill
            className="object-cover rounded-full border-4 border-soft-mint"
          />
        ) : (
          <div className="w-full h-full rounded-full border-4 border-soft-mint bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
            {getInitials(displayName)}
          </div>
        )}
        <Link
          href="/profile?edit=1"
          className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-md hover:bg-primary/90"
          aria-label="Edit profile"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
        </Link>
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
        {displayName}
      </h3>
      <p className="text-sm text-slate-500 mb-6">Premium Member</p>
      <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-gray-700 pt-4">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Age
          </p>
          <p className="font-bold text-lg">{ageDisplay}</p>
        </div>
        <div className="border-x border-gray-100 dark:border-gray-700">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Wght
          </p>
          <p className="font-bold text-lg">
            {weightDisplay}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Hght
          </p>
          <p className="font-bold text-lg">
            {heightDisplay}
          </p>
        </div>
      </div>
    </Card>
  );
}
