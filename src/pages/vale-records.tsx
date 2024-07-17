import DbComponent from "@/components/database-component";


export default function ValeRecords(){
    return(
        <DbComponent title="Vale" dbCategory="vale" loader={<img src="/vale-logo.png" width={"40rem"} className="animate-ping"/> }/>
    )
}