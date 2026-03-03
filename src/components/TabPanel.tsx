import { X } from "lucide-react";
import { cn } from "../lib/utils";

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  closeable?: boolean;
  content: React.ReactNode;
}

interface TabPanelProps {
  tabs: Tab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
}

export function TabPanel({ tabs, activeTabId, onTabChange, onTabClose }: TabPanelProps) {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Tab Bar */}
      <div className="flex items-center border-b bg-card/50 backdrop-blur-sm overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "group flex items-center gap-2 px-4 py-2.5 border-r cursor-pointer select-none transition-colors min-w-[120px]",
              activeTabId === tab.id
                ? "bg-background text-foreground"
                : "bg-transparent text-muted-foreground hover:bg-muted/50"
            )}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon && <span className="text-sm">{tab.icon}</span>}
            <span className="text-sm font-medium truncate flex-1">{tab.label}</span>
            {tab.closeable && onTabClose && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className={cn(
                  "opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-0.5 transition-opacity",
                  activeTabId === tab.id && "opacity-100"
                )}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "h-full",
              activeTabId === tab.id ? "block" : "hidden"
            )}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
