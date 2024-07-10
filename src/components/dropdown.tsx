import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { PenLine, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem } from "./ui/dropdown-menu";

interface Props{
    trigger?:any
    onDelete?:any
    onEdit?:any
    className?:any
}

export default function DropDown(props:Props){
    return(
        <>
        <DropdownMenu>

            <DropdownMenuTrigger className={props.className} style={{outline:"none"}}>
                {props.trigger}
            </DropdownMenuTrigger>

            <DropdownMenuContent style={{margin:"0.25rem", marginRight:"1.25rem"}}>
        
        <DropdownMenuGroup>

          <DropdownMenuItem onClick={props.onEdit} style={{width:"100%"}}>
            <PenLine className="mr-2 h-4 w-4" />
            <span style={{width:"100%"}}>Edit</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={props.onDelete}>
            <X className="mr-2 h-4 w-4" />
            <span style={{width:"100%"}} >Delete</span>  
          </DropdownMenuItem>
          
        </DropdownMenuGroup>
        
      </DropdownMenuContent>
        </DropdownMenu>
        </>
    )
}