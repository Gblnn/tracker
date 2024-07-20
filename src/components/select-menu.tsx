import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";


export default function SelectMenu(){
    return(
        <Select>
            <SelectTrigger className="">
                <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
            </SelectContent>
        </Select>

    )
}