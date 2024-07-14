import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";

interface Props{
  trigger?:any
  onOption1?:any
  onOption2?:any
  onClear?:any
  option1Text?:string
  option2Text?:string
  value?:string
}

export default function CustomSelect(props:Props){
  return(
    <Select value={props.value}>
      <SelectTrigger style={{width:"fit-content"}}>
        {props.trigger}
      </SelectTrigger>
      <SelectContent>
        <SelectItem  onClick={props.onOption1} value="personal">{props.option1Text}</SelectItem>
        <SelectItem  onClick={props.onOption2} value="vale">{props.option2Text}</SelectItem>
        <SelectItem onClick={props.onClear} value="clear">Clear</SelectItem>
      </SelectContent>
</Select>
  )
}

