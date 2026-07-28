import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

export default function ReleaseNote() {
  return (
    <Accordion
      type="single"
      collapsible
      style={{
        borderBottom: "none",
        position: "absolute",
        bottom: 0,
        paddingLeft: "0.5rem",
        zIndex: 50
      }}
    >
      <AccordionItem value="item-1">
        <AccordionTrigger
          style={{
            border: "",
            display: "flex",
            justifyContent: "space-between",
            height: "2.5rem",
            paddingLeft: "0.75rem",
            fontWeight: "400",
            fontSize: "0.9rem",
            background: "none",
            paddingBottom: "1.5rem",
            textDecoration: "none",
          }}
        >
          Release Notes v1.82
        </AccordionTrigger>
        <AccordionContent>
          <div
            style={{
              border: "",
              paddingLeft: "2rem",
              paddingTop: "0.25rem",
              paddingBottom: "1rem",
              opacity: 0.75,
            }}
          >
            <ul style={{ listStyle: "disc" }}>
              <li>Added silent background database synchronization using explicit realtime listeners</li>
              <li>Fixed focal point employee project visibility visibility bugs</li>
              <li>Implemented read-only plain-text table display in Approver mode</li>
              <li>Enforced manual remark validation for incomplete biometric punch logs</li>
              <li>Restricted 'No Device' automatic remark defaulting to non-device projects only</li>
              <li>Cleaned up timesheet actions: removed 'Allocate Punch Time' and bracketed device details</li>
              <li>Replaced the status dropdown with plain text for records having at least 1 machine logged punch</li>
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="item-2">
        <AccordionTrigger
          style={{
            border: "",
            display: "flex",
            justifyContent: "space-between",
            height: "2.5rem",
            paddingLeft: "0.75rem",
            fontWeight: "400",
            fontSize: "0.9rem",
            background: "none",
            paddingBottom: "1.5rem",
            textDecoration: "none",
          }}
        >
          Release Notes v2.0
        </AccordionTrigger>
        <AccordionContent>
          <div
            style={{
              border: "",
              paddingLeft: "2rem",
              paddingTop: "0.25rem",
              paddingBottom: "1rem",
              opacity: 0.75,
            }}
          >
            <ul style={{ listStyle: "disc" }}>
              <li>
                Added role based login system to give restricted access to
                non-admin users
              </li>
              <li>Edit Mode restricted to admins</li>
              <li>Added Profile section </li>
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
