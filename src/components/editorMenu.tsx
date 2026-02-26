import ChevronSelect from "./chevron-select";

interface Props {
  value?: string;
  icon?: any;
  onChange?: any;
  placeholder?: string;
  title?: string;
}

const IO_OPTIONS = [
  { value: 'true', label: 'Allowed' },
  { value: 'false', label: 'Denied' }
];

export default function IOMenu(props: Props) {
  return (
    <ChevronSelect
      title={props.title || "Option"}
      icon={props.icon}
      options={IO_OPTIONS}
      value={props.value}
      onChange={props.onChange}
      placeholder={props.placeholder || "Select option"}
    />
  );
}
