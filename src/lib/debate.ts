import Anthropic from "@anthropic-ai/sdk";
import { AGENTS, getAgentPromptForRound, SYNTHESIS_PROMPT, type DepthLevel } from "./agents";

export interface AgentResponse {
  agentId: string;
  round: number;
  content: string;
  timestamp: number;
  turnType?: "statement" | "question" | "meta";
}

export interface AgentMemory {
  agentId: string;
  positions: string[];
  changedMinds: { round: number; topic: string; reason: string }[];
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
  | { type: "debate_cancelled" }
  | { type: "error"; error: string };

export class DebateOrchestrator {
  private anthropic: Anthropic;
  private onEvent: (event: DebateEventType) => void;
  private abortController: AbortController | null = null;
  private isCancelled = false;
  private agentMemories: Map<string, AgentMemory> = new Map();

  constructor(apiKey: string, onEvent: (event: DebateEventType) => void) {
    // In production, use our proxy. In development, use direct API with local key
    const useProxy = import.meta.env.PROD;
    const baseURL = useProxy ? `${window.location.origin}/api` : 'https://api.anthropic.com';

    console.log('[DebateOrchestrator] Config:', {
      isProd: import.meta.env.PROD,
      useProxy,
      baseURL,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length
    });

    this.anthropic = new Anthropic({
      apiKey: useProxy ? 'not-needed' : apiKey, // Proxy doesn't need real key in request
      baseURL,
      dangerouslyAllowBrowser: true,
    });
    this.onEvent = onEvent;
  }

  cancelDebate(): void {
    this.isCancelled = true;
    if (this.abortController) {
      this.abortController.abort();
    }
    this.onEvent({ type: "debate_cancelled" });
  }

  async runDebate(
    prdText: string,
    rounds: number,
    selectedAgentIds: string[],
    depth: DepthLevel = "moderate"
  ): Promise<void> {
    const responses: AgentResponse[] = [];
    this.isCancelled = false;
    this.abortController = new AbortController();

    // Initialize agent memories
    selectedAgentIds.forEach(id => {
      this.agentMemories.set(id, {
        agentId: id,
        positions: [],
        changedMinds: []
      });
    });

    try {
      let round = 1;
      let debateComplete = false;

      while (round <= rounds && !debateComplete && !this.isCancelled) {
        // Round 1: Everyone speaks in parallel (establish positions)
        if (round === 1) {
          // Show first agent thinking while all process in parallel
          const firstAgentId = selectedAgentIds[0];
          this.onEvent({ type: "agent_start", agentId: firstAgentId, round });

          // Start all agents in parallel and collect their responses
          const agentPromises = selectedAgentIds.map(agentId =>
            this.runAgentTurnSilent(agentId, round, prdText, responses, depth)
          );

          // Wait for all to complete
          const allResponses = await Promise.all(agentPromises);

          if (this.isCancelled) break;

          // Now display them sequentially with a brief delay
          for (let i = 0; i < allResponses.length; i++) {
            if (this.isCancelled) break;

            const { agentId, content } = allResponses[i];

            // Show agent start
            this.onEvent({ type: "agent_start", agentId, round });

            // Stream the content quickly (simulate typing at ~500 chars/sec)
            const chunkSize = 50;
            for (let j = 0; j < content.length; j += chunkSize) {
              const chunk = content.slice(j, j + chunkSize);
              this.onEvent({ type: "agent_chunk", agentId, chunk });
              await new Promise(resolve => setTimeout(resolve, 100)); // 100ms per chunk = ~500 chars/sec
            }

            // Mark complete
            this.onEvent({ type: "agent_complete", agentId, round, content });

            // Brief pause before next agent (except for last one)
            if (i < allResponses.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }
        } else {
          // Round 2+: Dynamic turn-taking based on urgency
          const agentsToSpeak = [...selectedAgentIds];
          const spokenThisRound = new Set<string>();

          while (agentsToSpeak.length > 0 && !this.isCancelled) {
            const nextAgentId = await this.determineNextSpeaker(
              agentsToSpeak,
              responses
            );

            await this.runAgentTurn(nextAgentId, round, prdText, responses, depth);

            agentsToSpeak.splice(agentsToSpeak.indexOf(nextAgentId), 1);
            spokenThisRound.add(nextAgentId);
          }
        }

        // After each round (except round 1), check if agents are satisfied
        if (round >= 1 && round < rounds) {
          debateComplete = await this.checkSatisfaction(selectedAgentIds, responses);
          if (debateComplete) {
            break;
          }
        }

        round++;
      }

      this.onEvent({ type: "synthesis_start" });

      const synthesisPrompt = this.buildSynthesisPrompt(prdText, responses);
      let synthesisContent = "";

      const synthesisStream = await this.anthropic.messages.stream({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 3000,
        system: [
          {
            type: "text",
            text: SYNTHESIS_PROMPT,
            cache_control: { type: "ephemeral" }
          }
        ],
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

      if (!this.isCancelled) {
        this.onEvent({ type: "debate_complete" });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Debate was cancelled, already emitted debate_cancelled event
        return;
      }
      this.onEvent({
        type: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      this.abortController = null;
    }
  }

  private async runAgentTurnSilent(
    agentId: string,
    round: number,
    prdText: string,
    responses: AgentResponse[],
    depth: DepthLevel
  ): Promise<{ agentId: string; content: string }> {
    const agent = AGENTS[agentId];
    if (!agent) return { agentId, content: '' };

    const conversationHistory = this.buildConversationHistory(responses);
    const keyPoints = round > 1 ? this.extractKeyPoints(responses) : undefined;
    const memory = this.agentMemories.get(agentId);

    const prompt = this.buildEnhancedPrompt(
      agent,
      round,
      prdText,
      conversationHistory,
      depth,
      keyPoints,
      memory,
      responses
    );

    let fullContent = "";

    // Build cached system blocks for cost optimization
    const systemBlocks: any[] = [
      {
        type: "text",
        text: agent.systemPrompt,
        cache_control: { type: "ephemeral" }
      }
    ];

    // Cache the PRD in system context (saves tokens on repeated debates)
    if (round === 1) {
      systemBlocks.push({
        type: "text",
        text: `## PRD Being Reviewed\n\n${prdText}`,
        cache_control: { type: "ephemeral" }
      });
    }

    const stream = await this.anthropic.messages.stream({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1500,
      system: systemBlocks,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
              cache_control: round > 1 ? { type: "ephemeral" } : undefined
            }
          ],
        },
      ],
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        fullContent += chunk.delta.text;
      }
    }

    // Update agent memory and responses
    this.updateAgentMemory(agentId, round, fullContent);

    responses.push({
      agentId,
      round,
      content: fullContent,
      timestamp: Date.now(),
    });

    return { agentId, content: fullContent };
  }

  private async runAgentTurn(
    agentId: string,
    round: number,
    prdText: string,
    responses: AgentResponse[],
    depth: DepthLevel
  ): Promise<void> {
    const agent = AGENTS[agentId];
    if (!agent) return;

    this.onEvent({ type: "agent_start", agentId, round });

    const conversationHistory = this.buildConversationHistory(responses);
    const keyPoints = round > 1 ? this.extractKeyPoints(responses) : undefined;
    const memory = this.agentMemories.get(agentId);

    const prompt = this.buildEnhancedPrompt(
      agent,
      round,
      prdText,
      conversationHistory,
      depth,
      keyPoints,
      memory,
      responses
    );

    let fullContent = "";

    // Build cached system blocks for cost optimization
    const systemBlocks: any[] = [
      {
        type: "text",
        text: agent.systemPrompt,
        cache_control: { type: "ephemeral" }
      }
    ];

    // Cache the PRD in system context (saves tokens on repeated debates)
    if (round === 1) {
      systemBlocks.push({
        type: "text",
        text: `## PRD Being Reviewed\n\n${prdText}`,
        cache_control: { type: "ephemeral" }
      });
    }

    const stream = await this.anthropic.messages.stream({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1500,
      system: systemBlocks,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
              cache_control: round > 1 ? { type: "ephemeral" } : undefined
            }
          ],
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

    // Update agent memory
    this.updateAgentMemory(agentId, round, fullContent);

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

  private async checkSatisfaction(
    agentIds: string[],
    responses: AgentResponse[]
  ): Promise<boolean> {
    // Get recent conversation for context
    const recentConversation = responses.slice(-6).map(r => {
      const agent = AGENTS[r.agentId];
      return `${agent.name}: ${r.content.substring(0, 150)}...`;
    }).join('\n\n');

    // Batch satisfaction check for all agents (cost optimization)
    const agentsList = agentIds.map(id => AGENTS[id].name).join(', ');

    const satisfactionPrompt = `Recent debate exchange:
${recentConversation}

For each PM (${agentsList}), have their key concerns been adequately addressed?

Respond in this exact format:
Maya: YES
Derek: NO
Priya: YES
(etc)`;

    try {
      const response = await this.anthropic.messages.create({
        model: "claude-haiku-3-5-20241022",  // Use Haiku for cost savings
        max_tokens: 100,
        messages: [{
          role: "user",
          content: satisfactionPrompt
        }]
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';

      // Parse satisfaction responses
      const satisfactionResults = agentIds.map(id => {
        const agent = AGENTS[id];
        const match = text.match(new RegExp(`${agent.name}:\\s*(YES|NO)`, 'i'));
        const satisfied = match ? match[1].toUpperCase() === 'YES' : false;
        return satisfied;
      });

      const satisfiedCount = satisfactionResults.filter(s => s).length;
      const satisfactionRate = satisfiedCount / agentIds.length;

      // Debate is complete if 75% or more agents are satisfied
      return satisfactionRate >= 0.75;
    } catch {
      // On error, continue the debate
      return false;
    }
  }

  private async determineNextSpeaker(
    remainingAgents: string[],
    responses: AgentResponse[]
  ): Promise<string> {
    if (remainingAgents.length === 1) {
      return remainingAgents[0];
    }

    // Get last response to provide context
    const lastResponse = responses[responses.length - 1];

    if (!lastResponse) {
      return remainingAgents[0];
    }

    const lastAgent = AGENTS[lastResponse.agentId];
    const lastMessagePreview = lastResponse.content.substring(0, 300);

    // Build urgency check for all remaining agents in one call (cost optimization)
    const agentsList = remainingAgents.map(id => {
      const agent = AGENTS[id];
      return `${agent.name} (${agent.title})`;
    }).join(', ');

    const urgencyPrompt = `${lastAgent.name} just said: "${lastMessagePreview}..."

Rate the urgency (1-10) for each PM to respond next. Consider whose expertise is most relevant.

Remaining PMs: ${agentsList}

Respond in this exact format:
Maya: 7
Derek: 4
Priya: 9
(etc - only include PMs listed above)`;

    try {
      const response = await this.anthropic.messages.create({
        model: "claude-haiku-3-5-20241022",  // Use Haiku for cost savings
        max_tokens: 100,
        messages: [{
          role: "user",
          content: urgencyPrompt
        }]
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';

      // Parse urgency scores
      const urgencies = remainingAgents.map(id => {
        const agent = AGENTS[id];
        const match = text.match(new RegExp(`${agent.name}:\\s*(\\d+)`, 'i'));
        const urgency = match ? parseInt(match[1]) : 5; // Default to 5 if not found
        return { agentId: id, urgency };
      });

      // Return agent with highest urgency
      urgencies.sort((a, b) => b.urgency - a.urgency);
      return urgencies[0].agentId;
    } catch {
      // Fallback to first remaining agent
      return remainingAgents[0];
    }
  }

  private buildEnhancedPrompt(
    agent: any,
    round: number,
    prdText: string,
    conversationHistory: string,
    depth: DepthLevel,
    keyPoints?: string[],
    memory?: AgentMemory,
    responses?: AgentResponse[]
  ): string {
    const basePrompt = getAgentPromptForRound(
      agent,
      round,
      prdText,
      conversationHistory,
      depth,
      keyPoints
    );

    if (round === 1) {
      return basePrompt;
    }

    // Enhanced instructions for rounds 2+
    let enhancements = '\n\n## Additional Instructions\n\n';

    // Meta-awareness
    enhancements += `**Meta-awareness**: You can reference the debate process itself:
- "We're spending a lot of time on X, but I think Y is more critical"
- "I notice we're all aligned on this point, so let's move forward"
- "This disagreement feels unresolved - maybe we need more specifics"

`;

    // Follow-up questions
    enhancements += `**Ask clarifying questions**: Instead of just responding, you can ask other PMs for specifics:
- "@Maya, when you say 'deeply nested', are you thinking more than 3 levels?"
- "@Derek, what adoption rate would make this worth the complexity?"
- "@Priya, what's your gut on the technical lift here - days or weeks?"

`;

    // Agent memory / changing mind
    if (memory && memory.positions.length > 0) {
      enhancements += `**Your previous positions**:
${memory.positions.map((p, i) => `${i + 1}. ${p}`).join('\n')}

You can reference these, build on them, OR change your mind if another PM made a compelling point. If you change your position, explain why briefly.

`;
    }

    // Check if last response was a question directed at this agent
    if (responses && responses.length > 0) {
      const lastResponse = responses[responses.length - 1];
      if (lastResponse.content.includes(`@${agent.name}`) && lastResponse.content.includes('?')) {
        enhancements += `**NOTE**: The last message included a question directed at you. Address it directly before making other points.\n\n`;
      }
    }

    return basePrompt + enhancements;
  }

  private updateAgentMemory(agentId: string, round: number, content: string): void {
    const memory = this.agentMemories.get(agentId);
    if (!memory) return;

    // Extract key positions from this response
    const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();

      // Detect position statements
      if (lower.includes('i think') || lower.includes('we should') || lower.includes('we need') ||
          lower.includes('critical') || lower.includes('recommend')) {
        if (memory.positions.length < 5) {
          memory.positions.push(`Round ${round}: ${sentence.substring(0, 100)}${sentence.length > 100 ? '...' : ''}`);
        }
      }

      // Detect mind changes
      if (lower.includes('you\'re right') || lower.includes('i was wrong') ||
          lower.includes('changed my mind') || lower.includes('convinced me') ||
          lower.includes('revising my')) {
        memory.changedMinds.push({
          round,
          topic: sentence.substring(0, 60),
          reason: 'Convinced by other PM'
        });
      }
    }
  }

  private buildConversationHistory(responses: AgentResponse[], limitToLastRounds = 3): string {
    if (responses.length === 0) return "";

    // For multi-round debates, only include last N rounds to save tokens
    const maxRound = Math.max(...responses.map(r => r.round));
    const minRound = maxRound - limitToLastRounds + 1;

    const filteredResponses = responses.filter(r => r.round >= minRound);

    return filteredResponses
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

        // Extract concerns, agreements, and constructive suggestions
        const isConcern =
          lowerSentence.includes("concerned about") ||
          lowerSentence.includes("worry about") ||
          lowerSentence.includes("critical") ||
          lowerSentence.includes("risk") ||
          lowerSentence.includes("we need") ||
          lowerSentence.includes("missing") ||
          lowerSentence.includes("unclear");

        const isAgreement =
          lowerSentence.includes("i agree") ||
          lowerSentence.includes("good point") ||
          lowerSentence.includes("makes sense") ||
          lowerSentence.includes("you're right") ||
          lowerSentence.includes("building on");

        const isSolution =
          lowerSentence.includes("we could") ||
          lowerSentence.includes("alternative") ||
          lowerSentence.includes("solution") ||
          lowerSentence.includes("what if") ||
          lowerSentence.includes("recommend");

        if (isConcern || isAgreement || isSolution) {
          // Simple deduplication based on key topic words
          const topicWords = sentence
            .toLowerCase()
            .match(/\b(data|user|technical|customer|growth|scale|cost|error|feature|workflow|adoption|metric)\w*\b/g);

          if (topicWords) {
            const topicKey = topicWords.slice(0, 2).join("-");
            if (!seenTopics.has(topicKey) && keyPoints.length < 10) {
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
