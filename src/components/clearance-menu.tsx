import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, KeyRound } from "lucide-react";

interface Props {
  value?: string;
  onChange?: any;
}

export default function ClearanceMenu(props: Props) {
  return (
    <Select defaultValue={props.value} onValueChange={props.onChange}>
      <SelectTrigger
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
        }}
        className=""
      >
        <KeyRound color="dodgerblue" width={"1.25rem"} />
        <SelectValue placeholder="Clearance" />
        <ChevronDown width={"1rem"} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup
          style={{
            display: "flex",
            justifyContent: "flex-start",
            flexFlow: "column",
          }}
        >
          <SelectItem
            style={{ display: "flex", justifyContent: "flex-start" }}
            value="All"
          >
            All
          </SelectItem>

          <SelectItem
            style={{ display: "flex", justifyContent: "flex-start" }}
            value="Sohar Star United"
          >
            Sohar Star United
          </SelectItem>
          <SelectItem
            style={{ display: "flex", justifyContent: "flex-start" }}
            value="Vale"
          >
            Vale
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
