import DbComponent from "@/components/database-component";
import { Cloud } from "lucide-react";


export default function Records(){
    return(
        <DbComponent title="Records" dbCategory="personal" loader={<Cloud color="dodgerblue" width={"3rem"} height={"3rem"} style={{position:"absolute"}} className="animate-ping"/>} noTraining/>
    )
}