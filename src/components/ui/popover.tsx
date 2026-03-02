import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";

interface PopoverProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
}

export function Popover({
  children,
  trigger,
  open: controlledOpen,
  onOpenChange,
  align = "end",
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0, width: 0 });
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  React.useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, setIsOpen]);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-block"
      >
        {trigger}
      </div>
      {isOpen && createPortal(
        <div
          ref={popoverRef}
          className={cn(
            "fixed z-[100] mt-2 min-w-[280px] rounded-lg border bg-card p-4 shadow-elevated",
          )}
          style={{
            top: `${position.top}px`,
            left: align === "start" ? `${position.left}px` :
                  align === "center" ? `${position.left + position.width / 2}px` :
                  `${position.left + position.width}px`,
            transform: align === "center" ? "translateX(-50%)" :
                      align === "end" ? "translateX(-100%)" :
                      "none",
          }}
        >
          {children}
        </div>,
        document.body
      )}
    </>
  );
}
