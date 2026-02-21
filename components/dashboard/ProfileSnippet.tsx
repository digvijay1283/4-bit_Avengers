import Card from "@/components/ui/Card";
import Image from "next/image";

export default function ProfileSnippet() {
  return (
    <Card className="p-6 text-center">
      <div className="relative w-24 h-24 mx-auto mb-4">
        <Image
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCH_oRGbsQNhiLAOFF_XwVIWhUOj6RbsAUana6CXFjfRnUYR7vzTvhcEkdkhQES7RTfar0kWqZ32rBCX2pgpzlUz_Hle4BPXa1st_Szcy0l1AKaq-BOi7Q_zSuc2ZO_1beiMV78dpDjjLQNj2_PK7AgEro1RFJ_ImNrsn3vRr0WCyomt3-bMHFiqBgjr5jfaHyqfpwAEssUSTe0oDJr29zlmtxTbtanbf0FXFRVPqd5xcaDlFVW6ckFxtSlDgLqdQeLlBZILgm0CNQO"
          alt="User profile picture"
          fill
          className="object-cover rounded-full border-4 border-[#D1FAE5]"
        />
        <button className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-md hover:bg-primary/90">
          <span className="material-symbols-outlined text-sm">edit</span>
        </button>
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
        Alex Johnson
      </h3>
      <p className="text-sm text-slate-500 mb-6">Premium Member</p>
      <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-gray-700 pt-4">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Age
          </p>
          <p className="font-bold text-lg">28</p>
        </div>
        <div className="border-x border-gray-100 dark:border-gray-700">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Wght
          </p>
          <p className="font-bold text-lg">
            75<span className="text-xs font-normal">kg</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Hght
          </p>
          <p className="font-bold text-lg">
            182<span className="text-xs font-normal">cm</span>
          </p>
        </div>
      </div>
    </Card>
  );
}
