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
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            ...styles.btn,
            width: "100%",
            justifyContent: "space-between",
            ...(hoverState[`${title}Btn`] && styles.btnHover),
          }}
          onMouseEnter={() => handleMouseEnter(`${title}Btn`)}
          onMouseLeave={() => handleMouseLeave(`${title}Btn`)}
        >
          <span>
            {selectedCount > 0
              ? `${selectedCount} item${selectedCount > 1 ? "s" : ""} selected`
              : `Select ${title.toLowerCase()}`}
          </span>
          <svg
            style={{
              ...styles.icon,
              width: "1rem",
              height: "1rem",
              transition: "transform 0.2s",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </button>
        {isOpen && (
          <div style={styles.dropdownContent}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
};
