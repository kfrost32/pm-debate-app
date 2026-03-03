import type { DebateEventType } from './debate';
import type { BattleStats, HealthState } from './health';
import { initializeBattleStats, applyDamage } from './health';
import { calculateDamage } from './damage-calculator';

export type BattleEventType =
  | DebateEventType
  | { type: 'battle_init'; stats: BattleStats }
  | { type: 'damage_dealt'; targetId: string; damage: number; isCritical: boolean; newHp: number }
  | { type: 'agent_ko'; agentId: string }
  | { type: 'prd_damaged'; damage: number; isCritical: boolean; newHp: number }
  | { type: 'round_start'; roundNumber: number }
  | { type: 'round_end'; roundNumber: number };

export class BattleSystem {
  private stats: BattleStats;
  private onBattleEvent: (event: BattleEventType) => void;

  constructor(
    agentIds: string[],
    onBattleEvent: (event: BattleEventType) => void
  ) {
    this.stats = initializeBattleStats(agentIds);
    this.onBattleEvent = onBattleEvent;

    // Emit initial battle state
    this.onBattleEvent({
      type: 'battle_init',
      stats: this.stats,
    });
  }

  notifyRoundStart(roundNumber: number) {
    this.onBattleEvent({
      type: 'round_start',
      roundNumber,
    });
  }

  notifyRoundEnd(roundNumber: number) {
    this.onBattleEvent({
      type: 'round_end',
      roundNumber,
    });
  }

  processAgentAttack(_agentId: string, messageContent: string) {
    // Calculate damage to PRD
    const damageResult = calculateDamage(messageContent);

    // Apply damage to PRD boss
    const newPrdState = applyDamage(this.stats.prdBoss, damageResult.damage);
    this.stats.prdBoss = newPrdState;

    // Emit damage event
    this.onBattleEvent({
      type: 'prd_damaged',
      damage: damageResult.damage,
      isCritical: damageResult.isCritical,
      newHp: newPrdState.currentHp,
    });

    // Check for KO
    if (newPrdState.isKnockedOut) {
      // PRD defeated - agents win!
      // This would trigger victory screen
    }
  }

  getBattleStats(): BattleStats {
    return this.stats;
  }

  getAgentHealth(agentId: string): HealthState | undefined {
    return this.stats.agents[agentId];
  }

  getPrdHealth(): HealthState {
    return this.stats.prdBoss;
  }
}
