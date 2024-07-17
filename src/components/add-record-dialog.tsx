import { Info, Plus } from "lucide-react";
import InputDialog from "./input-dialog";

interface Props{
    open?:boolean
    onImageChange?:any
    onOK?:any
    onCancel?:any
    updating?:boolean
    disabled?:boolean
    NameOnChange?:any
    EmailOnChange?:any
    CodeOnChange?:any
    CompanyNameOnChange?:any
    DateofJoinOnChange?:any
    SalaryBasicOnChange?:any
    AllowanceOnChange?:any
}

export default function AddRecordDialog(props:Props){
    return(
        <InputDialog open={props.open} OkButtonIcon={<Plus width={"1rem"}/>} 

            image={<input type="file" style={{fontSize:"0.8rem"}} onChange={props.onImageChange}/>}
            title="Add Record" OkButtonText="Add" onCancel={props.onCancel} onOk={props.onOK}

            inputplaceholder="Enter Full Name" 
            input2placeholder="Enter Email"
            input3placeholder="Employee Code"
            input4placeholder="Name of Company"
            input5placeholder="Date of Joining"
            input6placeholder="Salary Basic"
            input7placeholder="Allowance"
            inputOnChange={props.NameOnChange}  
            input2OnChange={props.EmailOnChange}  
            input3OnChange={props.CodeOnChange}
            input4OnChange={props.CompanyNameOnChange}
            input5OnChange={props.DateofJoinOnChange}
            input6OnChange={props.SalaryBasicOnChange}
            input7OnChange={props.AllowanceOnChange}

            
            disabled={props.disabled} updating={props.updating}  
                
            extra={


                <div style={{textAlign:"center", fontSize:"0.7rem", display:"flex", alignItems:"center", gap:"0.5rem", width:"100%", border:"", justifyContent:"center", padding:"0.25rem",background:"linear-gradient(90deg, rgba(100 100 100/ 0%), rgba(100 100 100/ 20%),rgba(100 100 100/ 20%), rgba(100 100 100/ 0%))"}}><Info width={"1rem"} color="violet"/><p style={{opacity:"0.75"}}>We require email to notify the document holder</p></div>
                }
            />
    )
}