import { LoadingOutlined } from "@ant-design/icons";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { Tooltip } from "antd";
import {
  AtSign,
  ChevronLeft,
  Hash,
  Info,
  LineChart,
  Phone,
  ScrollText,
  X,
} from "lucide-react";
import Directive from "../directive";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";
import { Button } from "./button";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "./dialog";
import { useEffect } from "react";

interface Props {
  open?: boolean;
  title?: any;
  titleIcon?: any;
  desc?: string;
  OkButtonText?: string;
  CancelButtonText?: string;
  onOk?: any;
  onCancel?: any;
  destructive?: boolean;
  extra?: any;
  close?: boolean;
  title_extra?: any;
  disabled?: boolean;
  back?: boolean;
  sendmail?: boolean;
  updating?: boolean;
  created_on?: any;
  progress?: string;
  footerExtra?: any;
  progressItem?: string;
  bigDate?: any;
  subtitle?: string;
  code?: string;
  codeIcon?: any;
  tags?: boolean;
  tag1OnClick?: any;
  tag2OnClick?: any;
  tag3OnClick?: any;
  tag4OnClick?: any;
  tag1Text?: any;
  tag2Text?: any;
  tag3Text?: any;
  tag4Text?: any;
  tag1Alert?: boolean;
  onBottomTagClick?: any;
  bottomValueLoading?: boolean;
  bottomTagValue?: any;
  codeTooltip?: string;
  renumeration?: boolean;
  remarksOnClick?: any;
  remarksValue?: string;
  dialogBackground?: any;
  dialogHeight?: any;
  creation_date?: string;
  contact?: string;
  titleinfo?: boolean;
  onTitleClick?: any;
  email?: string;
}

export default function DefaultDialog(props: Props) {
  useEffect(() => {
    const root = document.getElementById("root");

    if (!props.open) {
      // On dialog close, force cleanup
      root?.removeAttribute("aria-hidden");
      root?.removeAttribute("inert");
    }
  }, [props.open]);

  return (
    <>
      <Dialog open={props.open}>
        <DialogContent
          style={{
            border: "",
            maxWidth: "", // Prevent stretching
            width: "", // Responsive for mobile
            minWidth: "",
          }}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            {
              <DialogTitle
                className="heading"
                style={{
                  userSelect: "none",
                  width: "100%",
                  // borderBottom: "1px solid rgba(100 100 100/ 50%)",
                  // paddingBottom: "1rem",
                }}
              >
                <div
                  className="flex"
                  style={{ border: "", justifyContent: "space-between" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      border: "",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{ border: "", height: "100%", display: "flex" }}
                    >
                      {props.titleIcon}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexFlow: "column",
                        border: "",
                        gap: "0.25rem",
                      }}
                    >
                      <div
                        onClick={props.onTitleClick}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          border: "",
                          gap: "0.75rem",
                          fontSize: "1rem",
                        }}
                      >
                        <p
                          style={{
                            border: "",
                            // maxWidth: "150px",
                            textOverflow: "ellipsis",
                            textAlign: "left",
                            overflow: "hidden",
                            whiteSpace: "",
                            textTransform: "capitalize",
                          }}
                        >
                          {props.title}
                        </p>
                      </div>

                      {
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          {props.code && (
                            <Tooltip
                              title={props.codeTooltip}
                              placement="right"
                            >
                              <div
                                style={{
                                  fontSize: "1rem",
                                  fontWeight: 400,
                                  border: "1px solid rgba(100 100 100/ 75%)",
                                  borderRadius: "0.5rem",
                                  paddingLeft: "0.25rem",
                                  textAlign: "left",
                                  opacity: "0.75",
                                  display: "flex",
                                  gap: "0.5rem",
                                  alignItems: "center",
                                  paddingRight: "0.5rem",
                                  width: "",
                                  height: "",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "balance",
                                  overflow: "hidden",
                                }}
                              >
                                {props.codeIcon ? (
                                  props.codeIcon
                                ) : (
                                  <Hash color="dodgerblue" width={"0.8rem"} />
                                )}

                                <p style={{ fontSize: "0.9rem" }}>
                                  {props.code}
                                </p>
                              </div>
                            </Tooltip>
                          )}

                          <p
                            onClick={props.bigDate}
                            style={{
                              fontWeight: 400,
                              fontSize: "1rem",
                              opacity: 0.5,
                              letterSpacing: "0.075rem",
                              display: "flex",
                              gap: "0.5rem",
                            }}
                          >
                            {props.created_on}
                          </p>
                        </div>
                      }
                    </div>
                  </div>

                  {props.title_extra}
                </div>
                <div
                  style={{
                    border: "",
                    display: "flex",
                    fontWeight: "600",
                    fontSize: "0.8rem",
                    color: "dodgerblue",
                  }}
                >
                  <p
                    style={{
                      paddingLeft: "0.5rem",
                      paddingRight: "0.5rem",
                      borderRadius: "0.5rem",
                      background: "rgba(100 100 100/ 20%)",
                      marginLeft: "0.5rem",
                    }}
                  >
                    {props.subtitle}
                  </p>
                </div>

                {props.contact && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginTop: "0.95rem",
                      background: props.contact
                        ? ""
                        : "linear-gradient(90deg, rgba(0 0 0/ 0%), rgba(100 100 100/ 25%), rgba(0 0 0/ 0%))",
                      padding: "",
                      borderRadius: "0.75rem",
                      justifyContent: props.contact
                        ? "space-between"
                        : "center",
                      height: "2.25rem",
                      border: props.contact
                        ? "1px solid rgba(100 100 100/50%)"
                        : "",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginLeft: "0.35rem",
                        alignItems: "center",
                      }}
                    >
                      {/* <p
                        style={{
                          fontSize: "0.8rem",
                          opacity: "0.5",
                          fontWeight: 400,
                        }}
                      ></p> */}
                      {/* <p style={{ fontSize: "0.8rem", color: "dodgerblue" }}>
                        {props.creation_date}
                      </p> */}
                      <a
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                          // marginRight: "0.35rem",
                          border: "",
                          background: "rgba(150 150 150/ 15%)",
                          borderRadius: "0.5rem",
                          paddingLeft: "0.5rem",
                          paddingRight: "0.75rem",
                        }}
                      >
                        <AtSign color="dodgerblue" width={"0.8rem"} />
                        <a href={"mailto:"+props.email} style={{ fontSize: "0.8rem", fontWeight: "500" }}>
                          {props.email ? props.email : "Email Address"}
                        </a>
                      </a>
                    </div>

                    {props.contact && (
                      <a
                        href={"tel:" + props.contact}
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                          marginRight: "0.35rem",
                          border: "",
                          background: "rgba(150 150 150/ 15%)",
                          borderRadius: "0.5rem",
                          paddingLeft: "0.75rem",
                          paddingRight: "0.75rem",
                        }}
                      >
                        <Phone width={"0.8rem"} color="dodgerblue" />
                        <p style={{ fontSize: "1rem" }}>{props.contact}</p>
                      </a>
                    )}
                  </div>
                )}
              </DialogTitle>
            
            }
          </DialogHeader>
         

            {props.tags ? (
              <div
                style={{
                  display: "flex",
                  flexFlow: "column",
                  gap: "0.5rem",

                  width: "100%",
                }}
              >
                <div
                  style={{
                    height: "2rem",
                    border: "",
                    width: "100%",
                    display: "flex",
                    gap: "0.5rem",
                    minWidth: 0,
                  }}
                >
                  <div
                    onClick={props.tag1OnClick}
                    style={{
                      background: "rgba(150 150 150/ 15%)",
                      fontSize: "0.8rem",
                      display: "flex",
                      alignItems: "center",
                      paddingRight: "0.75rem",
                      paddingLeft: "0.75rem",
                      borderRadius: "0.5rem",
                      gap: "0.5rem",
                      flex: 1,
                      justifyContent: "center",
                      cursor: "pointer",
                      overflow: "hidden",
                      minWidth: 0,
                      maxWidth: "100%",
                    }}
                  >
                    {props.tag1Alert ? (
                      <Info
                        className="animate-pulse"
                        width={"1rem"}
                        color="crimson"
                        strokeWidth={"3px"}
                      />
                    ) : (
                      <ScrollText width={"1rem"} color="dodgerblue" />
                    )}

                    {props.tag1Text ? (
                      <p
                        style={{
                          textTransform: "uppercase",
                          fontSize: "0.7rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "100%",
                        }}
                      >
                        {props.tag1Text}
                      </p>
                    ) : (
                      "No Data"
                    )}
                  </div>
                  <div
                    style={{
                      background: "rgba(150 150 150/ 15%)",
                      fontSize: "0.8rem",
                      display: "flex",
                      alignItems: "center",
                      paddingRight: "0.75rem",
                      paddingLeft: "0.75rem",
                      borderRadius: "0.5rem",
                      gap: "0.25rem",
                      flex: 1,
                      justifyContent: "center",
                      cursor: "pointer",
                      minWidth: 0,
                      maxWidth: "100%",
                    }}
                  >
                  
                    <p style={{ opacity: 0.5 }}>Joined </p>
                    <b>{props.tag2Text}</b>
                  </div>
                </div>

              </div>
            ) : null}

            {props.desc ? (
              <p
                style={{
                  textAlign: "left",
                  width: "100%",
                  fontSize: "0.9rem",
                  opacity: 0.5,
                  height: "2rem",
                  marginBottom: "",
                }}
              >
                {props.desc}
              </p>
            ) : null}

            {
            props.extra && (
              <div
                style={{
                  width: "",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  maxWidth: "100%",
                  minWidth: 0,
                  border:""
                }}
              >
                {props.extra}
              </div>
            )
            }

            {props.tags ? (
              <div
                style={{
                  display: "flex",
                  flexFlow: "column",
                  gap: "0.5rem",
                  border: "",
                  width: "100%",
                  borderTop: "1px solid rgba(100 100 100/ 50%)",
                  paddingTop: "1rem",
                }}
              >
                <div
                  style={{
                    height: "",
                    border: "",
                    width: "100%",
                    display: "flex",
                    gap: "0.5rem",
                    flexFlow: "column",
                  }}
                >
                  <Directive
                    icon={<LineChart width={"1.25rem"} color="dodgerblue" />}
                    titleSize="0.8rem"
                    height="2.25rem"
                    title="Day off(s)"
                    tag={props.bottomTagValue}
                    onClick={props.onBottomTagClick}
                    status
                    loading={props.bottomValueLoading}
                  />

                  <Directive
                    titleSize="0.8rem"
                    height="2.25rem"
                    title="Remarks"
                    status
                    tag={props.remarksValue}
                    onClick={props.remarksOnClick}
                  />

                  {props.renumeration && (
                    <Accordion
                      type="single"
                      collapsible
                      style={{ borderBottom: "none" }}
                    >
                      <AccordionItem value="item-1">
                        <AccordionTrigger
                          style={{
                            border: "",
                            display: "flex",
                            justifyContent: "space-between",
                            height: "2.5rem",
                            paddingLeft: "0.75rem",
                            fontWeight: "400",
                            fontSize: "0.9rem",
                            background: "none",
                            paddingBottom: "1rem",
                          }}
                        >
                          Renumeration
                        </AccordionTrigger>
                        <AccordionContent>
                          <div
                            style={{
                              height: "2.5rem",
                              border: "",
                              width: "100%",
                              display: "flex",
                              gap: "0.5rem",
                              paddingTop: "0.5rem",
                            }}
                          >
                            <div
                              onClick={props.tag3OnClick}
                              style={{
                                background: "rgba(100 100 100/ 15%)",
                                fontSize: "0.75rem",
                                display: "flex",
                                alignItems: "center",
                                paddingRight: "0.75rem",
                                paddingLeft: "0.75rem",
                                borderRadius: "0.5rem",
                                gap: "0.45rem",
                                flex: 1,
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                            >
                              <p style={{}}>Basic</p>
                              {/* <b>{props.tag3Text}</b> */}
                            </div>

                            <div
                              onClick={props.tag4OnClick}
                              style={{
                                background: "rgba(100 100 100/ 15%)",
                                fontSize: "0.75rem",
                                display: "flex",
                                alignItems: "center",
                                paddingRight: "0.75rem",
                                paddingLeft: "0.75rem",
                                borderRadius: "0.5rem",
                                gap: "0.45rem",
                                flex: 1,
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                            >
                              <p style={{}}>Allowance</p>
                              <b style={{ fontSize: "0.8rem" }}>
                                {/* {props.tag4Text} */}
                              </b>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </div>
              </div>
            ) : null}

            {props.progress ? (
              <div
                style={{
                  display: "flex",
                  flexFlow: "column",
                  gap: "0.25rem",
                  width: "100%",
                }}
              >
                <p style={{ fontSize: "0.7rem", opacity: 0.5 }}>
                  {props.progressItem}
                </p>

                <div
                  style={{
                    width: "100%",
                    height: "0.25rem",
                    background: "rgba(100 100 100/ 20%)",
                    borderRadius: "0.5rem",
                    display: "flex",
                    flexFlow: "column",
                  }}
                >
                  <div
                    style={{
                      background: "brown",
                      width: props.progress,
                      height: "0.25rem",
                      borderRadius: "0.5rem",
                    }}
                  ></div>
                </div>
              </div>
            ) : null}
        
          <DialogDescription style={{ display: "none" }} />

          <DialogFooter>
            <div
              style={{
                display: "flex",
                flexFlow: "column",
                width: "100%",
                gap: "0.5rem",
              }}
            >
              {props.footerExtra ? props.footerExtra : null}
              {props.close ? (
                <button
                  onClick={props.onCancel}
                  style={{ width: "100%", fontSize: "0.9rem" }}
                >
                  {props.back ? (
                    <>
                      <ChevronLeft color="dodgerblue" width={"1rem"} />
                      <p>Back</p>
                    </>
                  ) : (
                    <>
                      <X width="1rem" color="crimson" />
                      <p>Close</p>
                    </>
                  )}
                </button>
              ) : (
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    gap: "0.5rem",
                    justifyContent: "center",
                  }}
                >
                  <Button
                    className={props.disabled ? "disabled" : ""}
                    variant={props.destructive ? "destructive" : "default"}
                    id="okBtn"
                    onClick={props.updating ? null : props.onOk}
                    style={{ flex: 1 }}
                  >
                    {props.sendmail ? (
                      <a
                        href="mailto:Gokul.nathiel2305@gmail.com"
                        target="_blank"
                        rel="noopener noreferer"
                      >
                        {props.OkButtonText}
                      </a>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                        }}
                      >
                        {props.updating ? <LoadingOutlined /> : null}

                        {props.OkButtonText}
                      </div>
                    )}
                  </Button>

                  <Button
                    className={props.updating ? "disabled" : ""}
                    variant={"ghost"}
                    id="cancelBtn"
                    onClick={props.updating ? null : props.onCancel}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
