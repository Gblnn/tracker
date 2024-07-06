import emailjs from '@emailjs/nodejs';
import type { Config } from "@netlify/functions";
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from "../../src/firebase";

export default async (req: Request) => {

    let records = []

    const serviceId = "service_lunn2bp";
    const templateId = "template_1y0oq9l";

    try {
      
      

      const RecordCollection = collection(db, "records")
      const recordQuery = query(RecordCollection, orderBy("created_on"))
      const querySnapshot = await getDocs(recordQuery)
      const fetchedData:any = [];

      querySnapshot.forEach((doc:any)=>{
        fetchedData.push({id: doc.id, ...doc.data()})        
      })

      records = fetchedData

      await emailjs.send(serviceId, templateId, {
        recipient: "Goblinn688@gmail.com",
        message:records.map((e:any)=>{
          e.name
        })
      },{
        publicKey:"c8AePKR5BCK8UIn_E",
        privateKey:"9pSXJLIK1ktbJWQSCX-Xw"
      }
    );
    console.log("email successfully sent");


    } 
    
    
    catch (error) {
      console.log(error);
    }
    const { next_run } = await req.json()

    console.log("Received event! Next invocation at:", next_run)
}

export const config: Config = {
    schedule:"58 11 * 7 * "
}