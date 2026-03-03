import { useEffect, useRef, useState } from 'react';
import { AGENTS } from '../../lib/agents';
import { PixelSprite, type SpriteAnimation } from './PixelSprite';
import { HealthBar } from './HealthBar';
import { DamageNumber } from './DamageNumber';
import { cn } from '../../lib/utils';
import type { BattleStats } from '../../lib/health';

interface Message {
  agentId: string;
  content: string;
  round: number;
}

interface DamageEvent {
  id: string;
  damage: number;
  isCritical: boolean;
  x: number;
  y: number;
}

interface BattleArenaProps {
  messages: Message[];
  isTyping: boolean;
  currentAgentId: string | null;
  battleStats: BattleStats | null;
  selectedAgents: string[];
}

export function BattleArena({
  messages,
  isTyping,
  currentAgentId,
  battleStats,
  selectedAgents,
}: BattleArenaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [spriteAnimations, setSpriteAnimations] = useState<Record<string, SpriteAnimation>>({});
  const [damageEvents, setDamageEvents] = useState<DamageEvent[]>([]);
  const [screenShake] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (currentAgentId && currentAgentId !== 'synthesis') {
      setSpriteAnimations((prev) => ({
        ...prev,
        [currentAgentId]: 'attack',
      }));

      setTimeout(() => {
        setSpriteAnimations((prev) => ({
          ...prev,
          [currentAgentId]: 'idle',
        }));
      }, 500);
    }
  }, [currentAgentId, messages.length]);

  const removeDamageEvent = (id: string) => {
    setDamageEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const currentMessage = messages[messages.length - 1];

  return (
    <div className={cn('crt-screen h-full bg-black relative overflow-hidden', screenShake && 'screen-shake')}>
      <div className="scanlines absolute inset-0 pointer-events-none" />

      {/* Battle Arena */}
      <div className="relative h-full flex flex-col">
        {/* PRD Boss Health Bar - Top */}
        <div className="p-4 bg-black/80 border-b-4 border-red-500">
          {battleStats && (
            <HealthBar health={battleStats.prdBoss} isBoss size="large" />
          )}
        </div>

        {/* Main Battle View */}
        <div className="flex-1 flex items-center justify-between p-8 relative">
          {/* Left Side - PM Fighters */}
          <div className="flex flex-col gap-8">
            {selectedAgents.map((agentId) => {
              const agent = AGENTS[agentId];
              const health = battleStats?.agents[agentId];

              if (!agent || !health) return null;

              const isActive = currentAgentId === agentId;

              return (
                <div key={agentId} className="relative">
                  <div className="flex items-center gap-4">
                    {/* Health Bar */}
                    <div className="w-48">
                      <HealthBar health={health} size="small" />
                    </div>

                    {/* Character Sprite */}
                    <div className={cn('relative', isActive && 'z-10')}>
                      <PixelSprite
                        agentId={agentId}
                        color={agent.color}
                        emoji={agent.avatar}
                        animation={spriteAnimations[agentId] || 'idle'}
                        scale={isActive ? 1.2 : 1}
                      />

                      {/* Agent Name */}
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <div className={cn('arcade-font text-xs', isActive ? 'arcade-yellow' : 'text-white/60')}>
                          {agent.name}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center - Battle Message */}
          <div className="flex-1 px-8 flex items-center justify-center">
            {currentMessage && (
              <div
                className={cn(
                  'bg-black/90 border-4 border-white p-6 rounded-lg max-w-2xl',
                  'pixel-fade-in relative'
                )}
                style={{ imageRendering: 'pixelated' }}
              >
                <div className="arcade-font text-xs text-white mb-3">
                  {AGENTS[currentMessage.agentId]?.name} says:
                </div>
                <div className="text-sm text-white/90 leading-relaxed max-h-48 overflow-y-auto">
                  {isTyping && currentAgentId === currentMessage.agentId
                    ? currentMessage.content
                    : currentMessage.content.substring(0, 200) + '...'}
                </div>

                {/* Speech bubble pointer */}
                <div
                  className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2"
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: '10px solid transparent',
                    borderBottom: '10px solid transparent',
                    borderRight: '15px solid white',
                  }}
                />
              </div>
            )}
          </div>

          {/* Right Side - PRD Boss */}
          <div className="flex flex-col items-center gap-4">
            <div className="arcade-font text-sm arcade-red mb-2">PRD BOSS</div>

            {/* PRD Boss Sprite - Large menacing figure */}
            <div className="relative">
              <div
                className={cn(
                  'w-32 h-40 rounded-lg flex items-center justify-center',
                  'border-4 border-red-500 bg-gradient-to-br from-red-900 to-red-950',
                  'sprite-idle shadow-lg shadow-red-500/50'
                )}
                style={{ imageRendering: 'pixelated' }}
              >
                <div className="text-8xl">📄</div>

                {/* Evil eyes */}
                <div className="absolute top-12 left-8 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <div className="absolute top-12 right-8 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </div>

              {/* Shadow */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-black/60 rounded-full blur-sm" />
            </div>
          </div>

          {/* Damage Numbers */}
          {damageEvents.map((event) => (
            <DamageNumber
              key={event.id}
              damage={event.damage}
              isCritical={event.isCritical}
              x={event.x}
              y={event.y}
              onComplete={() => removeDamageEvent(event.id)}
            />
          ))}
        </div>

        {/* Battle Log - Bottom */}
        <div className="h-32 bg-black/80 border-t-4 border-cyan-500 p-4 overflow-y-auto">
          <div className="arcade-font text-xs text-cyan-400 space-y-1">
            {messages.slice(-5).map((msg, idx) => {
              const agent = AGENTS[msg.agentId];
              return (
                <div key={idx} className="flex items-start gap-2">
                  <span className={cn('shrink-0', agent?.color.replace('bg-', 'text-'))}>
                    {agent?.name}:
                  </span>
                  <span className="text-white/70 truncate">
                    {msg.content.substring(0, 80)}...
                  </span>
                </div>
              );
            })}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
