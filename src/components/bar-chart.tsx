import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Props {
  lineColor?: string;
  data?: Array<{ [key: string]: any }>;
  dataKey?: string;
}

const defaultData = [
  { name: 'Jan', days: 0 },
  { name: 'Feb', days: 0 },
  { name: 'Mar', days: 0 },
  { name: 'Apr', days: 0 },
  { name: 'May', days: 0 },
  { name: 'Jun', days: 0 },
  { name: 'Jul', days: 15 },
  { name: 'Aug', days: 0 },
  { name: 'Sep', days: 0 },
  { name: 'Oct', days: 0 },
  { name: 'Nov', days: 0 },
  { name: 'Dec', days: 0 },
];

const AreaCharter = (props: Props) => {
  const data = props.data || defaultData;
  const dataKey = props.dataKey || 'days';
  const strokeColor = props.lineColor || "#1e3a8a"; // Default darkblue

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div style={{
          padding: '0.5rem',
          background: 'rgba(255,255,255,0.98)',
          border: '1px solid rgba(100,100,100,0.12)',
          borderRadius: 8,
          color: '#111',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{label}</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>{Number(value).toFixed(2)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
        <defs>
          <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.2} />
            <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          interval={0}
          height={20}
          tickMargin={6}
          tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.45)', fontWeight: 500 }}
        />
        <YAxis hide />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={strokeColor}
          strokeWidth={2}
          fillOpacity={1}
          fill={`url(#color-${dataKey})`}
          dot={false}
        />
        <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default AreaCharter;
