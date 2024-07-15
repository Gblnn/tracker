import emailjs from '@emailjs/nodejs';
import type { Config } from "@netlify/functions";
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from "../../src/firebase";
import moment from 'moment'

export default async (req: Request) => {

    const serviceId = "service_lunn2bp";
    const templateId = "template_1y0oq9l";

    let m = ""
    let p = ""
    let filteredData = []
    const today = new Date()
    let rp = ""

    try {

      const RecipientCollection = collection(db, "recipients")
      const Query = query(RecipientCollection, orderBy("created_on"))
      const Snapshot = await getDocs(Query)
      const Data:any = [];

      Snapshot.forEach((doc:any)=>{
        Data.push({id: doc.id, ...doc.data()})        
      })

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
          ||
          e.medical_due_on&&
          Math.round(moment(e.medical_due_on.toDate()).diff(moment(today), 'months'))<=2
          ||
          e.passportExpiry&&
          Math.round(moment(e.passportExpiry.toDate()).diff(moment(today), 'months'))<=6
          ||
          e.vt_hse_induction&&
          Math.round(moment(e.vt_hse_induction.toDate()).diff(moment(today), 'months'))<=2
        //   ||
        //   e.vt_car_1&&
        //   Math.round(moment(e.vt_car_1.toDate()).diff(moment(today), 'months'))<=2   
        //   ||
        //   e.vt_car_2&&
        //   Math.round(moment(e.vt_car_2.toDate()).diff(moment(today), 'months'))<=2    
        //   ||
        //   e.vt_car_3&&
        //   Math.round(moment(e.vt_car_3.toDate()).diff(moment(today), 'months'))<=2 
        //   ||
        //   e.vt_car_4&&
        //   Math.round(moment(e.vt_car_4.toDate()).diff(moment(today), 'months'))<=2
        //   ||
        //   e.vt_car_5&&
        //   Math.round(moment(e.vt_car_5.toDate()).diff(moment(today), 'months'))<=2
        //   ||
        //   e.vt_car_6&&
        //   Math.round(moment(e.vt_car_6.toDate()).diff(moment(today), 'months'))<=2
        //   ||
        //   e.vt_car_7&&
        //   Math.round(moment(e.vt_car_7.toDate()).diff(moment(today), 'months'))<=2
        //   ||
        //   e.vt_car_8&&
        //   Math.round(moment(e.vt_car_8.toDate()).diff(moment(today), 'months'))<=2
        //   ||
        //   e.vt_car_9&&
        //   Math.round(moment(e.vt_car_9.toDate()).diff(moment(today), 'months'))<=2
        //   ||
        //   e.vt_car_10&&
        //   Math.round(moment(e.vt_car_10.toDate()).diff(moment(today), 'months'))<=2
        )
      })

      Data.forEach((r:any)=>{
        rp += r.recipient+", "
      })



      filteredData.forEach((element:any) => {
        element.civil_expiry!=""?
        m += element.name+"'s Civil ID expiry  "
        +
        moment((element.civil_expiry).toDate()).startOf('day').fromNow()
        +" on "
        +String(moment((element.civil_expiry).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        +String(moment(element.civil_expiry.toDate()).diff(moment(today).startOf('day'), 'days')<=0?
        " (Overdue) "
        :"")
        +"\n\n"
        :null

        element.vehicle_expiry!=""?
        m += element.name+"'s Vehicle ID expiry  "
        +
        moment((element.vehicle_expiry).toDate()).startOf('day').fromNow()
        +" on "
        +String(moment((element.vehicle_expiry).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        +String(moment(element.vehicle_expiry.toDate()).diff(moment(today).startOf('day'), 'days')<=0?
        " (Overdue) "
        :"")
        +"\n\n"
        :null

        element.medical_due_on!=""?
        m += element.name+"'s Medical ID expiry "
        +
        moment((element.medical_due_on).toDate()).startOf('day').fromNow()
        +" on "
        +String(moment((element.medical_due_on).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        +String(moment(element.medical_due_on.toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        +"\n\n"
        :null

        element.passportExpiry!=""?
        m += element.name+"'s Passport expiry "
        +
        moment((element.passportExpiry).toDate()).startOf('day').fromNow()
        +" on "
        +String(moment((element.passportExpiry).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        +String(moment((element.passportExpiry).toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        +"\n\n"
        :null

        element.vt_hse_induction!=""?
        m += element.name+"'s HSE Induction Training expiry "
        +
        moment((element.vt_hse_induction).toDate()).startOf('day').fromNow()
        +" on "
        +String(moment((element.vt_hse_induction).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        +String(moment((element.vt_hse_induction).toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        +"\n\n"
        :null

        // element.vt_car_1!=""?
        // m += element.name+"'s CAR - 1 Training expiry "
        // +
        // moment((element.vt_car_1).toDate()).startOf('day').fromNow()
        // +" on "
        // +String(moment((element.vt_car_1).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        // +String(moment((element.vt_car_1).toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        // +"\n\n"
        // :null

        // element.vt_car_2!=""?
        // m += element.name+"'s CAR -2 Training expiry "
        // +
        // moment((element.vt_car_2).toDate()).startOf('day').fromNow()
        // +" on "
        // +String(moment((element.vt_car_2).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        // +String(moment((element.vt_car_2).toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        // +"\n\n"
        // :null

        // element.vt_car_3!=""?
        // m += element.name+"'s CAR - 3 Training expiry "
        // +
        // moment((element.vt_car_3).toDate()).startOf('day').fromNow()
        // +" on "
        // +String(moment((element.vt_car_3).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        // +String(moment((element.vt_car_3).toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        // +"\n\n"
        // :null

        // element.vt_car_4!=""?
        // m += element.name+"'s CAR - 4 Training expiry "
        // +
        // moment((element.vt_car_4).toDate()).startOf('day').fromNow()
        // +" on "
        // +String(moment((element.vt_car_4).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        // +String(moment((element.vt_car_4).toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        // +"\n\n"
        // :null

        // element.vt_car_5!=""?
        // m += element.name+"'s CAR - 5 Training expiry "
        // +
        // moment((element.vt_car_5).toDate()).startOf('day').fromNow()
        // +" on "
        // +String(moment((element.vt_car_5).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        // +String(moment((element.vt_car_5).toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        // +"\n\n"
        // :null

        // element.vt_car_6!=""?
        // m += element.name+"'s CAR - 6 Training expiry "
        // +
        // moment((element.vt_car_6).toDate()).startOf('day').fromNow()
        // +" on "
        // +String(moment((element.vt_car_6).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        // +String(moment((element.vt_car_6).toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        // +"\n\n"
        // :null

        // element.vt_car_7!=""?
        // m += element.name+"'s CAR - 7 Training expiry "
        // +
        // moment((element.vt_car_7).toDate()).startOf('day').fromNow()
        // +" on "
        // +String(moment((element.vt_car_7).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        // +String(moment((element.vt_car_7).toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        // +"\n\n"
        // :null

        // element.vt_car_8!=""?
        // m += element.name+"'s CAR - 8 Training expiry "
        // +
        // moment((element.vt_car_8).toDate()).startOf('day').fromNow()
        // +" on "
        // +String(moment((element.vt_car_8).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        // +String(moment((element.vt_car_8).toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        // +"\n\n"
        // :null

        // element.vt_car_9!=""?
        // m += element.name+"'s CAR - 9 Training expiry "
        // +
        // moment((element.vt_car_9).toDate()).startOf('day').fromNow()
        // +" on "
        // +String(moment((element.vt_car_9).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        // +String(moment((element.vt_car_9).toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        // +"\n\n"
        // :null

        // element.vt_car_10!=""?
        // m += element.name+"'s CAR - 10 Training expiry "
        // +
        // moment((element.vt_car_10).toDate()).startOf('day').fromNow()
        // +" on "
        // +String(moment((element.vt_car_10).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        // +String(moment((element.vt_car_10).toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        // +"\n\n"
        // :null

        m+="\n\n"
      })

    // INDIVIDUAL MAIL SEND
    filteredData.forEach(async (e:any) => {
      p=""
      p+="Listed below are some document(s) which require your attention\n\n"


      e.civil_expiry!=""?
      p+="Civil ID expiry  "
        +
        moment((e.civil_expiry).toDate()).startOf('day').fromNow()
        +" on "
        +String(moment((e.civil_expiry).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        +String(moment(e.civil_expiry.toDate()).diff(moment(today).startOf('day'), 'days')<=0?
        " (Overdue) "
        :"")
        +"\n\n"
        :null

        e.vehicle_expiry!=""?
        p+="Vehicle ID expiry  "
        +
        moment((e.vehicle_expiry).toDate()).startOf('day').fromNow()
        +" on "
        +String(moment((e.vehicle_expiry).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        +String(moment(e.vehicle_expiry.toDate()).diff(moment(today).startOf('day'), 'days')<=0?
        " (Overdue) "
        :"")
        +"\n\n"
        :null

        e.medical_due_on!=""?
        p+="Medical ID expiry "
        +
        moment((e.medical_due_on).toDate()).startOf('day').fromNow()
        +" on "
        +String(moment((e.medical_due_on).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        +String(moment(e.medical_due_on.toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        +"\n\n"
        :null

        e.passportExpiry!=""?
        p+="Passport expiry "
        +
        moment((e.passportExpiry).toDate()).startOf('day').fromNow()
        +" on "
        +String(moment((e.passportExpiry).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        +String(moment((e.passportExpiry).toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        +"\n\n"
        :null

        e.vt_hse_induction!=""?
        p+="HSE Induction Training expiry "
        +
        moment((e.vt_hse_induction).toDate()).startOf('day').fromNow()
        +" on "
        +String(moment((e.vt_hse_induction).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        +String(moment(e.vt_hse_induction.toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        +"\n\n"
        :null

        // e.vt_car_1!=""?
        // p+="CAR - 1 Training expiry "
        // +
        // moment((e.vt_car_1).toDate()).startOf('day').fromNow()
        // +" on "
        // +String(moment((e.vt_car_1).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        // +String(moment(e.vt_car_1.toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        // +"\n\n"
        // :null

        // e.vt_car_2!=""?
        // p+="CAR - 2 Training expiry "
        // +
        // moment((e.medical_due_on).toDate()).startOf('day').fromNow()
        // +" on "
        // +String(moment((e.medical_due_on).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        // +String(moment(e.medical_due_on.toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        // +"\n\n"
        // :null

        // e.vt_car_3!=""?
        // p+="CAR - 3 Training expiry "
        // +
        // moment((e.vt_car_3).toDate()).startOf('day').fromNow()
        // +" on "
        // +String(moment((e.vt_car_3).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        // +String(moment(e.vt_car_3.toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        // +"\n\n"
        // :null

        // e.vt_car_4!=""?
        // p+="CAR - 4 Training expiry "
        // +
        // moment((e.vt_car_4).toDate()).startOf('day').fromNow()
        // +" on "
        // +String(moment((e.vt_car_4).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        // +String(moment(e.vt_car_4.toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        // +"\n\n"
        // :null

        // e.vt_car_5!=""?
        // p+="CAR - 5 Training expiry "
        // +
        // moment((e.vt_car_5).toDate()).startOf('day').fromNow()
        // +" on "
        // +String(moment((e.vt_car_5).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        // +String(moment(e.vt_car_5.toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        // +"\n\n"
        // :null

        // e.vt_car_6!=""?
        // p+="CAR - 6 Training expiry "
        // +
        // moment((e.vt_car_6).toDate()).startOf('day').fromNow()
        // +" on "
        // +String(moment((e.vt_car_6).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        // +String(moment(e.vt_car_6.toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        // +"\n\n"
        // :null

        // e.vt_car_7!=""?
        // p+="CAR - 7 Training expiry "
        // +
        // moment((e.vt_car_7).toDate()).startOf('day').fromNow()
        // +" on "
        // +String(moment((e.vt_car_7).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        // +String(moment(e.vt_car_7.toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        // +"\n\n"
        // :null

        // e.vt_car_8!=""?
        // p+="CAR - 8 Training expiry "
        // +
        // moment((e.vt_car_8).toDate()).startOf('day').fromNow()
        // +" on "
        // +String(moment((e.vt_car_8).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        // +String(moment(e.vt_car_8.toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        // +"\n\n"
        // :null

        // e.vt_car_9!=""?
        // p+="CAR - 9 Training expiry "
        // +
        // moment((e.vt_car_9).toDate()).startOf('day').fromNow()
        // +" on "
        // +String(moment((e.vt_car_9).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        // +String(moment(e.vt_car_9.toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        // +"\n\n"
        // :null

        // e.vt_car_10!=""?
        // p+="CAR - 10 Training expiry "
        // +
        // moment((e.vt_car_10).toDate()).startOf('day').fromNow()
        // +" on "
        // +String(moment((e.vt_car_10).toDate()).add(1, 'day').format("DD/MM/YYYY"))
        // +String(moment(e.vt_car_10.toDate()).diff(moment(today).startOf('day'), 'days')<=0?" (Overdue)":"")
        // +"\n\n"
        // :null

      
      filteredData.length>=1?
      e.notify==true&&
      await emailjs.send(serviceId, templateId, {
        recipient: e.email + ", ",
        subject:"Document Expiry Reminder",
        message:p
      },{
        publicKey:"c8AePKR5BCK8UIn_E",
        privateKey:"9pSXJLIK1ktbJWQSCX-Xw"
      }
    )
    :null
    })


    // GENERAL MAIL SEND
    filteredData.length>=1?

    await emailjs.send(serviceId, templateId, {
      recipient: rp,
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
    schedule:"47 13 * * * "
}