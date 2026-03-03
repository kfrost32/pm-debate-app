import type { DepthLevel } from './agents';

// Anthropic Claude Sonnet 4.5 pricing (as of 2025)
const PRICING = {
  input_per_million: 3.00,
  output_per_million: 15.00,
  cache_write_per_million: 3.75,
  cache_read_per_million: 0.30,
};

const DEPTH_TOKEN_ESTIMATES: Record<DepthLevel, { min: number; max: number }> = {
  brief: { min: 100, max: 200 },
  moderate: { min: 250, max: 450 },
  detailed: { min: 500, max: 750 },
};

export interface CostEstimate {
  minCost: number;
  maxCost: number;
  estimatedTokens: {
    input: number;
    output: number;
  };
}

export function estimateDebateCost(
  prdLength: number,
  rounds: number,
  agentCount: number,
  depth: DepthLevel
): CostEstimate {
  // Estimate PRD tokens (rough: 1 token ≈ 4 characters)
  const prdTokens = Math.ceil(prdLength / 4);

  // Estimate agent system prompt tokens (average ~600 tokens per agent)
  const systemPromptTokens = 600;

  // Estimate output tokens per agent response
  const outputTokensPerResponse = DEPTH_TOKEN_ESTIMATES[depth];

  // Calculate total for all rounds
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let round = 1; round <= rounds; round++) {
    for (let i = 0; i < agentCount; i++) {
      // Input: PRD + system prompt + conversation history (grows each round)
      const historyTokens = round === 1 ? 0 : (round - 1) * agentCount * outputTokensPerResponse.max;
      const inputForThisAgent = prdTokens + systemPromptTokens + historyTokens;

      totalInputTokens += inputForThisAgent;
      totalOutputTokens += outputTokensPerResponse.max;
    }
  }

  // Synthesis
  const synthesisInputTokens = prdTokens + (rounds * agentCount * outputTokensPerResponse.max) + 500;
  const synthesisOutputTokens = 800; // Typical synthesis length

  totalInputTokens += synthesisInputTokens;
  totalOutputTokens += synthesisOutputTokens;

  // With prompt caching (saves ~50% on repeated content in later rounds)
  const cacheSavings = rounds > 1 ? totalInputTokens * 0.4 : 0;
  const effectiveInputTokens = totalInputTokens - cacheSavings;

  // Calculate costs
  const inputCost = (effectiveInputTokens / 1_000_000) * PRICING.input_per_million;
  const outputCost = (totalOutputTokens / 1_000_000) * PRICING.output_per_million;

  const minCost = (inputCost + outputCost) * 0.8; // 80% of estimate
  const maxCost = (inputCost + outputCost) * 1.2; // 120% of estimate

  return {
    minCost: Math.max(0.01, minCost),
    maxCost,
    estimatedTokens: {
      input: Math.floor(effectiveInputTokens),
      output: totalOutputTokens,
    },
  };
}

export function formatCost(cost: number): string {
  if (cost < 0.01) return '<$0.01';
  if (cost < 1) return `$${cost.toFixed(2)}`;
  return `$${cost.toFixed(2)}`;
}

export function formatTokenCount(tokens: number): string {
  if (tokens < 1000) return `${tokens}`;
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(1)}k`;
  return `${(tokens / 1_000_000).toFixed(2)}M`;
}
