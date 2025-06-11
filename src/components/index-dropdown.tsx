import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import {
  Bug,
  EllipsisVerticalIcon,
  LogOut,
  RefreshCcw,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import DefaultDialog from "./ui/default-dialog";
import { useState } from "react";
import { auth } from "@/firebase";
import emailjs from "@emailjs/browser";
import moment from "moment";
import { message } from "antd";

interface Props {
  trigger?: any;
  onExport?: any;
  onAccess?: any;
  onArchives?: any;
  onUpload?: any;
  onInbox?: any;
  className?: any;
  onLogout?: any;
  onProfile?: any;
}

export default function IndexDropDown(props: Props) {
  const [issue, setIssue] = useState("");
  const [loading, setLoading] = useState(false);
  const [bugDialog, setBugDialog] = useState(false);

  const serviceId = "service_fixajl8";
  const templateId = "template_0f3zy3e";

  const sendBugReport = async () => {
    setLoading(true);
    await emailjs.send(serviceId, templateId, {
      name: auth.currentUser?.email,
      subject:
        "Bug Report - " +
        moment().format("ll") +
        " from " +
        auth.currentUser?.email,
      recipient: "it@soharstar.com",
      message: issue,
    });
    setLoading(false);
    message.success("Bug Report sent");
    setBugDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuPrimitive.Trigger
          className={props.className}
          style={{ outline: "none" }}
        >
          <EllipsisVerticalIcon width={"1.1rem"} />
        </DropdownMenuPrimitive.Trigger>

        <DropdownMenuContent
          style={{ margin: "0.25rem", marginRight: "1.25rem" }}
        >
          <DropdownMenuGroup>
            {/* <DropdownMenuItem
              onClick={props.onExport}
              style={{ width: "100%" }}
            >
              <DownloadCloud className="mr-2" color="lightgreen" />
              <span style={{ width: "100%" }}>Export xlsx</span>
            </DropdownMenuItem> */}

            {/* <DropdownMenuItem
              onClick={props.onUpload}
              style={{ width: "100%" }}
            >
              <UploadCloud className="mr-2" color="salmon" />
              <span style={{ width: "100%" }}>Upload xlsx</span>
            </DropdownMenuItem> */}

            {/* <DropdownMenuItem
              onClick={props.onAccess}
              style={{ width: "100%" }}
            >
              <KeyRound className="mr-2 " color="dodgerblue" />
              <span style={{ width: "100%" }}>Access Control</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={props.onArchives}
              style={{ width: "100%" }}
            >
              <Archive className="mr-2 " color="goldenrod" />
              <span style={{ width: "100%" }}>Archives</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={props.onInbox} style={{ width: "100%" }}>
              <Inbox className="mr-2 " color="crimson" />
              <span style={{ width: "100%" }}>Inbox</span>
            </DropdownMenuItem> */}

            <DropdownMenuItem
              onClick={() => window.location.reload()}
              style={{ width: "100%" }}
            >
              <RefreshCcw className="mr-2 " color="dodgerblue" />
              <span style={{ width: "100%" }}>Force Reload</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setBugDialog(true)}
              style={{ width: "100%" }}
            >
              <Bug className="mr-2 " color="lightgreen" />
              <span style={{ width: "100%" }}>Report Bug</span>
            </DropdownMenuItem>

            {props.onProfile && (
              <DropdownMenuItem onClick={props.onProfile}>
                <User className="mr-2" color="dodgerblue" />
                <span style={{ width: "100%" }}>Profile</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={props.onLogout}
              style={{ width: "100%" }}
            >
              <LogOut className="mr-2 " color="salmon" />
              <span style={{ width: "100%" }}>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DefaultDialog
        title={"Report a Bug"}
        titleIcon={<Bug color="lightgreen" />}
        extra={
          <div
            style={{
              display: "flex",
              width: "100%",
              flexFlow: "column",
              gap: "0.75rem",
              paddingBottom: "0.5rem",
            }}
          >
            <textarea
              onChange={(e) => setIssue(e.target.value)}
              rows={5}
              placeholder="Describe issue"
            />
          </div>
        }
        open={bugDialog}
        onCancel={() => setBugDialog(false)}
        OkButtonText="Report"
        disabled={issue == ""}
        onOk={() => {
          issue != "" ? sendBugReport() : "";
        }}
        updating={loading}
      />
    </>
  );
}
