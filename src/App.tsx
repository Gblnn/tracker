import emailjs from '@emailjs/browser';
import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Index from "./pages";
import Inbox from "./pages/inbox";
import Medicals from "./pages/medicals";
import Records from "./pages/records";
import UserPage from "./pages/user";
import Vehicles from "./pages/vehicles";
import History from './pages/history';
import ValeRecords from './pages/vale-records';
import PageNotFound from './pages/page-not-found';
import Login from './pages/login';
import Archives from './pages/archives';
import AccessControl from './pages/access-control';
import ProtectedRoutes from './components/protectedRoute';


export default function App(){
  useEffect(()=>{
    emailjs.init("c8AePKR5BCK8UIn_E")
},[])
  return(
    <div>

    {/* <Header updateInbox/> */}
    <div style={{height:""}}></div>
    
  

    <div style={{ display:"flex", paddingLeft:"1.5rem"}}>
    
    </div>
    

    
    <Routes>
      <Route path="/" element={<Login/>}/>
      <Route element={<ProtectedRoutes user={"user"}/>}>
        <Route path='/index' element={<Index/>}/>
        <Route path="/inbox" element={<Inbox/>}/>
        <Route path="/archives" element={<Archives/>}/>
        <Route path="/access-control" element={<AccessControl/>}/>
        <Route path="/records" element={<Records/>}/>
        <Route path="/vale-records" element={<ValeRecords/>}/>
        <Route path="/user" element={<UserPage/>}/>
        <Route path="/vehicles" element={<Vehicles/>}/>
        <Route path="/medicals" element={<Medicals/>}/>
        <Route path='/history' element={<History/>}/>
      </Route>
      
      <Route path='*' element={<PageNotFound/>}/>
    </Routes>
    
    
    </div>
  )
}