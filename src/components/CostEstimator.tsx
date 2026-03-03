import { DollarSign } from "lucide-react";
import type { DepthLevel } from "../lib/agents";
import { estimateDebateCost, formatCost, formatTokenCount } from "../lib/cost-calculator";

interface CostEstimatorProps {
  prdLength: number;
  rounds: number;
  agentCount: number;
  depth: DepthLevel;
}

export function CostEstimator({ prdLength, rounds, agentCount, depth }: CostEstimatorProps) {
  if (prdLength === 0 || agentCount === 0) {
    return null;
  }

  const estimate = estimateDebateCost(prdLength, rounds, agentCount, depth);

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <DollarSign className="h-3 w-3" />
      <span>
        Est. cost: {formatCost(estimate.minCost)} - {formatCost(estimate.maxCost)}
        <span className="ml-2 text-muted-foreground/70">
          (~{formatTokenCount(estimate.estimatedTokens.input + estimate.estimatedTokens.output)} tokens)
        </span>
      </span>
    </div>
  );
}
