import { Route, Routes } from "react-router-dom";
import Header from "./components/header";
import { Toaster } from "./components/ui/sonner";
import Index from "./pages";
import Inbox from "./pages/inbox";
import Medicals from "./pages/medicals";
import Records from "./pages/records";
import UserPage from "./pages/user";
import Vehicles from "./pages/vehicles";


export default function App(){
  return(
    <div>
    <Header/>
    <div style={{height:"5rem"}}></div>
    
    <Toaster/>

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