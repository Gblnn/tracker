import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';

interface Props{
  lineColor?:string
}

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

const LineCharter = (props:Props) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart width={300} height={100} data={data} dataKey={"name"} style={{padding:"0.05rem"}}>
        <Line type="monotone" dataKey="days" stroke={props.lineColor?props.lineColor:"#8884d8"} strokeWidth={2} dot={false}/>
        
        <Tooltip labelFormatter={(name)=>name==0?"Jan":name==1?"Feb":name==2?"Mar":name==3?"Apr":name==4?"May":name==5?"Jun":name==6?"Jul":name==7?"Aug":name==8?"Sep":name==9?"Oct":name==10?"Nov":name==11&&"Dec"} contentStyle={{borderRadius:"0.5rem", padding:"0.5rem", paddingTop:0, paddingBottom:0, background:"black", color:"white", border:"none"}}/>
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LineCharter;
