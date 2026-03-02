import { AGENTS } from "../lib/agents";
import { cn } from "../lib/utils";

interface AgentMessageProps {
  agentId: string;
  content: string;
  round: number;
}

function highlightMentions(content: string) {
  const agentNames = Object.values(AGENTS).map((a) => a.name);
  const mentionRegex = new RegExp(`\\b(${agentNames.join("|")})\\b`, "gi");

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  const regex = new RegExp(mentionRegex);
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    const mentionedName = match[0];
    const mentionedAgent = Object.values(AGENTS).find(
      (a) => a.name.toLowerCase() === mentionedName.toLowerCase()
    );

    if (mentionedAgent) {
      parts.push(
        <span
          key={key++}
          className={cn(
            "font-semibold px-1.5 py-0.5 rounded",
            mentionedAgent.color.replace("bg-", "bg-") + "/10",
            mentionedAgent.color.replace("bg-", "text-")
          )}
        >
          {mentionedName}
        </span>
      );
    } else {
      parts.push(mentionedName);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

export function AgentMessage({ agentId, content, round }: AgentMessageProps) {
  const agent = AGENTS[agentId];

  if (!agent) return null;

  return (
    <div className="group">
      <div className="bg-card rounded-xl p-5 shadow-subtle hover:shadow-soft transition-all duration-200 border border-border/50">
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
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
              {highlightMentions(content)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
