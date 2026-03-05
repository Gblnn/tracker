import React, { useRef, useEffect } from "react";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { motion } from "framer-motion";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter text...",
  minHeight = "150px",
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const formatButton = (
    icon: React.ReactNode,
    command: string,
    title: string,
    value?: string
  ) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      type="button"
      onClick={(e) => {
        e.preventDefault();
        execCommand(command, value);
      }}
      title={title}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.4rem 0.6rem",
        background: "rgba(100, 100, 100, 0.05)",
        border: "",
        borderRadius: "0.3rem",
        cursor: "pointer",
        color: "mediumslateblue",
        transition: "background 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(147, 112, 219, 0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(100, 100, 100, 0.1)";
      }}
    >
      {icon}
    </motion.button>
  );

  return (
    <div
      style={{
        width: "100%",
        border: "1px solid rgba(100, 100, 100, 0.2)",
        borderRadius: "0.5rem",
        overflow: "hidden",
        background: "rgba(255, 255, 255, 0.05)",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          border:"",
          display: "flex",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          borderBottom: "1px solid rgba(100, 100, 100, 0.2)",
          background: "rgba(100, 100, 100, 0.05)",
          flexWrap: "wrap",
        }}
      >
        {formatButton(<Bold width={16} />, "bold", "Bold (Ctrl+B)")}
        {formatButton(<Italic width={16} />, "italic", "Italic (Ctrl+I)")}
        {formatButton(<List width={16} />, "insertUnorderedList", "Bullet List")}
        {formatButton(<ListOrdered width={16} />, "insertOrderedList", "Numbered List")}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        suppressContentEditableWarning
        style={{
          padding: "0.75rem",
          minHeight,
          outline: "none",
          fontSize: "0.95rem",
          lineHeight: "1.6",
          cursor: "text",
          overflowY: "auto",
          maxHeight: "400px",
        }}
        data-placeholder={placeholder}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #999;
          pointer-events: none;
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
  );
};
