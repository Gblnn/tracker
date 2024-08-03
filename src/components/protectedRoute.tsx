import { Navigate, Outlet } from "react-router-dom"

interface Props{
    user?:any
}

export default function ProtectedRoutes(props:Props){
    return(
        props.user?<Outlet/>:<Navigate to={"/"}/>
    )
}