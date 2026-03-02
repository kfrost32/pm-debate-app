import Anthropic from "@anthropic-ai/sdk";
import { AGENTS, getAgentPromptForRound, SYNTHESIS_PROMPT, type DepthLevel } from "./agents";

export interface AgentResponse {
  agentId: string;
  round: number;
  content: string;
  timestamp: number;
}

export interface DebateState {
  prdText: string;
  rounds: number;
  selectedAgentIds: string[];
  responses: AgentResponse[];
  synthesis: string | null;
  isRunning: boolean;
  currentRound: number;
  currentAgentId: string | null;
}

export type DebateEventType =
  | { type: "agent_start"; agentId: string; round: number }
  | { type: "agent_chunk"; agentId: string; chunk: string }
  | { type: "agent_complete"; agentId: string; round: number; content: string }
  | { type: "synthesis_start" }
  | { type: "synthesis_chunk"; chunk: string }
  | { type: "synthesis_complete"; content: string }
  | { type: "debate_complete" }
  | { type: "error"; error: string };

export class DebateOrchestrator {
  private anthropic: Anthropic;
  private onEvent: (event: DebateEventType) => void;

  constructor(apiKey: string, onEvent: (event: DebateEventType) => void) {
    this.anthropic = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
    this.onEvent = onEvent;
  }

  async runDebate(
    prdText: string,
    rounds: number,
    selectedAgentIds: string[],
    depth: DepthLevel = "moderate"
  ): Promise<void> {
    const responses: AgentResponse[] = [];

    try {
      for (let round = 1; round <= rounds; round++) {
        for (const agentId of selectedAgentIds) {
          const agent = AGENTS[agentId];
          if (!agent) continue;

          this.onEvent({ type: "agent_start", agentId, round });

          const conversationHistory = this.buildConversationHistory(responses);
          const keyPoints = round > 1 ? this.extractKeyPoints(responses) : undefined;
          const prompt = getAgentPromptForRound(
            agent,
            round,
            prdText,
            conversationHistory,
            depth,
            keyPoints
          );

          let fullContent = "";

          const stream = await this.anthropic.messages.stream({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 1000,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          });

          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              const text = chunk.delta.text;
              fullContent += text;
              this.onEvent({ type: "agent_chunk", agentId, chunk: text });
            }
          }

          responses.push({
            agentId,
            round,
            content: fullContent,
            timestamp: Date.now(),
          });

          this.onEvent({
            type: "agent_complete",
            agentId,
            round,
            content: fullContent,
          });
        }
      }

      this.onEvent({ type: "synthesis_start" });

      const synthesisPrompt = this.buildSynthesisPrompt(prdText, responses);
      let synthesisContent = "";

      const synthesisStream = await this.anthropic.messages.stream({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: synthesisPrompt,
          },
        ],
      });

      for await (const chunk of synthesisStream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          const text = chunk.delta.text;
          synthesisContent += text;
          this.onEvent({ type: "synthesis_chunk", chunk: text });
        }
      }

      this.onEvent({
        type: "synthesis_complete",
        content: synthesisContent,
      });

      this.onEvent({ type: "debate_complete" });
    } catch (error) {
      this.onEvent({
        type: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private buildConversationHistory(responses: AgentResponse[]): string {
    if (responses.length === 0) return "";

    return responses
      .map((response) => {
        const agent = AGENTS[response.agentId];
        return `### ${agent.name} (${agent.title}) - Round ${response.round}\n\n${response.content}`;
      })
      .join("\n\n---\n\n");
  }

  private extractKeyPoints(responses: AgentResponse[]): string[] {
    if (responses.length === 0) return [];

    const keyPoints: string[] = [];
    const seenTopics = new Set<string>();

    for (const response of responses) {
      const agent = AGENTS[response.agentId];
      const sentences = response.content
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 20);

      for (const sentence of sentences) {
        const lowerSentence = sentence.toLowerCase();

        // Extract concerns, questions, and strong opinions
        if (
          lowerSentence.includes("concerned about") ||
          lowerSentence.includes("worry about") ||
          lowerSentence.includes("critical") ||
          lowerSentence.includes("risk") ||
          lowerSentence.includes("we need") ||
          lowerSentence.includes("missing") ||
          lowerSentence.includes("unclear")
        ) {
          // Simple deduplication based on key topic words
          const topicWords = sentence
            .toLowerCase()
            .match(/\b(data|user|technical|customer|growth|scale|cost|error|feature|workflow)\w*\b/g);

          if (topicWords) {
            const topicKey = topicWords.slice(0, 2).join("-");
            if (!seenTopics.has(topicKey) && keyPoints.length < 8) {
              keyPoints.push(`${agent.name}: ${sentence.substring(0, 120)}${sentence.length > 120 ? '...' : ''}`);
              seenTopics.add(topicKey);
            }
          }
        }
      }
    }

    return keyPoints;
  }

  private buildSynthesisPrompt(
    prdText: string,
    responses: AgentResponse[]
  ): string {
    const conversationHistory = this.buildConversationHistory(responses);

    return `${SYNTHESIS_PROMPT}

## Original PRD

${prdText}

## Full Debate Transcript

${conversationHistory}

---

Now provide your synthesis following the format specified above.`;
  }
}
