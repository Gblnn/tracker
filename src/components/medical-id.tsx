import { Tooltip } from "antd";
import { motion } from "framer-motion";
import { HeartPulse } from "lucide-react";
import moment from "moment";

interface Props {
  name?: string;
  completedOn?: string;
  dueOn?: string;
  tooltip?: boolean;
}

export default function MedicalID(props: Props) {
  return (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
      <div
        className="civil-id"
        style={{
          width: "32ch",
          height: "19ch",
          background: "rgba(100 100 100/ 15%)",
          borderRadius: "0.75rem",
          cursor: "pointer",
          zIndex: 0,
          display: "flex",
          flexFlow: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingLeft: "0.75rem",
            borderBottom: "1px solid rgba(100 100 100/50%)",
          }}
        >
          <div style={{ display: "flex", flexFlow: "column" }}>
            <p
              style={{
                textTransform: "uppercase",
                textAlign: "left",
                fontSize: "0.8rem",
              }}
            >
              {props.name}
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                color: "tomato",
                fontWeight: "600",
                border: "",
                textAlign: "left",
              }}
            >
              Medical ID
            </p>
          </div>
          <div style={{ border: "", padding: "1rem" }}>
            <HeartPulse color="tomato" width={"2rem"} />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingLeft: "1.25rem",
            borderBottom: "",
            height: "100%",
            gap: "0.5rem",
            border: "",
          }}
        >
          {/* <div style={{display:"flex", flexFlow:"column", gap:"0.5rem"}}>

                <div style={{display:"flex", alignItems:"center", gap:"0.5rem"}}>
                        <p style={{fontSize:"0.75rem"}}>PLATE NO : </p>
                        <p style={{fontWeight:600, fontSize:"0.8rem", textTransform:"uppercase"}}>{}</p>
                    </div>

                    <div style={{display:"flex", alignItems:"center", gap:"0.5rem"}}>
                        <p style={{fontSize:"0.75rem"}}>MAKE : </p>
                        <p style={{fontWeight:600, fontSize:"0.8rem", textTransform:"uppercase"}}>{}</p>
                    </div>

                </div> */}

          {/* <div style={{display:"flex", alignItems:"center", gap:"0.5rem", marginRight:"1.25rem"}}>
                <p style={{fontSize:"0.75rem"}}>YEAR : </p>
                <p style={{fontWeight:600, fontSize:"0.8rem", textTransform:"uppercase"}}>{}</p>
                </div> */}
        </div>

        <div
          style={{
            border: "",
            display: "flex",
            flexFlow: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(100 100 100/ 50%)",
          }}
        >
          {/* <div id="civil-no" style={{display:"flex",border:"", alignItems:'center', gap:"1rem"}}>
                    <p style={{fontSize:"0.7rem"}}>CIVIL NUMBER : </p>
                    <p style={{fontWeight:600, fontSize:"0.9rem"}}>{props.civilid}</p>
                </div> */}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              margin: "1rem",
            }}
          >
            <div
              id="civil-no"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <p style={{ fontSize: "0.7rem" }}>COMPLETED : </p>
              <p style={{ fontWeight: 600, fontSize: "0.8rem" }}>
                {props.completedOn ? props.completedOn : "XXXXXX"}
              </p>
            </div>

            <div
              id="civil-no"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <p style={{ fontSize: "0.7rem" }}>DUE : </p>
              <Tooltip title={moment(props.dueOn, "DD/MM/YYYY").fromNow()}>
                <p style={{ fontWeight: 600, fontSize: "0.8rem" }}>
                  {props.dueOn ? props.dueOn : "XXXXXX"}
                </p>
              </Tooltip>
            </div>
          </div>

          {/* <div style={{display:"flex", border:"", flex:1, justifyContent:"flex-end", alignItems:"center", flexFlow:"column"}}>
                    <p style={{fontSize:"0.7rem"}}>CIVIL NUMBER : </p>
                    <p style={{fontSize:"0.7rem"}}>EXPIRY DATE : </p>
                    <p style={{fontSize:"0.7rem"}}>DATE OF BIRTH : </p>
                </div>

                <div style={{display:"flex", border:"", flex:1, flexFlow:"column"}}>
                    <p style={{fontWeight:600,fontSize:"0.9rem"}}>{props.civilid}</p>
                    <p style={{fontWeight:600,fontSize:"0.9rem"}}>{props.expirydate}</p>
                    <p style={{fontWeight:600,fontSize:"0.9rem"}}>{props.DOB}</p>
                </div> */}
        </div>
      </div>
    </motion.div>
  );
}
