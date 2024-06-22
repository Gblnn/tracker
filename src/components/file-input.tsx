import * as XLSX from '@e965/xlsx';
import { useState } from 'react';
import axios from 'axios'
export default function FileInput(){
  
    const [data, setData] = useState<any>()
    const [url, setUrl] = useState("")

    const handleFetchFromUrl = async () => {
        try {
          const response = await axios.get(url, { responseType: 'arraybuffer' });
    
          const data = new Uint8Array(response.data);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
          setData(JSON.stringify(jsonData, null, 2));
        } catch (error) {
          console.error('Error fetching or parsing Excel file:', error);
        }
      };
    
    const handleFileUpload = (e:any) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event:any) => {
            const data = event.target.result
            const workbook = XLSX.read(data, { type: 'array' });


            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

           
            const jsonData = XLSX.utils.sheet_to_json(sheet, {header: 1 });
            setData(JSON.stringify(jsonData, null, 2 ));

            // workbook.SheetNames.forEach((sheet)=>{
            //     setData(workbook.Sheets[sheet])
            // })

          };
          reader.readAsArrayBuffer(file);
          console.log(data)
        }
      };


      return(
        <>
        <input type="file" onChange={handleFileUpload}/>
        <div style={{display:"flex", width:"100%", gap:"1rem"}}>
        <input onChange={(e)=>setUrl(e.target.value)} placeholder='Enter URL'/><button onClick={handleFetchFromUrl} style={{width:"6rem"}}>Upload</button>
        </div>
        
    

          
          {data&&
          <div style={{border:""}}>
            <h3>Excel Data:</h3>
            <p>{data}</p>




          </div>
            
          }
          
    

        </>
      )
        
    }

    
        
    