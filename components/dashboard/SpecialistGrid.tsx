import Card from "@/components/ui/Card";
import Image from "next/image";

const specialists = [
  {
    name: "Dr. Sarah Jenkins",
    role: "Cardiologist",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBY2P47bYfNCnwgAKMVJsQzWG_qL9J_ht8EYQZpehDR38u5_VLEAk83Ssc_vaElU7cC-KL3dFJP4lprAHpTgWKoBQ2rn2InmGPYQP-3MIIuBoVNHyL57RSUFVzsWW8FmuHhRNA3sqsbqER_KaLyKOeZF7beoojCKWEh660mbK5927nPsYo63uvleZ62aplE4PVGQ78eXs7tOJt8UlnHnnMxdYCCWUGV5uGdfkkaubn4I_WF65qCPa72b0c12GDbEjvJkBkXsbsNAWNL",
  },
  {
    name: "Dr. Mark Chen",
    role: "Neurologist",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAXULu1dDQAkx9YP9E7VZUtu7h1hAVYTAs3nE5gefv60sxWPfBaLeDenaqMWgtcQW04Yqca6xiUPhTSo0rOtVPn98DCq3wjVjZfVypcex-Pw4u72WEz2kyG--odTQpTpt0ijD5LimywUxTbwD9rsDauuUjoqZhiSO6IURoSc0UJs1EIWW1AczBUC7LYkvvzCph_G3zXiyiJUwrvh6McQT99iMszzkvFVn1zeI8Ctxqt7lLuxoCLxDT_A5o7oX4dWx3ebuOTzl5VvpU_",
  },
  {
    name: "Dr. Emily Rose",
    role: "Nutritionist",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC81Hv9D5WaZlffRAjoBDzuWI769ZNCafQ7iYWEZ3-v6Vp5iFdq6QpSi9q3DG_k0m_5qLx-pdZhMnVDEOrZEu0PvBzgSiEnaWB4ACOc54qeQz-sV-Npfb-J5tA71Szjcxj0kWZc4VxY2Qo2EIuIP5CCVWfxovvL9IBGkIAyAD8I88xJwbtWtzf0eKnSWWHVKIa_5e95KLDihXw9-dREGRBS5B8dIQ45Ap6J64ZMuKZr62tqGWgXgNBDPWfgk5XZSkrM-9mZf4vh2rmB",
  },
];

export default function SpecialistGrid() {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Top Specialists</h2>
        <a className="text-sm text-primary font-semibold hover:underline cursor-pointer">
          View all
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {specialists.map((doc) => (
          <Card
            key={doc.name}
            className="p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow"
          >
            <div className="relative w-16 h-16 mb-3">
              <Image
                src={doc.image}
                alt={`Headshot of ${doc.name}`}
                fill
                className="object-cover rounded-full"
              />
              <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5">
                <span className="material-symbols-outlined text-green-500 text-sm bg-green-100 rounded-full p-0.5">
                  check
                </span>
              </div>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">
              {doc.name}
            </h3>
            <p className="text-xs text-slate-500 mb-3">{doc.role}</p>
            <button className="w-full py-2 bg-[#D1FAE5]/50 text-primary text-xs font-bold rounded-lg hover:bg-[#D1FAE5] transition-colors">
              Book Appt
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
