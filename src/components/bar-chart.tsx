import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Props{
  lineColor?:string;
  data?: Array<{[key: string]: any}>;
  dataKey?: string;
}

const defaultData = [
  {
    name: 'Jan',
    days: 0,
  },
  {
    name: 'Feb',
    days: 0,
  },
  {
    name: 'Mar',
    days: 0,
  },
  {
    name: 'Apr',
    days: 0,
  },
  {
    name: 'May',
    days: 0,
  },
  {
    name: 'Jun',
    days: 0,
  },
  {
    name: 'Jul',
    days: 15,
  },
  {
    name: 'Aug',
    days: 0,
  },
  {
    name: 'Sep',
    days: 0,
  },
  {
    name: 'Oct',
    days: 0,

  },
  {
    name: 'Nov',
    days: 0,
    
  },
  {
    name: 'Dec',
    days: 0,
    
  },
];

const LineCharter = (props:Props) => {
  const data = props.data || defaultData;
  const dataKey = props.dataKey || 'days';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(100,100,100,0.12)', borderRadius: 8, color: '#111' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{label}</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>{Number(value).toFixed(2)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart width={300} height={120} data={data} margin={{ top: 0, right: 0, left: 0, bottom: 30 }}>
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          interval={0}
          height={20}
          tickMargin={6}
          tick={{ fontSize: 10, fill: 'rgba(0,0,0,0.65)' }}
        />
        <YAxis hide />
        <Line type="monotone" dataKey={dataKey} stroke={props.lineColor ? props.lineColor : "#8884d8"} strokeWidth={2} dot={false} />
        <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LineCharter;
