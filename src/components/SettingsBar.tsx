import { Repeat, Layers, Users, Play, StopCircle, RotateCcw } from "lucide-react";
import { AGENTS, type DepthLevel } from "../lib/agents";
import { Button } from "./ui/button";
import { Popover } from "./ui/popover";

interface SettingsBarProps {
  rounds: number;
  onRoundsChange: (rounds: number) => void;
  depth: DepthLevel;
  onDepthChange: (depth: DepthLevel) => void;
  selectedAgents: string[];
  onAgentsChange: (agents: string[]) => void;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  disabled: boolean;
  canStart: boolean;
  isRunning: boolean;
  onShowAbout: () => void;
  hasCompletedDebate?: boolean;
}

const DEPTH_DESCRIPTIONS: Record<DepthLevel, string> = {
  brief: "100-150 words per response. Quick, focused feedback on critical issues.",
  moderate: "200-350 words per response. Balanced analysis with key concerns.",
};

export function SettingsBar({
  rounds,
  onRoundsChange,
  depth,
  onDepthChange,
  selectedAgents,
  onAgentsChange,
  onStart,
  onStop,
  onClear,
  disabled,
  canStart,
  isRunning,
  onShowAbout,
  hasCompletedDebate = false,
}: SettingsBarProps) {

  const toggleAgent = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      if (selectedAgents.length > 1) {
        onAgentsChange(selectedAgents.filter((id) => id !== agentId));
      }
    } else {
      if (selectedAgents.length < 4) {
        onAgentsChange([...selectedAgents, agentId]);
      }
    }
  };

  return (
    <div className="sticky top-0 z-20 border-b bg-card/50 backdrop-blur-sm">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Popover
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={disabled}
                >
                  <Repeat className="h-4 w-4 mr-2" />
                  {rounds} {rounds === 1 ? "Round" : "Rounds"}
                </Button>
              }
              align="start"
            >
              <div className="space-y-3 min-w-[280px]">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Debate Rounds</h3>
                  <p className="text-xs text-muted-foreground">
                    How many rounds of discussion between agents
                  </p>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Button
                      key={num}
                      onClick={() => onRoundsChange(num)}
                      disabled={disabled}
                      variant={rounds === num ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
            </Popover>

            <Popover
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={disabled}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  {depth.charAt(0).toUpperCase() + depth.slice(1)}
                </Button>
              }
              align="start"
            >
              <div className="space-y-3 w-[360px]">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Response Depth</h3>
                  <p className="text-xs text-muted-foreground">
                    How thorough each agent's response should be
                  </p>
                </div>
                <div className="space-y-2">
                  {(["brief", "moderate"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => onDepthChange(level)}
                      disabled={disabled}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        depth === level
                          ? "bg-primary/5"
                          : "hover:bg-accent"
                      }`}
                    >
                      <div className="mb-1">
                        <span className="text-sm font-medium">
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {DEPTH_DESCRIPTIONS[level]}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </Popover>

            <Popover
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={disabled}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {selectedAgents.length} {selectedAgents.length === 1 ? "Agent" : "Agents"}
                </Button>
              }
              align="start"
            >
            <div className="space-y-3 min-w-[480px] max-w-[520px]">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Select Agents</h3>
                <p className="text-xs text-muted-foreground">
                  Choose 1-4 PM perspectives to evaluate your PRD
                </p>
              </div>
              <div className="space-y-2">
                {Object.values(AGENTS).map((agent) => {
                  const isSelected = selectedAgents.includes(agent.id);
                  return (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgent(agent.id)}
                      disabled={disabled}
                      className={`group w-full text-left p-3 rounded-lg transition-all ${
                        isSelected
                          ? "bg-primary/5"
                          : "hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-lg shadow-soft transition-transform duration-200 ${agent.color} ${
                            isSelected ? "scale-105" : "group-hover:scale-105"
                          }`}
                        >
                          {agent.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <div>
                              <span className="text-sm font-semibold text-foreground">
                                {agent.name}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {agent.title}
                              </span>
                            </div>
                            {isSelected && (
                              <svg className="w-4 h-4 text-primary/60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {agent.focus}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Popover>

            {isRunning ? (
              <Button
                onClick={onStop}
                variant="destructive"
                size="sm"
              >
                <StopCircle className="mr-2 h-4 w-4" />
                Stop Debate
              </Button>
            ) : (
              <Button
                onClick={onStart}
                disabled={!canStart || disabled}
                size="sm"
              >
                <Play className="mr-2 h-4 w-4" />
                {hasCompletedDebate ? "Start New Debate" : "Start Debate"}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isRunning && hasCompletedDebate && (
              <Button
                onClick={onClear}
                variant="outline"
                size="sm"
                disabled={disabled}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                New Debate
              </Button>
            )}
            <button
              onClick={onShowAbout}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
