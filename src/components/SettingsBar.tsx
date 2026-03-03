import { Eye, EyeOff, Key, Repeat, Layers, Users, Play, StopCircle, RotateCcw } from "lucide-react";
import { useState } from "react";
import { AGENTS, type DepthLevel } from "../lib/agents";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Popover } from "./ui/popover";
import { ApiKeyWarning } from "./ApiKeyWarning";
import { CostEstimator } from "./CostEstimator";

interface SettingsBarProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
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
  prdLength?: number;
}

const DEPTH_DESCRIPTIONS: Record<DepthLevel, string> = {
  brief: "100-150 words per response. Quick, focused feedback on critical issues.",
  moderate: "200-350 words per response. Balanced analysis with key concerns.",
  detailed: "400-600 words per response. Comprehensive, in-depth evaluation.",
};

export function SettingsBar({
  apiKey,
  onApiKeyChange,
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
  prdLength = 0,
}: SettingsBarProps) {
  const [showApiKey, setShowApiKey] = useState(false);

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
                className="shadow-subtle"
              >
                <Key className="h-4 w-4 mr-2" />
                API Key
              </Button>
            }
            align="start"
          >
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">API Key</h3>
                <p className="text-xs text-muted-foreground">
                  Enter your Anthropic API key
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => onApiKeyChange(e.target.value)}
                  placeholder="sk-ant-..."
                  disabled={disabled}
                  className="font-mono text-sm"
                />
                <Button
                  onClick={() => setShowApiKey(!showApiKey)}
                  variant="ghost"
                  size="icon"
                  type="button"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {apiKey && <ApiKeyWarning />}
            </div>
          </Popover>

          <div className="h-4 w-px bg-border" />

          <Popover
            trigger={
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={disabled}
                className="shadow-subtle"
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
                className="shadow-subtle"
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
                {(["brief", "moderate", "detailed"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => onDepthChange(level)}
                    disabled={disabled}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      depth === level
                        ? "border-primary bg-primary/5 shadow-subtle"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </span>
                      {depth === level && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
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
                className="shadow-subtle"
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
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-subtle"
                          : "border-border hover:border-primary/50 hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-lg ${agent.color} shadow-soft`}
                        >
                          {agent.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="text-sm font-semibold text-foreground">
                                {agent.name}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {agent.title}
                              </span>
                            </div>
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
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
          </div>

          <div className="flex items-center gap-3">
            {!isRunning && prdLength > 0 && (
              <CostEstimator
                prdLength={prdLength}
                rounds={rounds}
                agentCount={selectedAgents.length}
                depth={depth}
              />
            )}
            {!isRunning && prdLength > 0 && (
              <Button
                onClick={onClear}
                variant="outline"
                size="sm"
                disabled={disabled}
                className="shadow-subtle"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            {isRunning ? (
              <Button
                onClick={onStop}
                variant="destructive"
                className="shadow-subtle"
              >
                <StopCircle className="mr-2 h-4 w-4" />
                Stop Debate
              </Button>
            ) : (
              <Button
                onClick={onStart}
                disabled={!canStart || disabled}
                className="shadow-subtle"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Debate
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
