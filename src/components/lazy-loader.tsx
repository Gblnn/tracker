import { LazyLoadImage } from "react-lazy-load-image-component";
import { LoadingOutlined } from "@ant-design/icons";

interface Props {
  name: any;
  type?: string;
  profile?: string;
  block?: boolean;
  height?: string;
  width?: string;
  fontSize?: string;
  background?: string;
  gradient?: boolean;
  loading?: boolean;
  state?: string;
  omni?: boolean;
}

export default function LazyLoader(props: Props) {
  return (
    <div style={{ display: "flex" }}>
      <div
        style={{
          fontSize: props.fontSize ? props.fontSize : "",
          background: props.background
            ? props.background
            : props.gradient
            ? "linear-gradient(#3a3a3a, #1e1e1e)"
            : "#1a1a1a",
          color: "white",
          height: props.height ? props.height : "1.75rem",
          width: props.width ? props.width : "1.75rem",
          position: props.block ? "inherit" : "absolute",
          borderRadius: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          border:
            props.state == "archived"
              ? "2px solid goldenrod"
              : props.omni
              ? "2px solid violet"
              : "",
        }}
      >
        <p
          style={{
            fontWeight: 600,
            display: "flex",
            border: "",
          }}
        >
          {props.loading ? (
            <LoadingOutlined />
          ) : (
            props.name.charAt(0).toUpperCase()
          )}
        </p>
      </div>
      <LazyLoadImage
        useIntersectionObserver
        delayMethod="debounce"
        threshold={100}
        effect="blur"
        style={{
          width: "",
          height: "",
          borderRadius: "50%",
          objectFit: "cover",
          display: "flex",
        }}
        src={props.profile}
      />
    </div>
  );
}
