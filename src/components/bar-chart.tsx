import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

const data = [
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
    days: 15,
  },
  {
    name: 'Jul',
    days: 0,
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

const LineCharter = () => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart width={300} height={100} data={data} dataKey={"name"} style={{padding:"0.1rem"}}>
        <Line type="monotone" dataKey="days" stroke="#8884d8" strokeWidth={2} />
        <XAxis dataKey={"name"} style={{fontSize:"0.75rem"}}/>
        <Tooltip contentStyle={{borderRadius:"0.5rem", padding:"0.5rem", paddingTop:0, paddingBottom:0, background:"black", color:"white", border:"none"}}/>
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LineCharter;
