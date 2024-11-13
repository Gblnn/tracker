import AddRecordButton from "@/components/add-record-button";
import Back from "@/components/back";
import Directive from "@/components/directive";
import InputDialog from "@/components/input-dialog";
import RefreshButton from "@/components/refresh-button";
import SearchBar from "@/components/search-bar";
import { db } from "@/firebase";
import { message } from "antd";
import { addDoc, collection, getDocs, query } from "firebase/firestore";
import { motion } from "framer-motion";
import { Hash, Plus } from "lucide-react";
import { useEffect, useState } from "react";

export default function LPODef() {
  const [search, setSearch] = useState("");
  const [createProjectDialog, setCreateProjectDialog] = useState(false);
  const [fetchingData, setfetchingData] = useState(false);
  // const [sortby, setSortBy] = useState("");
  const [refreshCompleted, setRefreshCompleted] = useState(false);
  const [data, setData] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [project_code, setProjectCode] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setfetchingData(true);
      const RecordCollection = collection(db, "lpo");
      const recordQuery = query(RecordCollection);
      const querySnapshot = await getDocs(recordQuery);
      const fetchedData: any = [];

      querySnapshot.forEach((doc: any) => {
        fetchedData.push({ id: doc.id, ...doc.data() });
      });

      setfetchingData(false);
      setRefreshCompleted(true);
      setData(fetchedData);
      // setChecked([]);
      // setSelectable(false);
      setTimeout(() => {
        setRefreshCompleted(false);
      }, 1000);
    } catch (error) {
      console.log(error);
      message.info(String(error));
      // setStatus("false");
    }
  };

  const addProject = async () => {
    try {
      setUpdating(true);
      await addDoc(collection(db, "project-code"), {
        project_code: project_code,
      });
      setCreateProjectDialog(false);
      fetchData();
    } catch (error) {
      setUpdating(false);
      message.error(String(error));
    }
  };

  return (
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
          title="LPOs"
          extra={
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <RefreshButton
                fetchingData={fetchingData}
                refreshCompleted={refreshCompleted}
                onClick={fetchData}
              />
            </div>
          }
        />

        <br />

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <SearchBar
            placeholder="Search"
            onChange={(e: any) => setSearch(e.target.value.toLowerCase())}
          />
        </div>

        <br />

        {}

        <div style={{ display: "flex", flexFlow: "column", gap: "0.5rem" }}>
          {/* <Directive
            icon={<Hash width={"1.25rem"} color="dodgerblue" />}
            title={"CD 180"}
          />
          <Directive
            icon={<Hash width={"1.25rem"} color="dodgerblue" />}
            title={"CD 175"}
          />
           */}
          {data
            .filter((post: any) => {
              return search == ""
                ? {}
                : post.project_code &&
                    post.project_code
                      .toLowerCase()
                      .includes(search.toLowerCase());
            })
            .map((data: any) => (
              <Directive
                key={data.id}
                title={"CD " + data.project_code}
                icon={<Hash width={"1.25rem"} color="dodgerblue" />}
              />
            ))}
        </div>

        <AddRecordButton
          onClick={() => setCreateProjectDialog(true)}
          icon={<Plus color="dodgerblue" />}
        />
      </motion.div>

      <InputDialog
        titleIcon={<Hash />}
        title="Create a Project"
        inputplaceholder="Enter Project Code"
        inputOnChange={(e: any) => setProjectCode(e.target.value)}
        open={createProjectDialog}
        onCancel={() => setCreateProjectDialog(false)}
        onOk={addProject}
        OkButtonText="Create"
        OkButtonIcon={<Plus width={"0.8rem"} />}
        updating={updating}
        disabled={updating}
      />
    </div>
  );
}
