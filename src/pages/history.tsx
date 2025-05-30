import Back from "@/components/back";
import Directive from "@/components/directive";
import RefreshButton from "@/components/refresh-button";
import { db } from "@/firebase";
import { message } from "antd";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import ReactTimeAgo from "react-time-ago";

export default function History() {
  const [fetchingData, setfetchingData] = useState(false);
  const [records, setRecords] = useState<any>([]);
  const [refreshCompleted, setRefreshCompleted] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setfetchingData(true);
      const RecordCollection = collection(db, "history");
      const recordQuery = query(
        RecordCollection,
        orderBy("created_on", "desc")
      );
      const querySnapshot = await getDocs(recordQuery);
      const fetchedData: any = [];

      querySnapshot.forEach((doc: any) => {
        fetchedData.push({ id: doc.id, ...doc.data() });
      });

      setfetchingData(false);
      setRecords(fetchedData);
      setRefreshCompleted(true);
      setTimeout(() => {
        setRefreshCompleted(false);
      }, 1000);
    } catch (error) {
      setfetchingData(false);
    }
  };

  return (
    <>
      {/* <div style={{border:"", display:"flex", alignItems:"center", justifyContent:'center'}}>
        <ConfettiExplosion/>
        </div> */}
      <div
        style={{
          padding: "1.25rem",
          background:
            "linear-gradient(rgba(18 18 80/ 65%), rgba(100 100 100/ 0%))",
          height: "100svh",
        }}
      >
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
          <Back
            title={"History"}
            subtitle={records.length}
            extra={
              <RefreshButton
                onClick={fetchData}
                fetchingData={fetchingData}
                refreshCompleted={refreshCompleted}
              />
              //   <div style={{ display: "flex", gap: "0.5rem" }}>
              //     <button
              //       onClick={fetchData}
              //       className="blue-glass"
              //       style={{ width: "3rem", height: "2.75rem" }}
              //     >
              //       {fetchingData ? (
              //         <LoadingOutlined />
              //       ) : (
              //         <RefreshCcw color="dodgerblue" width={"1rem"} />
              //       )}
              //     </button>
              //   </div>
            }
          />
          <br />

          <div
            className="record-list"
            style={{
              display: "flex",
              gap: "0.6rem",
              flexFlow: "column",
              overflowY: "auto",
              height: "82svh",
              paddingTop: "0.85rem",
              paddingRight: "0.35rem",
              border: "",
            }}
          >
            {records.map((e: any) => (
              <Directive
                key={e.id}
                id_subtitle={e.user}
                subtext={
                  e.method == "export"
                    ? "ENTIRE"
                    : e.method == "import"
                    ? "IMPORT"
                    : e.doc_owner + "' s"
                }
                customTitle
                title={
                  <div
                    style={{
                      border: "",
                      display: "flex",
                      marginBottom: "0.25rem",
                      gap: "",
                      fontSize: "0.9rem",
                      alignItems: "center",
                    }}
                  >
                    <p
                      style={{
                        textTransform: "capitalize",
                        textAlign: "left",
                        border: "",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {e.fieldAltered}
                    </p>

                    {e.method == "updation" && (
                      <div
                        style={{
                          border: "",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            background: "rgba(100 100 100/ 20%)",
                            paddingLeft: "0.5rem",
                            paddingRight: "0.5rem",
                            borderRadius: "1rem",
                            alignItems: "center",
                            height: "1.25rem",
                            marginLeft: "0.25rem",
                            color: "lightblue",
                          }}
                        >
                          {e.previousValue}
                        </div>

                        <ArrowRight width={"0.8rem"} color="lightblue" />

                        <div
                          style={{
                            display: "flex",
                            background: "rgba(100 100 100/ 20%)",
                            paddingLeft: "0.5rem",
                            paddingRight: "0.5rem",
                            borderRadius: "1rem",
                            alignItems: "center",
                            height: "1.25rem",
                            color: "dodgerblue",
                          }}
                        >
                          {e.newValue}
                        </div>
                      </div>
                    )}

                    {e.method == "deletion" && (
                      <div
                        style={{
                          display: "flex",
                          background: "rgba(100 100 100/ 20%)",
                          paddingLeft: "0.5rem",
                          paddingRight: "0.5rem",
                          borderRadius: "1rem",
                          alignItems: "center",
                          height: "1.25rem",
                          color: "crimson",
                          marginLeft: "0.25rem",
                          fontWeight: 600,
                        }}
                      >
                        {e.newValue}
                      </div>
                    )}

                    {e.method == "addition" && (
                      <div
                        style={{
                          display: "flex",
                          background: "rgba(100 100 100/ 20%)",
                          paddingLeft: "0.5rem",
                          paddingRight: "0.5rem",
                          borderRadius: "1rem",
                          alignItems: "center",
                          height: "1.25rem",
                          color: "lightgreen",
                          marginLeft: "0.25rem",
                          fontWeight: 600,
                        }}
                      >
                        {e.newValue}
                      </div>
                    )}

                    {e.method == "renew" && (
                      <div
                        style={{
                          display: "flex",
                          background: "rgba(100 100 100/ 20%)",
                          paddingLeft: "0.5rem",
                          paddingRight: "0.5rem",
                          borderRadius: "1rem",
                          alignItems: "center",
                          height: "1.25rem",
                          color: "goldenrod",
                          marginLeft: "0.25rem",
                          fontWeight: 600,
                          gap: "0.35rem",
                        }}
                      >
                        <Sparkles width={"0.8rem"} color="white" />
                        {e.newValue}
                      </div>
                    )}
                  </div>
                }
                icon={
                  <img
                    src={
                      e.type == "personal"
                        ? "/sohar_star_logo.png"
                        : "/vale-logo.png"
                    }
                    style={{ height: "auto", width: "2rem" }}
                  />
                }
                status
                noArrow
                tag={
                  <ReactTimeAgo
                    date={e.created_on.toDate()}
                    timeStyle={"twitter"}
                  />
                }
                tagOnClick={() =>
                  message.info(moment(e.created_on.toDate()).format("LLL"))
                }
              />
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}
