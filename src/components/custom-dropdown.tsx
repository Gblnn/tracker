import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem } from "./ui/dropdown-menu";

interface Props{
    trigger?:any
    onOption1?:any
    onOption2?:any
    className?:any
    option1Text?:string
    option1Icon?:any
    option2Text?:string
    option2Icon?:any
    onClear?:any
}

export default function CustomDropDown(props:Props){
    return(
        <>
        <DropdownMenu>

            <DropdownMenuTrigger className={props.className} style={{outline:"none"}}>
                {props.trigger}
            </DropdownMenuTrigger>

            <DropdownMenuContent style={{margin:"0.25rem", marginRight:"1.25rem"}}>
        
        <DropdownMenuGroup>

          <DropdownMenuItem onClick={props.onOption1} style={{width:"100%"}}>
            {props.option1Icon}
            <span style={{width:"100%"}}>{props.option1Text}</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={props.onOption2}>
            {props.option2Icon}
            <span style={{width:"100%"}} >{props.option2Text}</span>  
          </DropdownMenuItem>

          <DropdownMenuItem onClick={props.onClear}>
            
            <span style={{width:"100%"}} >Show All</span>  
          </DropdownMenuItem>
          
        </DropdownMenuGroup>
        
      </DropdownMenuContent>
        </DropdownMenu>
        </>
    )
}