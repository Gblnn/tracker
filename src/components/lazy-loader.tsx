import { LazyLoadImage } from "react-lazy-load-image-component";

interface Props {
  name: string;
  type?: string;
  profile?: string;
  block?: boolean;
  height?: string;
  width?: string;
  fontSize?: string;
  background?: string;
}

export default function LazyLoader(props: Props) {
  return (
    <>
      <div
        style={{
          fontSize: props.fontSize ? props.fontSize : "",
          background: props.background ? props.background : "#1a1a1a",
          color: "white",
          height: props.height ? props.height : "1.75rem",
          width: props.width ? props.width : "1.75rem",
          position: props.block ? "inherit" : "absolute",
          borderRadius: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          border: props.type == "omni" ? "2px solid violet" : "",
        }}
      >
        <p
          style={{
            fontWeight: 600,
          }}
        >
          {props.name.charAt(0).toUpperCase()}
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
    </>
  );
}
