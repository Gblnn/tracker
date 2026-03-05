import React, { useState, useRef, useEffect } from "react";

interface EditablePreviewFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
  className?: string;
  prefix?: string;
  suffix?: string;
  textTransform?: "uppercase" | "lowercase" | "capitalize" | "none";
}

export const EditablePreviewField: React.FC<EditablePreviewFieldProps> = ({
  value,
  onChange,
  placeholder = "",
  style = {},
  multiline = false,
  className = "",
  prefix = "",
  suffix = "",
  textTransform = "none",
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-adjust height based on content
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);

  const baseStyle: React.CSSProperties = {
    background: isFocused ? "rgba(147, 112, 219, 0.05)" : "transparent",
    border: isFocused ? "1px solid rgba(147, 112, 219, 0.3)" : "1px solid transparent",
    outline: "none",
    padding: "0.1rem 0.2rem",
    fontFamily: "inherit",
    fontSize: "inherit",
    fontWeight: "inherit",
    color: "inherit",
    textTransform: textTransform,
    transition: "all 0.2s ease",
    cursor: isFocused ? "text" : "pointer",
    width: "100%",
    boxSizing: "border-box",
    borderRadius: "0.2rem",
    ...style,
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <span style={{ display: "flex", width: "100%", alignItems: "center" }} className={className}>
      {prefix}
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={className}
        style={{
          ...baseStyle,
          resize: "none",
          overflow: "hidden",
          minHeight: multiline ? "3rem" : "1.5rem",
          whiteSpace: "pre-wrap",
        }}
        rows={1}
      />
      {suffix}
    </span>
  );
};
