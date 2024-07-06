import emailjs from '@emailjs/nodejs';
import type { Config } from "@netlify/functions";
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from "../../src/firebase";

export default async (req: Request) => {
  

    const serviceId = "service_lunn2bp";
    const templateId = "template_1y0oq9l";

    try {
      
      console.log("email successfully sent");

      const RecordCollection = collection(db, "records")
      const recordQuery = query(RecordCollection, orderBy("created_on"))
      const querySnapshot = await getDocs(recordQuery)
      const fetchedData:any = [];

      querySnapshot.forEach((doc:any)=>{
        fetchedData.push({id: doc.id, ...doc.data()})        
      })

      await emailjs.send(serviceId, templateId, {
        name: "Gokul",
        recipient: "Goblinn688@gmail.com",
        message:fetchedData.civil_expiry
      },{
        publicKey:"c8AePKR5BCK8UIn_E",
        privateKey:"9pSXJLIK1ktbJWQSCX-Xw"
      }
    );


    } 
    
    
    catch (error) {
      console.log(error);
    }
    const { next_run } = await req.json()

    console.log("Received event! Next invocation at:", next_run)
}

export const config: Config = {
    schedule:"21 6 * 7 * "
}