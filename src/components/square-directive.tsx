interface Props {
  icon?: any;
  title?: string;
}

export default function SquareDirective(props: Props) {
  return (
    <div
      style={{
        cursor: "pointer",
        border: "1px solid rgba(100 100 100/ 50%)",
        display: "flex",
        width: "15ch",
        flexFlow: "column",
        height: "fit-content",
        borderRadius: "1.35rem",
        padding: "0.35rem",
      }}
    >
      <div
        style={{
          display: "flex",
          border: " ",
          height: "10ch",
          borderRadius: "1rem",
          borderBottomRightRadius: "0",
          borderBottomLeftRadius: "0",
          justifyContent: "center",
          alignItems: "center",
          background: "rgba(100 100 100/ 20%)",
        }}
      >
        {props.icon}
      </div>
      <div
        style={{
          display: "flex",
          border: "",
          background: "rgba(100 100 100/ 10%)",
          height: "",
          justifyContent: "center",
          padding: "0.5rem",
          borderBottomLeftRadius: "1rem",
          borderBottomRightRadius: "1rem",
        }}
      >
        <p style={{ fontSize: "0.8rem" }}>{props.title}</p>
      </div>
    </div>
  );
}
