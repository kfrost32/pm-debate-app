import { useState } from "react";
import { cn } from "../lib/utils";

interface SplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

export function SplitView({ left, right }: SplitViewProps) {
  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;

    if (newLeftWidth > 20 && newLeftWidth < 80) {
      setLeftWidth(newLeftWidth);
    }
  };

  return (
    <div
      className="flex h-screen w-full bg-background"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="overflow-auto border-r"
        style={{ width: `${leftWidth}%` }}
      >
        {left}
      </div>

      <div
        className={cn(
          "w-px bg-border hover:bg-ring/30 cursor-col-resize transition-all hover:shadow-soft",
          isDragging && "bg-ring/40 w-0.5 shadow-soft"
        )}
        onMouseDown={handleMouseDown}
      />

      <div className="flex-1 overflow-auto">
        {right}
      </div>
    </div>
  );
}
