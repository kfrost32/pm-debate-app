import { useEffect, useRef } from "react";
import { AgentMessage } from "./AgentMessage";
import { TypingIndicator } from "./TypingIndicator";
import { SynthesisPanel } from "./SynthesisPanel";
import { Button } from "./ui/button";
import { AGENTS } from "../lib/agents";
import { FileText, Loader2, ArrowRight, MessageSquare } from "lucide-react";
import { cn } from "../lib/utils";

interface Message {
  agentId: string;
  content: string;
  round: number;
}

interface RightPanelProps {
  messages: Message[];
  isTyping: boolean;
  currentAgentId: string | null;
  currentRound: number;
  synthesis: string | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  totalRounds?: number;
}

export function RightPanel({
  messages,
  isTyping,
  currentAgentId,
  currentRound,
  synthesis,
  activeTab,
  onTabChange,
  totalRounds = 2,
}: RightPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === "debate" && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

      // Only auto-scroll if user is near the bottom
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages, activeTab]);

  const currentAgent = currentAgentId ? AGENTS[currentAgentId] : null;
  const isSynthesizing = currentAgentId === "synthesis";
  const showSummaryCard = messages.length > 0 && (synthesis || isSynthesizing);

  // Determine the highest round number from messages
  const maxRoundInMessages = messages.length > 0
    ? Math.max(...messages.map(m => m.round))
    : 0;
  const displayRound = currentRound > 0 ? currentRound : maxRoundInMessages;

  // Parse synthesis for metrics
  const getSynthesisMetrics = () => {
    if (!synthesis) return null;

    const agreementSection = synthesis.match(/##?\s*(?:1\.?\s*)?(?:\*\*)?Where the PMs agreed(?:\*\*)?([\s\S]*?)(?=##?\s*(?:2\.?\s*)?(?:\*\*)?Where they disagreed|$)/i);
    const disagreementSection = synthesis.match(/##?\s*(?:2\.?\s*)?(?:\*\*)?Where they disagreed(?:\*\*)?([\s\S]*?)(?=##?\s*(?:3\.?\s*)?(?:\*\*)?Top recommended|$)/i);
    const recommendationsSection = synthesis.match(/##?\s*(?:3\.?\s*)?(?:\*\*)?Top recommended PRD changes(?:\*\*)?([\s\S]*?)(?=##?\s*(?:4\.?\s*)?(?:\*\*)?Overall PRD grade|$)/i);
    const gradeMatch = synthesis.match(/grade[:\s]+([A-F][+-]?)/i);

    const countListItems = (text: string) => {
      const lines = text.split('\n').filter(l => l.trim().match(/^[-*\d]/));
      return lines.length;
    };

    return {
      agreements: agreementSection ? countListItems(agreementSection[1]) : 0,
      disagreements: disagreementSection ? countListItems(disagreementSection[1]) : 0,
      recommendations: recommendationsSection ? countListItems(recommendationsSection[1]) : 0,
      grade: gradeMatch ? gradeMatch[1] : null,
    };
  };

  const metrics = getSynthesisMetrics();

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      {/* Header with tabs */}
      <div className="flex-shrink-0 px-5 py-4 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-foreground">PM Debate</h2>
              {displayRound > 0 && !isSynthesizing && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalRounds }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all",
                          i < displayRound
                            ? "bg-primary"
                            : "bg-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    Round {displayRound} of {totalRounds}
                  </span>
                </div>
              )}
              {isSynthesizing && (
                <span className="text-xs text-muted-foreground font-medium">
                  Generating synthesis...
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTab === "debate" ? "Live discussion between agents" : "Summary & recommendations"}
            </p>
          </div>

          {synthesis && (
            <div className="flex items-center gap-1 border rounded-md p-1">
              <button
                onClick={() => onTabChange("debate")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                  activeTab === "debate"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Debate
              </button>
              <button
                onClick={() => onTabChange("synthesis")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                  activeTab === "synthesis"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                Summary
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === "debate" ? (
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && !isTyping && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <p className="text-lg font-medium">No debate yet</p>
                <p className="text-sm mt-2">
                  Enter a PRD and start the debate to see the conversation
                </p>
              </div>
            </div>
          )}

          {messages.filter(message => message !== null).map((message, index) => (
            <AgentMessage
              key={`${message.agentId}-${message.round}-${index}`}
              agentId={message.agentId}
              content={message.content}
              round={message.round}
            />
          ))}

          {isTyping && currentAgent && !isSynthesizing && (
            <div className="rounded-lg p-5 bg-white border transition-all duration-200 animate-fade-in">
              <div className="flex items-start gap-4">
                <div
                  className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-lg shadow-soft animate-pulse-subtle ${currentAgent.color}`}
                >
                  {currentAgent.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2.5 mb-3">
                    <span className="font-semibold text-sm text-foreground">
                      {currentAgent.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {currentAgent.title}
                    </span>
                    {currentRound > 0 && (
                      <span className="text-xs text-muted-foreground/60">• Round {currentRound}</span>
                    )}
                  </div>
                  <TypingIndicator />
                </div>
              </div>
            </div>
          )}

          {showSummaryCard && (
            <div className="bg-card rounded-xl p-5 shadow-subtle border border-border/50 transition-all animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  {isSynthesizing ? (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground mb-1">
                    {isSynthesizing ? "Generating Summary..." : "Debate Summary & Recommendations"}
                  </div>
                  {isSynthesizing ? (
                    <div className="text-sm text-muted-foreground mb-4">
                      Analyzing debate and synthesizing insights
                    </div>
                  ) : metrics ? (
                    <>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-600">✓</span>
                          <span className="text-muted-foreground">{metrics.agreements} agreement{metrics.agreements !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-orange-600">⚠</span>
                          <span className="text-muted-foreground">{metrics.disagreements} disagreement{metrics.disagreements !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-blue-600">📝</span>
                          <span className="text-muted-foreground">{metrics.recommendations} recommendation{metrics.recommendations !== 1 ? 's' : ''}</span>
                        </div>
                        {metrics.grade && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-purple-600">📊</span>
                            <span className="text-muted-foreground">Grade: {metrics.grade}</span>
                          </div>
                        )}
                      </div>
                      <Button onClick={() => onTabChange("synthesis")} size="sm" className="shadow-subtle">
                        View Full Summary
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground mb-4">
                      View consolidated findings, agreements, disagreements, and PRD improvements
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      ) : (
        <SynthesisPanel synthesis={synthesis || ""} />
      )}
    </div>
  );
}
