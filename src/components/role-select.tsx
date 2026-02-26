import { UserCircle } from "lucide-react";
import ChevronSelect from "./chevron-select";

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
    <ChevronSelect
      title="Role"
      icon={<UserCircle color="dodgerblue" width="1.125rem" height="1.125rem" />}
      options={ROLE_OPTIONS}
      value={value}
      onChange={onChange}
      placeholder="Select Role"
    />
  );
}
