import { ChevronLeft, PenLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LoadingOutlined } from "@ant-design/icons";

interface Props {
  icon?: any;
  title?: any;
  extra?: any;
  noback?: boolean;
  subtitle?: any;
  onTap?: any;
  editMode?: boolean;
  fontSize?: string;
  editModeLoading?: boolean;
  fixed?: boolean;
  blurBG?: boolean;
}

export default function Back(props: Props) {
  const usenavigate = useNavigate();

  return (
    <div
      className="transitions"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        zIndex: 5,
        justifyContent: "space-between",
        padding: props.fixed ? "1.25rem" : " ",
        position: props.fixed ? "fixed" : "inherit",
        width: "100%",
        background: props.blurBG ? "rgba(100 100 100/ 1%)" : "none",
        backdropFilter: props.blurBG ? "blur(16px)" : "",
      }}
    >
      <div style={{ display: "flex" }}>
        {props.noback ? null : (
          <button
            onClick={() => {
              usenavigate(-1);
            }}
            style={{ backdropFilter: "blur(16px)" }}
          >
            <ChevronLeft />
          </button>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "",
            marginLeft: "1rem",
            gap: "",
            flexFlow: "column",
            border: "",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              border: "",
              display: "flex",
              height: "2.25rem",
              alignItems: "center",
              gap: "0.5rem",
              justifyContent: "center",
            }}
          >
            {props.icon && (
              <div
                style={{
                  border: "",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {props.icon}
              </div>
            )}

            <h2
              style={{
                letterSpacing: "0.025rem",
                fontWeight: 400,
                fontSize: props.fontSize ? props.fontSize : "1.5rem",
              }}
              onClick={props.onTap}
            >
              {props.title}
            </h2>
            {props.subtitle ? (
              <motion.div
                style={{
                  display: "flex",
                  gap: "0.65rem",
                  alignItems: "center",
                }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: "0.5" }}
              >
                <p
                  style={{
                    fontSize: "0.75rem",
                    border: "",
                    opacity: "",
                    display: "flex",
                    alignItems: "center",
                    height: "1.25rem",
                    borderRadius: "0.5rem",
                    background: "white",
                    color: "black",
                    padding: "0.25rem",
                    paddingTop: "0.335rem",
                    paddingLeft: "0.35rem",
                    paddingRight: "0.35rem",
                    fontWeight: "500",
                    marginBottom: "0.1rem",
                  }}
                >
                  {props.subtitle}
                </p>
                {props.editMode && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                  >
                    {props.editModeLoading ? (
                      <LoadingOutlined color="dodgerblue" />
                    ) : (
                      <PenLine
                        width={"1rem"}
                        height={"1rem"}
                        color="dodgerblue"
                      />
                    )}
                  </motion.div>
                )}
              </motion.div>
            ) : (
              ""
            )}
          </div>
        </div>
      </div>

      {props.extra}
    </div>
  );
}
