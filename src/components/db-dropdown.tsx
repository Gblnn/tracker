import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Archive,
  DownloadCloud,
  Inbox,
  RefreshCcw,
  UploadCloud,
} from "lucide-react";

interface Props {
  trigger?: any;
  onExport?: any;
  onAccess?: any;
  onArchives?: any;
  onUpload?: any;
  onInbox?: any;
  className?: any;
  onExportExpiring: () => void;
  onImportExpiring: () => void;
  exportLoading?: boolean;
  importLoading?: boolean;
}

export default function DbDropDown(props: Props) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            style={{
              width: "2.5rem",
            }}
          >
            {props.trigger}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          style={{ margin: "0.25rem", marginRight: "1.25rem" }}
        >
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={props.onExport}
              style={{ width: "100%" }}
            >
              <DownloadCloud className="mr-2" color="lightgreen" />
              <span style={{ width: "100%" }}>Export xlsx</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={props.onUpload}
              style={{ width: "100%" }}
            >
              <UploadCloud className="mr-2" color="salmon" />
              <span style={{ width: "100%" }}>Upload xlsx</span>
            </DropdownMenuItem>

            {/* <DropdownMenuItem
              onClick={props.onAccess}
              style={{ width: "100%" }}
            >
              <KeyRound className="mr-2 " color="dodgerblue" />
              <span style={{ width: "100%" }}>Access Control</span>
            </DropdownMenuItem> */}

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
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => window.location.reload()}
              style={{ width: "100%" }}
            >
              <RefreshCcw className="mr-2 " color="dodgerblue" />
              <span style={{ width: "100%" }}>Force Reload</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
