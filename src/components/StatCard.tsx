interface StatCardProps {
  label: string;
  value: number | string | JSX.Element;
  sub?: string;
  icon: string;
  
}

export function StatCard(props: StatCardProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-1" style={{border:"", height:"6rem", background: "rgba(246 248 252 / 0.78)",}}>
      <div className="flex items-center gap-1.5 text-xs text-gray-500" style={{}}>
        <i className={`ti ${props.icon} text-base`} aria-hidden="true" />
        {props.label}
      </div>
      <div className="text-3xl font-semibold text-gray-900 tracking-tight" style={{border:'', height:"3rem", display:"flex", alignItems:"center", justifyContent:"center"}}>{props.value}</div>
      {props.sub && <div className="text-xs text-gray-400">{props.sub}</div>}
    </div>
  );
}
