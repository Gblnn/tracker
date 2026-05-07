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

  const hasHeaderContent = !hideHeader && Boolean(title || description);
  const useEdgeToEdgeContent = !hasHeaderContent;

  const mobileContentStyle: CSSProperties = {
    width: "100%",
    ...(useEdgeToEdgeContent ? { padding: 0, gap: 0 } : null),
    ...contentStyle,
  };

  const mobileBodyStyle: CSSProperties = {
    width: "100%",
    paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
  };

  const desktopContentStyle: CSSProperties = {
    ...(useEdgeToEdgeContent ? { padding: 0, gap: 0 } : { padding: "2rem" }),
    ...contentStyle,
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent style={mobileContentStyle}>
          {!hideHeader && (title || description) && (
            <div style={{ padding: "", border:"", textAlign:"left", width:"100%" }}>
              {title && <DrawerTitle style={{display:"flex", justifyContent:"center", width:"100%", border:"", padding:"0.5rem"}}>{title}</DrawerTitle>}
              {description && <DrawerDescription style={{padding:"1rem"}}> {description}</DrawerDescription>}
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
      <DialogContent style={desktopContentStyle}>
        {!hideHeader && (title || description) && (
          <DialogHeader style={{ paddingBottom: "0.5rem" }}>
            {title && <DialogTitle >{title}</DialogTitle>}
            {description && <DialogDescription >{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}
