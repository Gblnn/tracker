import { LoadingOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { Check, RefreshCcw } from "lucide-react";

interface Props {
  onClick?: any;
  fetchingData?: any;
  refreshCompleted?: any;
}

export default function RefreshButton(props: Props) {
  return (
    <>
      <button
        className="transitions blue-glass"
        style={{
          paddingLeft: "1rem",
          paddingRight: "1rem",
          width: "3rem",
          height: "2.75rem",
        }}
        onClick={props.onClick}
      >
        {props.fetchingData ? (
          <LoadingOutlined style={{ color: "dodgerblue" }} />
        ) : props.refreshCompleted ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ border: "", display: "flex" }}
          >
            <Check
              color="dodgerblue"
              className="transitions"
              width={"1.25rem"}
              height={"1.25rem"}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ border: "", display: "flex" }}
          >
            <RefreshCcw width={"1rem"} height={"1rem"} color="dodgerblue" />
          </motion.div>
        )}
      </button>
    </>
  );
}
