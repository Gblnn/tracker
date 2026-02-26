
interface Props{
    number?: number | string
    private:boolean
}

export default function NumberPlate(props: Props) {
    // Extract alphabetic and numeric parts from the number prop if char is not provided
    const vehicleNumber = props.number?.toString() || '';
    const alphabeticPart = vehicleNumber.match(/[A-Za-z]+/g)?.join('') || '';
    const numericPart = vehicleNumber.match(/\d+/g)?.join('') || vehicleNumber;
    
    return(
        <div style={{background:props.private?"goldenrod":"brown", color:props.private?"black":"white", padding:"0.25rem 0.5rem", borderRadius:"0.25rem", border:"2px solid", display:"flex", alignItems:"center", gap:"0.25rem", margin:0, fontWeight:500}}>
          <div style={{borderRight:"2px solid", paddingRight:"0.5rem", width:"4rem", textAlign:"center"}}>
            {numericPart}
          </div>
          <div style={{borderRight:"2px solid", paddingRight:"0.5rem",paddingLeft:"0.25rem", fontSize:"0.8rem" }}>
            {alphabeticPart}
          </div>
            {"عُمان"}
        </div>
    )
}