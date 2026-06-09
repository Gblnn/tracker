interface StatCardProps {
  label: string;
  value: number | string | JSX.Element;
  sub?: string;
  icon: string;
}

export function StatCard({ label, value, sub, icon }: StatCardProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <i className={`ti ${icon} text-base`} aria-hidden="true" />
        {label}
      </div>
      <div className="text-3xl font-semibold text-gray-900 tracking-tight">{value}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  );
}
