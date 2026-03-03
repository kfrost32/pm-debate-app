import { Textarea } from "./ui/textarea";

interface PrdPanelProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

export function PrdPanel({ value, onChange, disabled }: PrdPanelProps) {
  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-5 py-4 border-b bg-card/50 backdrop-blur-sm">
        <h2 className="text-sm font-semibold text-foreground">PRD Document</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Enter your Product Requirements Document below
        </p>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Paste your PRD here in markdown format..."
        className="flex-1 w-full resize-none font-mono text-sm border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 p-5"
      />
    </div>
  );
}
