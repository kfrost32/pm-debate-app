import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

export type SpriteAnimation = 'idle' | 'attack' | 'hit' | 'victory' | 'defeat';

interface PixelSpriteProps {
  agentId: string;
  color: string;
  emoji: string;
  animation?: SpriteAnimation;
  scale?: number;
}

export function PixelSprite({
  color,
  emoji,
  animation = 'idle',
  scale = 1,
}: PixelSpriteProps) {
  const [currentAnimation, setCurrentAnimation] = useState<SpriteAnimation>(animation);

  useEffect(() => {
    setCurrentAnimation(animation);

    // Reset to idle after animation completes
    if (animation !== 'idle' && animation !== 'defeat') {
      const timeout = setTimeout(() => {
        setCurrentAnimation('idle');
      }, animation === 'victory' ? 1200 : 500);

      return () => clearTimeout(timeout);
    }
  }, [animation]);

  const animationClass = {
    idle: 'sprite-idle',
    attack: 'sprite-attack',
    hit: 'sprite-hit',
    victory: 'sprite-victory',
    defeat: 'opacity-50 grayscale',
  }[currentAnimation];

  return (
    <div
      className={cn(
        'pixel-sprite relative transition-all duration-200',
        animationClass
      )}
      style={{
        transform: `scale(${scale})`,
      }}
    >
      {/* Character Base - CSS Pixel Art */}
      <div className="relative">
        {/* Character Body (simplified pixel art using emoji as base) */}
        <div
          className={cn(
            'w-24 h-32 rounded-lg flex flex-col items-center justify-center',
            'border-4 border-black shadow-lg relative',
            color
          )}
          style={{
            imageRendering: 'pixelated',
          }}
        >
          {/* Emoji Character */}
          <div className="text-6xl mb-2 select-none">{emoji}</div>

          {/* Pixel Art Highlights */}
          <div
            className="absolute top-2 left-2 w-3 h-3 bg-white/40 rounded-sm"
            style={{ imageRendering: 'pixelated' }}
          />
          <div
            className="absolute bottom-2 right-2 w-4 h-4 bg-black/20 rounded-sm"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        {/* Shadow */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-3 bg-black/40 rounded-full blur-sm"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  );
}
