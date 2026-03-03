const DAMAGE_KEYWORDS = {
  critical: { weight: 3, keywords: ['critical', 'severely', 'fundamentally flawed', 'major issue'] },
  concerned: { weight: 2, keywords: ['concerned', 'worried', 'problematic', 'risk', 'unclear', 'missing'] },
  question: { weight: 1.5, keywords: ['what about', 'how will', 'need clarity', 'we need'] },
  disagree: { weight: 2.5, keywords: ['disagree', 'incorrect', 'wrong', "won't work", 'failed approach'] },
};

const WORD_COUNT_MULTIPLIER = 0.03;
const BASE_DAMAGE = 10;
const MAX_DAMAGE = 50;
const MIN_DAMAGE = 5;

export interface DamageResult {
  damage: number;
  isCritical: boolean;
  triggerWords: string[];
}

export function calculateDamage(messageContent: string): DamageResult {
  const lowerContent = messageContent.toLowerCase();
  let totalWeight = 0;
  const triggerWords: string[] = [];

  // Check for damage keywords
  for (const config of Object.values(DAMAGE_KEYWORDS)) {
    for (const keyword of config.keywords) {
      if (lowerContent.includes(keyword)) {
        totalWeight += config.weight;
        triggerWords.push(keyword);
      }
    }
  }

  // Word count factor (longer, more detailed critiques = more damage)
  const wordCount = messageContent.split(/\s+/).length;
  const wordCountBonus = Math.floor(wordCount * WORD_COUNT_MULTIPLIER);

  // Calculate base damage
  let damage = BASE_DAMAGE + (totalWeight * 5) + wordCountBonus;

  // Determine if it's a critical hit (20% chance if severe keywords present)
  const hasSevereKeywords = triggerWords.some(word =>
    ['critical', 'severely', 'fundamentally flawed', 'major issue', 'disagree'].includes(word)
  );
  const isCritical = hasSevereKeywords && Math.random() < 0.2;

  if (isCritical) {
    damage *= 1.5;
  }

  // Clamp damage to min/max
  damage = Math.max(MIN_DAMAGE, Math.min(MAX_DAMAGE, Math.floor(damage)));

  return {
    damage,
    isCritical,
    triggerWords: [...new Set(triggerWords)], // Remove duplicates
  };
}

export function calculateAgentDamage(
  targetAgentId: string,
  attackerContent: string
): DamageResult | null {

  // Check if this agent is being mentioned/attacked
  // Simple heuristic: look for agent name mentions near negative keywords
  const mentionPattern = new RegExp(`\\b${targetAgentId}\\b`, 'i');

  if (!mentionPattern.test(attackerContent)) {
    return null; // Agent not mentioned, no damage
  }

  // Calculate reduced damage for inter-agent attacks (30% of PRD damage)
  const baseDamage = calculateDamage(attackerContent);

  return {
    damage: Math.floor(baseDamage.damage * 0.3),
    isCritical: baseDamage.isCritical,
    triggerWords: baseDamage.triggerWords,
  };
}
