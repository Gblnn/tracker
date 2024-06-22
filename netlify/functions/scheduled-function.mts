import emailjs from '@emailjs/nodejs'
import type { Config } from "@netlify/functions";
import { initializeApp } from 'firebase-admin/app'
import {getFirestore} from 'firebase-admin/firestore'

export default async (req: Request) => {

  initializeApp();
    
    const db = getFirestore()
    const serviceId = "service_lunn2bp";
    const templateId = "template_1y0oq9l";

    try {

      const snapshot = await db.collection("records").get();
      snapshot.forEach((doc) => {
        console.log(doc.id, '=>', doc.data())
      })
        
        
      await emailjs.send(serviceId, templateId, {
        name: "Gokul",
        recipient: "Goblinn688@gmail.com",
        message:"If you recieved this message, the email reminder function is running sucessfully, Congratulations"
      },{
        publicKey:"c8AePKR5BCK8UIn_E",
        privateKey:"9pSXJLIK1ktbJWQSCX-Xw"
      }
    );
      console.log("email successfully sent");
    } catch (error) {
      console.log(error);
    }
    const { next_run } = await req.json()

    console.log("Received event! Next invocation at:", next_run)
}

export const config: Config = {
    schedule:"00 07 * 6 *"
}