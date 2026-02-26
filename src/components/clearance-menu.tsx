import { KeyRound } from "lucide-react";
import ChevronSelect from "./chevron-select";

interface Props {
  value?: string;
  onChange?: any;
}

const CLEARANCE_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'none', label: 'None' },
  { value: 'Sohar Star United', label: 'Sohar Star United' },
  { value: 'Vale', label: 'Vale' }
];

export default function ClearanceMenu(props: Props) {
  return (
    <ChevronSelect
      title="Clearance"
      icon={<KeyRound color="dodgerblue" width="1.125rem" height="1.125rem" />}
      options={CLEARANCE_OPTIONS}
      value={props.value}
      onChange={props.onChange}
      placeholder="Select clearance"
    />
  );
}
