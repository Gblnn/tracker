import { useState, useEffect, ReactNode, CSSProperties } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  hideHeader?: boolean;
  contentStyle?: CSSProperties;
}

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  hideHeader = false,
  contentStyle,
}: ResponsiveModalProps) {
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const mobileContentStyle: CSSProperties = {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    maxHeight: "90vh",
    padding: "0",
    gap: "0",
    ...contentStyle,
  };

  const mobileBodyStyle: CSSProperties = {
    width: "100%",
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
    overflowY: "auto",
  };

  const desktopContentStyle: CSSProperties = {
    width: "100%",
    maxWidth: "650px",
    maxHeight: "85vh",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    ...(hideHeader ? { padding: "0", gap: "0" } : { padding: "2rem" }),
    ...contentStyle,
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent style={mobileContentStyle}>
          {!hideHeader && (title || description) && (
            <div style={{ padding: "0.5rem 1rem", textAlign: "left", width: "100%", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              {title && <DrawerTitle style={{ padding: "0.5rem 0", fontWeight:"500" }}>{title}</DrawerTitle>}
              {description && <DrawerDescription style={{ padding: "0.5rem 0" }}>{description}</DrawerDescription>}
            </div>
          )}
          <div style={mobileBodyStyle}>
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={hideHeader ? "p-0" : ""} style={desktopContentStyle}>
        {!hideHeader && (title || description) && (
          <DialogHeader style={{ paddingBottom: "0.5rem" }}>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}
