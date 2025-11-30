import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface ShadcnMultiSelectProps {
  options: Option[];
  selectedValues: string[];
  onChange: (value: string) => void; // Toggle single value
  placeholder: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  className?: string;
}

export const ShadcnMultiSelect: React.FC<ShadcnMultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder,
  isOpen,
  onToggle,
  onClose,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset search when closed
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={handleToggle}
        style={{
          display: "flex",
          height: "2.5rem", // h-10
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: "0.375rem", // rounded-md
          border: "1px solid #e2e8f0", // border-input
          backgroundColor: "white", // bg-background
          paddingLeft: "0.75rem", // px-3
          paddingRight: "0.75rem", // px-3
          paddingTop: "0.5rem", // py-2
          paddingBottom: "0.5rem", // py-2
          fontSize: "0.875rem", // text-sm
          lineHeight: "1.25rem",
          color: selectedValues.length > 0 ? "#0f172a" : "#64748b", // text-foreground vs placeholder
          cursor: "pointer",
          outline: "none",
          boxSizing: "border-box",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedValues.length > 0
            ? `${selectedValues.length} selected`
            : placeholder}
        </span>
        <ChevronDown style={{ height: "1rem", width: "1rem", opacity: 0.5 }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 0.25rem)",
            zIndex: 50,
            width: "100%",
            minWidth: "8rem",
            overflow: "hidden",
            borderRadius: "0.375rem",
            border: "1px solid #e2e8f0",
            backgroundColor: "white",
            color: "#0f172a",
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            boxSizing: "border-box",
          }}
        >
          <div style={{ padding: "0.25rem", borderBottom: "1px solid #e2e8f0" }}>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking input
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                fontSize: "0.875rem",
                padding: "0.25rem 0.5rem",
                backgroundColor: "transparent",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ maxHeight: "15rem", overflowY: "auto", padding: "0.25rem" }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: "0.5rem", fontSize: "0.875rem", color: "#64748b", textAlign: "center" }}>
                No results found.
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(option.value);
                    }}
                    style={{
                      position: "relative",
                      display: "flex",
                      cursor: "pointer",
                      userSelect: "none",
                      alignItems: "center",
                      borderRadius: "0.125rem",
                      padding: "0.375rem 0.5rem 0.375rem 2rem",
                      fontSize: "0.875rem",
                      outline: "none",
                      backgroundColor: isSelected ? "#f1f5f9" : "transparent",
                      color: "#0f172a",
                      boxSizing: "border-box",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f1f5f9";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isSelected ? "#f1f5f9" : "transparent";
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: "0.5rem",
                        display: "flex",
                        height: "0.875rem",
                        width: "0.875rem",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: isSelected ? 1 : 0,
                      }}
                    >
                      <Check style={{ height: "1rem", width: "1rem" }} />
                    </span>
                    <span>{option.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
