import emailjs from '@emailjs/nodejs';
import type { Config } from "@netlify/functions";
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from "../../src/firebase";
import moment from 'moment'

export default async (req: Request) => {

    const serviceId = "service_lunn2bp";
    const templateId = "template_1y0oq9l";

    let m = ""
    let filteredData = []
    const today = new Date()

    try {
      const RecordCollection = collection(db, "records")
      const recordQuery = query(RecordCollection, orderBy("created_on"))
      const querySnapshot = await getDocs(recordQuery)
      const fetchedData:any = [];

      querySnapshot.forEach((doc:any)=>{
        fetchedData.push({id: doc.id, ...doc.data()})        
      })

      filteredData = fetchedData.filter((e:any)=>{
        return(
          e.civil_expiry&&
        Math.round(moment(e.civil_expiry.toDate()).diff(moment(today), 'months'))<=2
        ||
        e.vehicle_expiry&&
        Math.round(moment(e.vehicle_expiry.toDate()).diff(moment(today), 'months'))<=2
        )
            
    
      })


      filteredData.forEach((element:any) => {
        element.civil_expiry!=""?
        m += element.name+"'s Civil ID is expiring on "+
        String(moment((element.civil_expiry).toDate()).format('DD/MM/YYYY'))+
        " in "
        +
        String(Math.round(moment((element.civil_expiry).toDate()).diff(moment(today), 'months')))+" months."
        +"\n\n"
        :null
        element.vehicle_expiry!=""?
        m += element.name+"'s Vehicle ID is expiring on "+String(moment((element.vehicle_expiry).toDate()).format("DD/MM/YYYY"))+
        " in "
        +
        String(Math.round(moment((element.vehicle_expiry).toDate()).diff(moment(today), 'months')))+" months."
        +
        "\n\n"
        :null

      })
      

      filteredData.length>=1?

      await emailjs.send(serviceId, templateId, {
        recipient: "Goblinn688@gmail.com",
        subject:"Document Expiry Reminder",
        message:m
      },{
        publicKey:"c8AePKR5BCK8UIn_E",
        privateKey:"9pSXJLIK1ktbJWQSCX-Xw"
      }
    )
    :null
    } 
    
    catch (error) {
      console.log(error);
    }
    const { next_run } = await req.json()

    console.log("Received event Next invocation at:", next_run)
}

export const config: Config = {
    schedule:"18 14 * 7 * "
}