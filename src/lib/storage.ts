import type { DepthLevel } from './agents';

export interface DebateSession {
  id: string;
  timestamp: number;
  prdText: string;
  rounds: number;
  depth: DepthLevel;
  selectedAgents: string[];
  messages: Array<{
    agentId: string;
    content: string;
    round: number;
  }>;
  synthesis: string | null;
  isComplete: boolean;
}

const STORAGE_KEY_PREFIX = 'pm_debate_';
const MAX_DEBATES = 10;
const MAX_AGE_DAYS = 7;

export function saveDebateState(session: DebateSession): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${session.id}`;
    localStorage.setItem(key, JSON.stringify(session));

    // Update index
    const index = getDebateIndex();
    if (!index.includes(session.id)) {
      index.unshift(session.id);
      // Keep only MAX_DEBATES
      if (index.length > MAX_DEBATES) {
        const removed = index.splice(MAX_DEBATES);
        // Delete old debates
        removed.forEach(id => {
          localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`);
        });
      }
      localStorage.setItem(`${STORAGE_KEY_PREFIX}index`, JSON.stringify(index));
    }
  } catch (error) {
    console.error('Failed to save debate state:', error);
  }
}

export function loadDebateState(id: string): DebateSession | null {
  try {
    const key = `${STORAGE_KEY_PREFIX}${id}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as DebateSession;
  } catch (error) {
    console.error('Failed to load debate state:', error);
    return null;
  }
}

export function getLatestIncompleteDebate(): DebateSession | null {
  const index = getDebateIndex();
  for (const id of index) {
    const session = loadDebateState(id);
    if (session && !session.isComplete) {
      return session;
    }
  }
  return null;
}

export function getDebateHistory(): DebateSession[] {
  const index = getDebateIndex();
  const debates: DebateSession[] = [];

  for (const id of index) {
    const session = loadDebateState(id);
    if (session) {
      debates.push(session);
    }
  }

  // Clean old debates
  cleanOldDebates(debates);

  return debates.sort((a, b) => b.timestamp - a.timestamp);
}

export function deleteDebate(id: string): void {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`);
    const index = getDebateIndex();
    const newIndex = index.filter(debateId => debateId !== id);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}index`, JSON.stringify(newIndex));
  } catch (error) {
    console.error('Failed to delete debate:', error);
  }
}

export function clearAllDebates(): void {
  try {
    const index = getDebateIndex();
    index.forEach(id => {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`);
    });
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}index`);
  } catch (error) {
    console.error('Failed to clear debates:', error);
  }
}

function getDebateIndex(): string[] {
  try {
    const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}index`);
    if (!data) return [];
    return JSON.parse(data) as string[];
  } catch (error) {
    console.error('Failed to load debate index:', error);
    return [];
  }
}

function cleanOldDebates(debates: DebateSession[]): void {
  const maxAge = Date.now() - (MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
  const oldDebates = debates.filter(d => d.timestamp < maxAge);
  oldDebates.forEach(d => deleteDebate(d.id));
}

export function generateDebateId(): string {
  return `debate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getPrdPreview(prdText: string, maxLength: number = 60): string {
  const firstLine = prdText.split('\n').find(line => line.trim().length > 0) || prdText;
  if (firstLine.length <= maxLength) return firstLine;
  return firstLine.substring(0, maxLength) + '...';
}
