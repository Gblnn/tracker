import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, UserCircle } from "lucide-react";

interface Props {
  value?: string;
  onChange?: any;
}

export default function SelectMenu(props: Props) {
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
        <UserCircle color="dodgerblue" width={"1.25rem"} />
        <SelectValue placeholder="Role" />
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
            value="admin"
          >
            Admin
          </SelectItem>
          <SelectItem
            style={{ display: "flex", justifyContent: "flex-start" }}
            value="user"
          >
            User
          </SelectItem>

          <SelectItem
            style={{ display: "flex", justifyContent: "flex-start" }}
            value="profile"
          >
            Profile
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
