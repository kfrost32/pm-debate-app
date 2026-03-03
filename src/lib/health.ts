export interface HealthState {
  agentId: string;
  currentHp: number;
  maxHp: number;
  isKnockedOut: boolean;
}

export interface BattleStats {
  agents: Record<string, HealthState>;
  prdBoss: HealthState;
}

export const AGENT_MAX_HP = 100;
export const PRD_BOSS_MAX_HP = 500;

export function initializeBattleStats(agentIds: string[]): BattleStats {
  const agents: Record<string, HealthState> = {};

  for (const agentId of agentIds) {
    agents[agentId] = {
      agentId,
      currentHp: AGENT_MAX_HP,
      maxHp: AGENT_MAX_HP,
      isKnockedOut: false,
    };
  }

  return {
    agents,
    prdBoss: {
      agentId: 'prd-boss',
      currentHp: PRD_BOSS_MAX_HP,
      maxHp: PRD_BOSS_MAX_HP,
      isKnockedOut: false,
    },
  };
}

export function applyDamage(
  healthState: HealthState,
  damage: number
): HealthState {
  const newHp = Math.max(0, healthState.currentHp - damage);
  return {
    ...healthState,
    currentHp: newHp,
    isKnockedOut: newHp === 0,
  };
}

export function healAgent(
  healthState: HealthState,
  healing: number
): HealthState {
  const newHp = Math.min(healthState.maxHp, healthState.currentHp + healing);
  return {
    ...healthState,
    currentHp: newHp,
    isKnockedOut: false,
  };
}
