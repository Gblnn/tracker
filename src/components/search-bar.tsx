

interface Props{
    onChange?:any
    placeholder?:string
}

export default function SearchBar(props:Props){

    return(
        <>
        {/* Searchbar */}
        <div style={{display:"flex", gap:"1rem", width:"100%"}}>
            <input type="search" onChange={props.onChange} id="search-bar" placeholder={props.placeholder}/>
        </div>
        </>
    )
}