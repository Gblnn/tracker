import { CircularProgressbarWithChildren } from "react-circular-progressbar";

interface Props {
  percentage: number;
  title?: string;
}

export default function CircularProgress(props: Props) {
  return (
    <div style={{ height: "5rem", width: "5rem", marginTop: "0.75rem" }}>
      <CircularProgressbarWithChildren
        styles={{
          path: {
            stroke: "crimson",
            transition: "stroke-dashoffset 0.5s ease 0s",
            strokeLinecap: "round",
          },
          trail: { stroke: "rgba(0 0 0/ 0%)" },
        }}
        value={props.percentage}
      >
        <p
          style={{
            fontSize: "1.25rem",
            fontFamily: "",
            fontWeight: "900",
          }}
        >
          {props.percentage + "%"}
        </p>
      </CircularProgressbarWithChildren>
      <h4
        style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "0.7rem" }}
      >
        {props.title}
      </h4>
    </div>
  );
}

// styles={buildStyles({ pathTransitionDuration: 0.5, pathColor:"#22d6aa", trailColor: '#d3f7ee', backgroundColor: '#3e98c7',textColor:"black"})}
