import AddRecordButton from "@/components/add-record-button";
import Back from "@/components/back";
import RefreshButton from "@/components/refresh-button";
import Work from "@/components/work";
import { db } from "@/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { motion } from "framer-motion";
import { LoaderCircle, Plus } from "lucide-react";
import { useEffect, useState } from "react";
// import { Opening } from "@/components/opening";

export default function Openings() {
  const [fetchingData, setfetchingData] = useState(false);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setfetchingData(true);
      const RecordCollection = collection(db, "openings");
      const recordQuery = query(RecordCollection);
      const querySnapshot = await getDocs(recordQuery);
      const fetchedData: any = [];

      querySnapshot.forEach((doc: any) => {
        fetchedData.push({ id: doc.id, ...doc.data() });
      });
      setRecords(fetchedData);

      setfetchingData(false);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
      <div
        className=""
        style={{
          minHeight: "",
          paddingTop: "",
          background: "",
        }}
      >
        <div
          style={{
            padding: "",
            width: "100%",
            maxWidth: "",
            margin: "0 auto",
          }}
        >
          <Back title={"Openings"} fixed extra={<RefreshButton />} />

          {fetchingData ? (
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100svh",
              }}
            >
              <LoaderCircle
                color="dodgerblue"
                className="animate-spin"
                width={"3rem"}
                height={"3rem"}
              />
            </div>
          ) : records.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="careers-grid"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "2rem",
                padding: "2rem",
                paddingTop: "6rem",
              }}
            >
              {records.map((record: any) => (
                <Work
                  key={record.id}
                  date={record.date}
                  designation={record.designation}
                  mailto={record.mailto}
                  desc={record.description}
                />
              ))}
            </motion.div>
          ) : (
            <div
              style={{
                display: "flex",
                height: "36ch",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                opacity: "0.5",
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexFlow: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <p>No Openings Found</p>
                  <p style={{ fontSize: "0.6rem" }}>Add a New Opening</p>
                </div>
              </motion.div>
            </div>
          )}
        </div>
        <AddRecordButton icon={<Plus />} />
      </div>
    </motion.div>
  );
}
