import DropDown from "@/components/dropdown";
import { motion } from "framer-motion";
import {
  Archive,
  BellOff,
  CheckSquare2,
  ChevronRight,
  Circle,
  EllipsisVerticalIcon,
  LoaderCircle,
  LockKeyholeIcon,
  PenLine,
} from "lucide-react";
import { useEffect, useState } from "react";
import "./directive.css";

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
  editableTag?: boolean;
  dotColor?: string;
  width?: any;
  expiring?: boolean;
  href?: string;
}

export default function Directive(props: Props) {
  const [internalSelected, setInternalSelected] = useState(false);

  // Sync internal state with parent's selected prop
  useEffect(() => {
    setInternalSelected(!!props.selected);
  }, [props.selected]);

  const handleSelect = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation
    if (props.selectable) {
      const newState = !internalSelected;
      setInternalSelected(newState);
      if (props.onSelect) {
        props.onSelect();
      }
    }
  };

  return (
    <a
      href={props.href || ""}
      onClick={(e) => (props.selectable ? handleSelect(e) : props.onClick?.(e))}
      className={props.className}
      style={{
        display: "flex",
        opacity: props.archived ? 0.5 : 1,
        width: props.width || "auto",
        minWidth: props.width || 0,
        maxWidth: "100%",
        flex: props.width ? "0 0 auto" : 1,
      }}
    >
      <motion.div
        whileTap={{ scale: 0.99 }}
        onClick={(e) => e.preventDefault()} // Prevent double firing
        className=""
        style={{
          height: props.height ? props.height : "",
          padding: "0.75rem",
          gap: "0.5rem",
          flex: 1,
          width: props.width || "100%",
          minWidth: props.width || 0,
          maxWidth: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(100 100 100/ 0.05)",
          borderRadius: "0.5rem",
          // border: "1px solid rgba(100 100 100/ 0.2)",
          transition: "all 0.2s ease",
          cursor: "pointer",
          paddingLeft: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
            flex: 1,
            minWidth: 0,
            border: "",
          }}
        >
          {props.selectable ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
                <CheckSquare2
                  width={"1.5rem"}
                  height={"1.5rem"}
                  className="check-square"
                  fill={
                    internalSelected ? "dodgerblue" : "rgba(100 100 100/ 50%)"
                  }
                  stroke={internalSelected ? "white" : "none"}
                />
              </motion.div>
            </div>
          ) : props.loading ? (
            <div style={{ flexShrink: 0 }}>
              <LoaderCircle
                className="animate-spin"
                color="dodgerblue"
                width={"1.25rem"}
              />
            </div>
          ) : (
            <div style={{ flexShrink: 0 }}>
              {props.icon}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
            {props.subtext && (
              <p
                style={{
                  fontWeight: 500,
                  letterSpacing: "0.06rem",
                  textAlign: "left",
                  fontSize: "0.6rem",
                  opacity: "0.6",
                  textTransform: "uppercase",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  zIndex: -2,
                }}
              >
                {props.subtext}
              </p>
            )}

            {props.customTitle ? (
              props.title
            ) : (
              <span
                style={{
                  fontWeight: 400,
                  textAlign: "left",
                  fontSize: props.titleSize ? props.titleSize : "1rem",
                  display: "flex",
                  gap: "0.65rem",
                  alignItems: "center",
                  width: "100%",
                  minWidth: 0,
                }}
              >
                <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      gap: "0.5rem",
                      textTransform: props.notName ? "none" : "capitalize",
                      maxWidth: "100%",
                    }}
                  >
                    <span style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                    }}>
                      {props.title}
                    </span>
                    {props.expiring && (
                      <Circle
                        color="crimson"
                        width={"0.5rem"}
                        height={"0.5rem"}
                        // className="animate-bounce"
                        fill="crimson"
                      />
                    )}
                  </div>
                </div>
              </span>
            )}

            {props.id_subtitle && (
              <p
                style={{
                  fontSize: "0.6rem",
                  textAlign: "left",
                  color: "lightslategray",
                  opacity: "0.75",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  width: "30ch",
                  border: "",
                  fontWeight: 600,
                }}
              >
                {props.id_subtitle}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          {props.selectable ? null : props.notify ? (
            props.archived ? (
              ""
            ) : (
              <BellOff width={"1rem"} color="grey" />
            )
          ) : null}

          {props.protected && <LockKeyholeIcon width={"1rem"} color="grey" />}

          {props.tag && (
            <div
              onClick={props.tagOnClick}
              style={{
                // background: "rgba(150 150 150/ 15%)",
                fontSize: "0.8rem",
                padding: "0.25rem 0.5rem",
                borderRadius: "0.5rem",
                color:
                  props.tag === "Expiring"
                    ? "goldenrod"
                    : props.tag === "Available"
                    ? "lightgreen"
                    : props.status
                    ? "dodgerblue"
                    : "",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {props.archived ? (
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
                <p
                  style={{
                    textTransform: "capitalize",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {props.editableTag && <PenLine width={"0.65rem"} />}
                  {props.tag}
                </p>
              )}
            </div>
          )}

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
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
              <ChevronRight width={"1rem"} />
            </motion.div>
          )}
        </div>
      </motion.div>
    </a>
  );
}
