import { AGENTS } from "../lib/agents";
import { cn } from "../lib/utils";
import ReactMarkdown from "react-markdown";

interface AgentMessageProps {
  agentId: string;
  content: string;
  round: number;
}

function highlightMentions(text: string): string {
  const agentNames = Object.values(AGENTS).map(a => a.name);
  let highlightedText = text;

  agentNames.forEach(name => {
    // Match name with word boundaries, case insensitive
    const regex = new RegExp(`\\b(${name}('s)?)\\b`, 'gi');
    highlightedText = highlightedText.replace(regex, '**@$1**');
  });

  return highlightedText;
}

export function AgentMessage({ agentId, content, round }: AgentMessageProps) {
  const agent = AGENTS[agentId];

  if (!agent) return null;

  const highlightedContent = highlightMentions(content);

  return (
    <div className="group">
      <div
        className="rounded-lg p-5 bg-white border transition-all duration-200"
      >
        <div className="flex items-start gap-4">
          <div className={cn(
            "shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-lg shadow-soft",
            agent.color
          )}>
            {agent.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2.5 mb-3">
              <span className="font-semibold text-sm text-foreground">{agent.name}</span>
              <span className="text-xs text-muted-foreground font-medium">{agent.title}</span>
              <span className="text-xs text-muted-foreground/60">• Round {round}</span>
            </div>
            <div className="text-sm text-foreground/90">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                  strong: ({ children }) => {
                    const text = String(children);
                    // Check if this is a mention (@Name)
                    if (text.startsWith('@')) {
                      return (
                        <span className="font-semibold text-foreground bg-blue-100 px-1 py-0.5 rounded">
                          {text}
                        </span>
                      );
                    }
                    return <strong className="font-semibold text-foreground">{children}</strong>;
                  },
                  em: ({ children }) => <em className="italic">{children}</em>,
                  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-foreground/90 leading-relaxed">{children}</li>,
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                    ) : (
                      <code className={cn("block bg-muted p-3 rounded text-xs font-mono overflow-x-auto", className)}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {highlightedContent}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
