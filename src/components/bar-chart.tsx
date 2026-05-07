import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';

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

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart width={300} height={100} data={data} style={{padding:"0.05rem"}}>
        <Line type="monotone" dataKey={dataKey} stroke={props.lineColor?props.lineColor:"#8884d8"} strokeWidth={2} dot={false}/>
        
        <Tooltip contentStyle={{borderRadius:"0.5rem", padding:"0.5rem", paddingTop:0, paddingBottom:0, background:"rgba(255, 255, 255, 0.95)", color:"#333", border:"1px solid rgba(100, 100, 100, 0.15)"}}/>
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LineCharter;
