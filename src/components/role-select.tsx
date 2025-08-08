import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ChevronDown, UserCircle } from "lucide-react";

interface Props {
  value?: string;
  onChange?: (value: string) => void;
}

const ROLE_OPTIONS = [
  { value: 'profile', label: 'Profile' },
  { value: 'admin', label: 'Admin' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'site_coordinator', label: 'Site Coordinator' },
  { value: 'management', label: 'Management' }
];

// Component for selecting system roles (access control)
export default function RoleSelect({ value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
        }}
        className=""
      >
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <UserCircle color="dodgerblue" width={"1.25rem"} />
          <p style={{ fontSize: "0.85rem" }}>
            {value || "Select System Role"}
          </p>
        </div>
        <ChevronDown width={"1rem"} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {ROLE_OPTIONS.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
