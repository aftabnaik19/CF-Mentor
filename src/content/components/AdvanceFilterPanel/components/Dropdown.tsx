import React, { useRef, useEffect } from "react";
import { styles } from "../styles";

interface DropdownProps {
  title: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedCount: number;
  hoverState: Record<string, boolean>;
  handleMouseEnter: (key: string) => void;
  handleMouseLeave: (key: string) => void;
  children: React.ReactNode;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onEnter?: () => void;
  onClear?: () => void;
}

export const Dropdown: React.FC<DropdownProps> = ({
  title,
  isOpen,
  setIsOpen,
  selectedCount,
  hoverState,
  handleMouseEnter,
  handleMouseLeave,
  children,
  searchable = false,
  searchValue,
  onSearchChange,
  onEnter,
  onClear,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Use composedPath() to handle Shadow DOM event retargeting
      const path = event.composedPath();
      if (
        dropdownRef.current &&
        !path.includes(dropdownRef.current)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  return (
    <div style={styles.spaceY2} ref={dropdownRef}>
      <label style={styles.label}>{title}</label>
      <div style={styles.dropdown}>
        <div
          style={{
            ...styles.btn,
            width: "100%",
            justifyContent: "space-between",
            ...(hoverState[`${title}Btn`] && styles.btnHover),
            cursor: searchable ? "text" : "pointer",
          }}
          onMouseEnter={() => handleMouseEnter(`${title}Btn`)}
          onMouseLeave={() => handleMouseLeave(`${title}Btn`)}
          onClick={() => {
            if (!searchable) setIsOpen(!isOpen);
            else if (!isOpen) setIsOpen(true);
          }}
        >
          {searchable ? (
            <input
              type="text"
              value={searchValue || ""}
              onChange={(e) => {
                onSearchChange?.(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onEnter?.();
                }
              }}
              placeholder={
                selectedCount > 0
                  ? `${selectedCount} selected`
                  : `Select ${title.toLowerCase()}`
              }
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                flex: 1,
                minWidth: 0,
                fontSize: "inherit",
                fontWeight: "inherit",
                color: "inherit",
                cursor: "text",
              }}
              onFocus={() => setIsOpen(true)}
            />
          ) : (
            <span style={{ flex: 1, textAlign: "left" }}>
              {selectedCount > 0
                ? `${selectedCount} item${selectedCount > 1 ? "s" : ""} selected`
                : `Select ${title.toLowerCase()}`}
            </span>
          )}
          
          <div style={{ display: "flex", alignItems: "center" }}>
            {selectedCount > 0 && onClear && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "1.5rem",
                  height: "1.5rem",
                  cursor: "pointer",
                  color: "#9ca3af",
                  borderRadius: "50%",
                  marginRight: "0.25rem",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
                title="Clear selection"
              >
                <svg
                  style={{ width: "1rem", height: "1rem" }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            )}
            <svg
              style={{
                ...styles.icon,
                width: "1rem",
                height: "1rem",
                transition: "transform 0.2s",
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                marginLeft: "0.5rem",
                cursor: "pointer",
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
            >
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </div>
        </div>
        {isOpen && <div style={styles.dropdownContent}>{children}</div>}
      </div>
    </div>
  );
};
