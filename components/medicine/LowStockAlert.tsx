import type { LowStockItem } from "@/types/medicine";

interface LowStockAlertProps {
  items?: LowStockItem[];
}

export default function LowStockAlert({
  items = [{ name: "Metformin", daysLeft: 3, percentLeft: 15 }],
}: LowStockAlertProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
          <span className="material-symbols-outlined text-xl">
            inventory_2
          </span>
        </div>
        <div>
          <h4 className="font-bold text-sm">Low Stock Alert</h4>
          <p className="text-xs text-slate-500">Refill needed soon</p>
        </div>
      </div>

      {items.map((item) => (
        <div
          key={item.name}
          className="p-3 bg-yellow-50 rounded-xl border border-yellow-100 mb-3"
        >
          <div className="flex justify-between text-sm mb-1">
            <span className="font-semibold text-slate-700">{item.name}</span>
            <span className="font-bold text-yellow-700">
              {item.daysLeft} days left
            </span>
          </div>
          <div className="w-full bg-yellow-200 rounded-full h-1.5">
            <div
              className="bg-yellow-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${item.percentLeft}%` }}
            />
          </div>
        </div>
      ))}

      <button className="w-full text-primary text-xs font-bold hover:underline">
        Order Refill
      </button>
    </div>
  );
}
