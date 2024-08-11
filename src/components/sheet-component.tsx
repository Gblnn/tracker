import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";

interface Props{
    open?:boolean
    title?:string
}

export default function SheetComponent(props:Props){
    return(
        <Sheet open={props.open}>
    
            
            <SheetContent>
            <SheetHeader style={{marginTop:"2rem"}}>
                <SheetTitle>{props.title}</SheetTitle>
                <SheetDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove your data from our servers.
                </SheetDescription>
                </SheetHeader>
            </SheetContent>
        </Sheet>
        )
}

