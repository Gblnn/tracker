import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { Download, KeyRound } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem } from "./ui/dropdown-menu";

interface Props{
    trigger?:any
    onExport?:any
    onAccess?:any
    className?:any
}

export default function DbDropDown(props:Props){
    return(
        <>
        <DropdownMenu>

            <DropdownMenuTrigger className={props.className} style={{outline:"none"}}>
                {props.trigger}
            </DropdownMenuTrigger>

            <DropdownMenuContent style={{margin:"0.25rem", marginRight:"1.25rem"}}>
        
        <DropdownMenuGroup>

          <DropdownMenuItem onClick={props.onExport} style={{width:"100%"}}>
            <Download className="mr-2" color="lightgreen" />
            <span style={{width:"100%"}}>Export xlsx</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={props.onAccess} style={{width:"100%"}}>
            <KeyRound className="mr-2 " color="dodgerblue" />
            <span style={{width:"100%"}}>Access Control</span>
          </DropdownMenuItem>

          
          
        </DropdownMenuGroup>
        
      </DropdownMenuContent>
        </DropdownMenu>
        </>
    )
}