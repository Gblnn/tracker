import Back from "@/components/back";
import { motion } from "framer-motion";

export default function CreateAccount() {
    // const [email, setEmail] = useState("");
    // const [name, setName] = useState("");
    return(
        <>
        <div
        style={{
          display: "flex",
          border: "",
          height: "100svh",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            border: "",
            position: "absolute",
            top: 0,
            left: 0,
            margin: "2rem",
          }}
        >
          <Back />
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
          <div
            style={{
              display: "flex",
              width: "32ch",
              height: "",
              border: "1px solid rgba(100 100 100/ 50%)",
              borderRadius: "1.75rem",
              padding: "1.45rem",
              flexFlow: "column",
              gap: "1rem",
            }}
          >
            <p
              style={{
                fontSize: "1.35rem",
                textTransform: "uppercase",
                fontWeight: "600",
              }}
            >
              Request Access
            </p>
            <p style={{ fontSize: "0.8rem", opacity: 0.75 }}>
              Enter your email in the field below.
            </p>

            <div
              style={{ display: "flex", flexFlow: "column", gap: "0.75rem" }}
            >
              {/* <input
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                placeholder="Enter Full Name"
              ></input> */}

              <input
                // onChange={(e) => {
                //   setName(e.target.value);
                // }}
                placeholder="Enter Name"
              ></input>

              <p style={{ fontSize: "0.6rem", opacity: 0.5 }}>
                Please consult the IT Department to acquire or enquire about
                your email id{" "}
              </p>
            </div>

            {/* <button
              onClick={checkEmailAndCreateAccount}
              className={email != "" ? "" : "disabled"}
              style={{  
                background: "midnightblue",
                height: "2.5rem",
                fontSize: "0.9rem",
              }}
            >
              {loading ? <LoadingOutlined /> : "Request Access"}
            </button> */}
          </div>
        </motion.div>
      </div>
        </>
    )
}