import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown } from "lucide-react";

interface Props {
  value?: string;
  icon?: any;
  onChange?: any;
  placeholder?: string;
  title?: string;
}

export default function IOMenu(props: Props) {
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
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {props.icon}
          <p
            style={{
              fontSize: "0.65rem",
              position: "absolute",
              marginLeft: "2rem ",
              opacity: "0.5",
              textTransform: "uppercase",
              fontWeight: "600",
            }}
          >
            {props.title}
          </p>
        </div>

        <SelectValue placeholder={props.placeholder} />
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
            value="true"
          >
            Allowed
          </SelectItem>

          <SelectItem
            style={{ display: "flex", justifyContent: "flex-start" }}
            value="false"
          >
            Denied
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
