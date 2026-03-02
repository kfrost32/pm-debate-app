import { Textarea } from "./ui/textarea";

interface PrdPanelProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

export function PrdPanel({ value, onChange, disabled }: PrdPanelProps) {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-5 py-4 border-b bg-card/50 backdrop-blur-sm">
        <h2 className="text-sm font-semibold text-foreground">PRD Document</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Enter your Product Requirements Document below
        </p>
      </div>
      <div className="flex-1 p-5">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Paste your PRD here in markdown format..."
          className="w-full h-full resize-none font-mono text-sm shadow-subtle"
        />
      </div>
    </div>
  );
}
