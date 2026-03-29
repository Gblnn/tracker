import Back from "@/components/back";
import Directive from "@/components/directive";
import { useState } from "react";
import { toast } from "sonner";

// function getTodayDate() {
//   return new Date().toISOString().split("T")[0];
// }



export default function Timetaag() {
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState({} as any);

  const fetchProcessData = async () => {
    setLoading(true);
    setError("");

    const url = new URL(
    "https://app.timetaag.com/api/v1/GetEmployees?per_page=100&page=1"
);

const headers = {
    "Authorization": "Bearer 10069_BQT86ki21io3wDpaqwJEGIR0TxhMxuY8icLPfRXacwXendpoux",
    "Content-Type": "application/json",
    "BioTaag-API-Key": "10069_BQT86ki21io3wDpaqwJEGIR0TxhMxuY8icLPfRXacwXendpoux",
    "Accept": "application/json",
};

fetch(url, {
    method: "GET",
    headers,
    
}).then(response => response.json())
  .then(data => {setData(data.data); setMeta(data.meta); toast.success(data.message)})
  .catch(err => setError(err instanceof Error ? err.message : "Unexpected error while fetching Timetaag data"))
  .finally(() => setLoading(false));

    // try {
    //   const response = await fetch(url, {
    //     method: "POST",
    //     headers,
    //     body: JSON.stringify(body),
    //   });

    //   const result = await response.json();

    //   if (!response.ok) {
    //     throw new Error(result?.error ?? "Unable to fetch Timetaag data");
    //   }

    //   setData(result?.data ?? result);
    // } catch (err) {
    //   setData(null);
    //   setError(err instanceof Error ? err.message : "Unexpected error while fetching Timetaag data");
    // } finally {
    //   setLoading(false);
    // }
  };

  return (
    <>
      <Back
      extra={<button
            type="button"
            onClick={fetchProcessData}
            disabled={loading}
            style={{
          
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.65rem 0.95rem",
              background: loading ? "#9ca3af" : "#111827",
              color: "#ffffff",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {loading ? "Fetching..." : "Fetch"}
          </button>}
        fixed
        blurBG
        title="Timetaag"
        // subtitle="Module"
        icon={<img src="/timetaag.png" alt="Timetaag" style={{ width: "1.75rem", height: "1.75rem", objectFit: "contain" }} />}
      />
      <div
        style={{
          padding: "1.25rem",
          paddingTop: "5.5rem",
          paddingBottom: "1.5rem",
          minHeight: "100svh",
          boxSizing: "border-box",
        }}
      >
        {/* <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <img src="/timetaag.png" alt="Timetaag" style={{ width: "2.5rem", height: "2.5rem", objectFit: "contain" }} />
            </EmptyMedia>
            <EmptyTitle>Timetaag Module</EmptyTitle>
            <EmptyDescription>
              Fetch daily process report data directly from Timetaag.
            </EmptyDescription>
          </EmptyHeader>
        </Empty> */}

        <div
          style={{

            marginTop: "1rem",
            border: "1px solid #e5e7eb",
            borderRadius: "0.75rem",
            padding: "1rem",
            background: "#ffffff",
          }}
        >
          {/* <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>From Date</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "0.5rem 0.75rem" }}
              />
            </label>

            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>To Date</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "0.5rem 0.75rem" }}
              />
            </label>
          </div> */}

          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", border:"", marginBottom:"0.75rem"}}>

            {/* <div style={{display:"flex", alignItems: "center", gap: "0.5rem"}}>
            <img src="/timetaag.png" alt="Timetaag" style={{ width: "2.5rem", height: "2.5rem", objectFit: "contain" }} />
          <p style={{fontSize:"1.5rem"}}>Timetaag Module</p>
          </div> */}
          

          
          </div>

          <div>
            <pre
              style={{
                marginTop: "0.75rem",
                height: "45svh",
                overflow: "auto",
                borderRadius: "0.5rem",
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
                padding: "0.75rem",
                fontSize: "0.78rem",
                lineHeight: 1.45,
              }}
            >
              {JSON.stringify(meta, null, 2)}
            </pre>
          </div>

          

          {error ? (
            <p style={{ marginTop: "0.75rem", color: "#dc2626", fontWeight: 500 }}>{error}</p>
          ) : null}

          <div style={{display:"flex", flexFlow:"column", gap:"1rem", paddingTop:"1rem", overflowY:"auto", maxHeight:"35svh"}}>
          {
          (
            <>
            

            {/* <pre
              style={{
                marginTop: "0.75rem",
                maxHeight: "50vh",
                overflow: "auto",
                borderRadius: "0.5rem",
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
                padding: "0.75rem",
                fontSize: "0.78rem",
                lineHeight: 1.45,
              }}
            >
              {JSON.stringify(data, null, 2)}
            </pre> */}

            </>
            
            
            
          ) }

          {data.length > 0 ?
          data.map((e:any)=>(
            <Directive key={e.id} title={e.emp_name} id_subtitle={e.emp_code}/>
          ))
          :

          null}
          </div>
        </div>
      </div>
    </>
  );
}
