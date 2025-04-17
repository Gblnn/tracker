import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Download, PenLine, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "./ui/dropdown-menu";

interface Props {
  trigger?: any;
  onDelete?: any;
  onEdit?: any;
  onExtra?: any;
  className?: any;
  extraText?: string;
}

export default function DropDown(props: Props) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuPrimitive.Trigger
          className={props.className}
          style={{ outline: "none" }}
        >
          {props.trigger}
        </DropdownMenuPrimitive.Trigger>

        <DropdownMenuContent
          style={{ margin: "0.25rem", marginRight: "1.25rem" }}
        >
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={props.onEdit} style={{ width: "100%" }}>
              <PenLine className="mr-2 h-4 w-4" />
              <span style={{ width: "100%" }}>Edit</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={props.onDelete}>
              <X className="mr-2 h-4 w-4" />
              <span style={{ width: "100%" }}>Delete</span>
            </DropdownMenuItem>

            {props.onExtra && (
              <DropdownMenuItem onClick={props.onExtra}>
                <Download className="mr-2 h-4 w-4" />
                <span style={{ width: "100%" }}>{props.extraText}</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
