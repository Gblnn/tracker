import React, { useRef, useEffect, useState } from "react";
import { Bold, ClipboardList, Italic, List, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  showPasteStyleToggle?: boolean;
  hideToolbar?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter text...",
  minHeight = "150px",
  showPasteStyleToggle = false,
  hideToolbar = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [preservePasteStyle, setPreservePasteStyle] = useState(true);
  const [activeCommands, setActiveCommands] = useState<Record<string, boolean>>({});
  const appFontFamily = "ClashGrotesk-Variable, system-ui, -apple-system, sans-serif";

  const updateActiveCommands = () => {
    setActiveCommands({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
    });
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (preservePasteStyle) {
      e.preventDefault();
      const html = e.clipboardData.getData("text/html") || e.clipboardData.getData("text/plain");
      // Parse pasted markup and normalize font family/size while retaining other formatting.
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      doc.body.querySelectorAll<HTMLElement>("*").forEach((el) => {
        el.style.fontFamily = appFontFamily;
        el.style.fontSize = "10pt";
      });

      if (!doc.body.children.length && doc.body.textContent?.trim()) {
        const span = doc.createElement("span");
        span.style.fontFamily = appFontFamily;
        span.style.fontSize = "10pt";
        span.textContent = doc.body.textContent;
        doc.body.innerHTML = "";
        doc.body.appendChild(span);
      }

      document.execCommand("insertHTML", false, doc.body.innerHTML);
      requestAnimationFrame(() => { handleInput(); });
      return;
    }

    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    selection.deleteFromDocument();
    const range = selection.getRangeAt(0);
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
    updateActiveCommands();
  };

  const ToolbarButton = ({
    icon,
    command,
    title,
    value,
  }: {
    icon: React.ReactNode;
    command: string;
    title: string;
    value?: string;
  }) => {
    const isActive = !!activeCommands[command];
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-md transition-colors",
              isActive
                ? "bg-[#00008b] text-white font-semibold hover:bg-[#00007a] hover:!text-white focus-visible:!text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand(command, value);
            }}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {title}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="w-full rounded-md border border-input bg-background shadow-sm overflow-hidden transition-shadow">
        {/* Toolbar */}
        {!hideToolbar && (
          <div className="flex gap-0.5 px-2 py-1.5 border-b border-border bg-muted/40 flex-nowrap overflow-x-auto">
            <ToolbarButton icon={<Bold size={14} />} command="bold" title="Bold (Ctrl+B)" />
            <ToolbarButton icon={<Italic size={14} />} command="italic" title="Italic (Ctrl+I)" />

            <Separator orientation="vertical" className="mx-1 h-5" />

            <ToolbarButton icon={<List size={14} />} command="insertUnorderedList" title="Bullet List" />
            <ToolbarButton icon={<ListOrdered size={14} />} command="insertOrderedList" title="Numbered List" />

            <Separator orientation="vertical" className="mx-1 h-5" />

            {/* Font size selector */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Select
                    onValueChange={(size) => {
                      if (size) execCommand("fontSize", size);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[90px] rounded-md text-xs border-input bg-background focus:ring-1">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">8 pt</SelectItem>
                      <SelectItem value="2">10 pt</SelectItem>
                      <SelectItem value="3">12 pt</SelectItem>
                      <SelectItem value="4">14 pt</SelectItem>
                      <SelectItem value="5">18 pt</SelectItem>
                      <SelectItem value="6">24 pt</SelectItem>
                      <SelectItem value="7">36 pt</SelectItem>
                    </SelectContent>
                  </Select>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Font Size</TooltipContent>
            </Tooltip>

            {showPasteStyleToggle && (
              <>
                <Separator orientation="vertical" className="mx-1 h-5" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 gap-1.5 px-2.5 text-xs font-medium rounded-md transition-colors",
                        preservePasteStyle
                          ? "bg-[#00008b] text-white font-semibold hover:bg-[#00007a] hover:!text-white focus-visible:!text-white"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setPreservePasteStyle((prev) => !prev);
                      }}
                    >
                      <ClipboardList size={13} />
                      
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {preservePasteStyle
                      ? "Paste original styling"
                      : "Paste plain text"}
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        )}

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={() => { handleInput(); updateActiveCommands(); }}
          onBlur={handleInput}
          onKeyUp={updateActiveCommands}
          onMouseUp={updateActiveCommands}
          onPaste={handlePaste}
          suppressContentEditableWarning
          style={{ minHeight, maxHeight: "400px", fontFamily: appFontFamily }}
          className="px-3 py-2 text-sm leading-relaxed outline-none overflow-y-auto cursor-text"
          data-placeholder={placeholder}
        />

        <style>{`
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: hsl(var(--muted-foreground));
            pointer-events: none;
          }
          [contenteditable],
          [contenteditable] * {
            font-family: ClashGrotesk-Variable, system-ui, -apple-system, sans-serif !important;
          }
          [contenteditable] ul {
            list-style-type: disc !important;
            list-style-position: outside !important;
            margin-left: 1.5rem;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
            padding-left: 0.5rem;
          }
          [contenteditable] ol {
            list-style-type: decimal !important;
            list-style-position: outside !important;
            margin-left: 1.5rem;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
            padding-left: 0.5rem;
          }
          [contenteditable] li {
            margin-bottom: 0.25rem;
            display: list-item !important;
            margin-left: 1rem;
          }
          [contenteditable] p {
            margin: 0.5rem 0;
          }
        `}</style>
      </div>
    </TooltipProvider>
  );
};
