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
              <li>Edit Mode restrticted to admins</li>
              <li>Added Profile section </li>
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
