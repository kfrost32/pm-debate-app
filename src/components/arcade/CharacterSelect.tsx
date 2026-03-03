import { AGENTS } from '../../lib/agents';
import { cn } from '../../lib/utils';

interface CharacterSelectProps {
  selectedAgents: string[];
  onAgentsChange: (agents: string[]) => void;
  onConfirm: () => void;
  disabled?: boolean;
}

export function CharacterSelect({
  selectedAgents,
  onAgentsChange,
  onConfirm,
  disabled = false,
}: CharacterSelectProps) {
  const toggleAgent = (agentId: string) => {
    if (disabled) return;

    if (selectedAgents.includes(agentId)) {
      if (selectedAgents.length > 1) {
        onAgentsChange(selectedAgents.filter((id) => id !== agentId));
      }
    } else {
      if (selectedAgents.length < 4) {
        onAgentsChange([...selectedAgents, agentId]);
      }
    }
  };

  return (
    <div className="crt-screen min-h-screen bg-black flex flex-col items-center justify-center p-8">
      <div className="scanlines absolute inset-0 pointer-events-none" />

      {/* Title */}
      <div className="text-center mb-12 relative z-10">
        <h1
          className="arcade-font text-6xl mb-4 arcade-cyan pixel-fade-in"
          style={{
            textShadow: `
              4px 4px 0 #000,
              -4px -4px 0 #000,
              4px -4px 0 #000,
              -4px 4px 0 #000,
              0 0 20px currentColor
            `,
          }}
        >
          SELECT YOUR TEAM
        </h1>
        <p className="arcade-font text-sm text-white/80 arcade-yellow">
          Choose 1-4 PM fighters
        </p>
      </div>

      {/* Character Grid */}
      <div className="grid grid-cols-2 gap-6 mb-12 relative z-10">
        {Object.values(AGENTS).map((agent) => {
          const isSelected = selectedAgents.includes(agent.id);
          const canSelect = selectedAgents.length < 4 || isSelected;

          return (
            <button
              key={agent.id}
              onClick={() => toggleAgent(agent.id)}
              disabled={disabled || !canSelect}
              className={cn(
                'relative group transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                !disabled && canSelect && 'cursor-pointer hover:scale-105'
              )}
            >
              {/* Character Portrait */}
              <div
                className={cn(
                  'w-48 h-64 relative',
                  'pixel-border-simple',
                  'transition-all duration-200',
                  isSelected
                    ? 'border-yellow-400 bg-yellow-400/10 scale-105'
                    : 'border-gray-600 bg-gray-900/50',
                  !disabled && canSelect && 'hover:border-white/50'
                )}
                style={{
                  borderColor: isSelected ? '#fbbf24' : undefined,
                }}
              >
                {/* Character Sprite */}
                <div
                  className={cn(
                    'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                    'w-24 h-32 rounded-lg flex items-center justify-center text-7xl',
                    agent.color,
                    isSelected && 'sprite-idle'
                  )}
                  style={{ imageRendering: 'pixelated' }}
                >
                  {agent.avatar}
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center arcade-font text-xs text-black">
                    ✓
                  </div>
                )}

                {/* Character Stats (fake for flavor) */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2">
                  <div className="arcade-font text-xs text-white space-y-1">
                    <div className="flex justify-between">
                      <span>ATK</span>
                      <span className="arcade-red">★★★★☆</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DEF</span>
                      <span className="arcade-cyan">★★★☆☆</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Character Name & Title */}
              <div className="mt-3 text-center">
                <div
                  className={cn(
                    'arcade-font text-sm mb-1',
                    isSelected ? 'arcade-yellow' : 'text-white/80'
                  )}
                >
                  {agent.name}
                </div>
                <div className="arcade-font text-xs text-white/50">
                  {agent.title}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirm Button */}
      <div className="relative z-10">
        <button
          onClick={onConfirm}
          disabled={disabled || selectedAgents.length === 0}
          className={cn(
            'arcade-button bg-green-500 text-white px-12 py-4',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'blink'
          )}
        >
          START BATTLE
        </button>
      </div>

      {/* Selected Count */}
      <div className="mt-6 arcade-font text-sm text-white/60 relative z-10">
        {selectedAgents.length} / 4 FIGHTERS SELECTED
      </div>
    </div>
  );
}
