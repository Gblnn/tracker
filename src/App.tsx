import emailjs from '@emailjs/browser';
import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Header from "./components/header";
import Index from "./pages";
import Inbox from "./pages/inbox";
import Medicals from "./pages/medicals";
import Records from "./pages/records";
import UserPage from "./pages/user";
import Vehicles from "./pages/vehicles";

export default function App(){
  useEffect(()=>{
    emailjs.init("c8AePKR5BCK8UIn_E")
},[])
  return(
    <div>

    <Header/>
    <div style={{height:"5rem"}}></div>
    
  

    <div style={{ display:"flex", paddingLeft:"1.5rem"}}>
    
    </div>
    

    
    <Routes>
      <Route path="/" element={<Index/>}/>
      <Route path="/inbox" element={<Inbox/>}/>
      <Route path="/records" element={<Records/>}/>
      <Route path="/user" element={<UserPage/>}/>
      <Route path="/vehicles" element={<Vehicles/>}/>
      <Route path="/medicals" element={<Medicals/>}/>
    </Routes>
    
    
    </div>
  )
}