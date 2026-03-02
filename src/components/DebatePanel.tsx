import { useEffect, useRef } from "react";
import { AgentMessage } from "./AgentMessage";
import { TypingIndicator } from "./TypingIndicator";
import { AGENTS } from "../lib/agents";
import { FileText, Loader2, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

interface Message {
  agentId: string;
  content: string;
  round: number;
}

interface DebatePanelProps {
  messages: Message[];
  isTyping: boolean;
  currentAgentId: string | null;
  synthesis: string | null;
  onShowSynthesis: () => void;
}

export function DebatePanel({
  messages,
  isTyping,
  currentAgentId,
  synthesis,
  onShowSynthesis,
}: DebatePanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, synthesis]);

  const currentAgent = currentAgentId ? AGENTS[currentAgentId] : null;
  const isSynthesizing = currentAgentId === "synthesis";
  const showSummaryCard = messages.length > 0 && (synthesis || isSynthesizing);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-5 py-4 border-b bg-card/50 backdrop-blur-sm">
        <div>
          <h2 className="text-sm font-semibold text-foreground">PM Debate</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Live discussion between agents
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-4">
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

        {messages.map((message, index) => (
          <AgentMessage
            key={`${message.agentId}-${message.round}-${index}`}
            agentId={message.agentId}
            content={message.content}
            round={message.round}
          />
        ))}

        {isTyping && currentAgent && !isSynthesizing && (
          <div className="flex items-start gap-3">
            <div
              className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white ${currentAgent.color}`}
            >
              {currentAgent.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-semibold">
                  {currentAgent.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {currentAgent.title}
                </span>
              </div>
              <TypingIndicator />
            </div>
          </div>
        )}

        {showSummaryCard && (
          <div className="bg-card rounded-xl p-5 shadow-subtle border border-border/50">
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
                <div className="text-sm text-muted-foreground mb-4">
                  {isSynthesizing
                    ? "Analyzing debate and synthesizing insights"
                    : "View consolidated findings, agreements, disagreements, and PRD improvements"}
                </div>
                {synthesis && (
                  <Button onClick={onShowSynthesis} size="sm" className="shadow-subtle">
                    Open Summary
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
