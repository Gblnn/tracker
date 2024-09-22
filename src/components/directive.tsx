import { LoadingOutlined } from "@ant-design/icons";
import {
  Archive,
  BellOff,
  CheckSquare2,
  ChevronRight,
  Circle,
  EllipsisVerticalIcon,
  LockKeyholeIcon,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import DropDown from "./dropdown";

interface Props {
  title?: any;
  titleSize?: string;
  icon?: any;
  to?: any;
  tag?: any;
  status?: boolean;
  onClick?: any;
  subtext?: string;
  selectable?: boolean;
  onSelect?: any;
  noArrow?: boolean;
  selected?: boolean;
  extra?: any;
  extraOnDelete?: any;
  extraOnEdit?: any;
  notify?: boolean;
  id_subtitle?: string;
  loading?: boolean;
  archived?: boolean;
  protected?: boolean;
  tagOnClick?: any;
  space?: boolean;
  new?: boolean;
  customTitle?: boolean;
  height?: string;
  notName?: boolean;
  className?: string;
}

export default function Directive(props: Props) {
  const [selected, setSelected] = useState(false);

  return (
    <Link
      onClick={() => (props.selectable ? setSelected(!selected) : null)}
      to={props.to}
      className={props.className}
      style={{
        display: "flex",

        opacity: props.archived ? 0.5 : 1,
        height: props.height ? props.height : "",
      }}
    >
      <button
        onClick={props.selectable ? props.onSelect : props.onClick}
        style={{
          paddingLeft: "1rem",
          gap: "0.5rem",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {props.selectable ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CheckSquare2
                width={"1.75rem"}
                height={"1.75rem"}
                className="check-square"
                fill={
                  selected || props.selected
                    ? "dodgerblue"
                    : "rgba(100 100 100/ 50%)"
                }
                stroke={selected || props.selected ? "white" : "none"}
              />
            </div>
          ) : (
            props.icon
          )}

          <div style={{ border: "", width: "" }}>
            {props.subtext ? (
              <p
                style={{
                  fontWeight: 400,
                  width: "",
                  textAlign: "left",
                  fontSize: "0.6rem",
                  opacity: "0.6",
                  textTransform: "uppercase",
                  maxWidth: "80px",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  border: "",
                }}
              >
                {"" + props.subtext + ""}
              </p>
            ) : null}

            {props.customTitle ? (
              props.title
            ) : (
              <span
                className=""
                style={{
                  fontWeight: 400,
                  textAlign: "left",
                  border: "",
                  fontSize: props.titleSize ? props.titleSize : "0.9rem",
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <div
                  style={{ flex: "1 1 100%", minWidth: "0", maxWidth: "130px" }}
                >
                  <div
                    style={{
                      overflow: props.notName ? "" : "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      textTransform: props.notName ? "none" : "capitalize",
                    }}
                  >
                    {props.title}
                  </div>
                </div>

                {props.new && (
                  <Circle
                    style={{ height: "auto", width: "0.45rem" }}
                    color="dodgerblue"
                    fill="dodgerblue"
                  />
                )}
              </span>
            )}

            <p
              style={{
                fontSize: "0.7rem",
                textAlign: "left",
                color: "lightblue",
                opacity: "0.75",
                background: "",
                borderRadius: "0.5rem",
                paddingRight: "0.25rem",
                paddingLeft: "",
                height: "",
                border: "",
                alignItems: "center",
              }}
            >
              {props.id_subtitle}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {props.selectable ? null : props.notify ? (
            props.archived ? (
              ""
            ) : (
              <BellOff width={"1rem"} color="grey" />
            )
          ) : null}

          {props.protected && <LockKeyholeIcon width={"1rem"} color="grey" />}

          {props.tag ? (
            props.loading ? (
              <LoadingOutlined />
            ) : (
              <div
                onClick={props.tagOnClick}
                style={{
                  background: "rgba(150 150 150/ 15%)",
                  fontSize: "0.85rem",
                  paddingLeft: "0.5rem",
                  paddingRight: "0.5rem",
                  borderRadius: "0.5rem",
                  color:
                    props.tag == "Expiring"
                      ? "goldenrod"
                      : props.tag == "Available"
                      ? "lightgreen"
                      : props.status
                      ? "lightblue"
                      : "goldenrod",
                  width: "",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {props.archived == true ? (
                  <div
                    style={{
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Archive width={"1rem"} />
                  </div>
                ) : (
                  <p style={{ textTransform: "capitalize" }}>{props.tag}</p>
                )}
              </div>
            )
          ) : null}

          {props.selectable || props.noArrow ? (
            <div style={{ width: props.space ? "1rem" : "" }}></div>
          ) : props.extra ? (
            <DropDown
              className={"no-bg"}
              onDelete={props.extraOnDelete}
              onEdit={props.extraOnEdit}
              trigger={
                <EllipsisVerticalIcon width={"0.8rem"} height={"0.75rem"} />
              }
            />
          ) : (
            <ChevronRight width={"1rem"} />
          )}
        </div>
      </button>
    </Link>
  );
}
