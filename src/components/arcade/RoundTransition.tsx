import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface RoundTransitionProps {
  roundNumber: number;
  type: 'start' | 'end' | 'ko';
  onComplete?: () => void;
  koMessage?: string;
}

export function RoundTransition({
  roundNumber,
  type,
  onComplete,
  koMessage,
}: RoundTransitionProps) {
  const [phase, setPhase] = useState<'round' | 'action' | 'fade'>('round');

  useEffect(() => {
    if (type === 'ko') {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }

    const roundTimer = setTimeout(() => {
      setPhase('action');
    }, 1000);

    const actionTimer = setTimeout(() => {
      setPhase('fade');
    }, 2000);

    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 2500);

    return () => {
      clearTimeout(roundTimer);
      clearTimeout(actionTimer);
      clearTimeout(completeTimer);
    };
  }, [type, onComplete]);

  const getMessage = () => {
    if (type === 'ko') {
      return koMessage || 'K.O.!';
    }
    if (phase === 'round') {
      return `ROUND ${roundNumber}`;
    }
    return type === 'start' ? 'FIGHT!' : 'FINISH!';
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black/80 backdrop-blur-sm',
        phase === 'fade' && 'animate-out fade-out duration-500'
      )}
    >
      <div className="text-center">
        <div
          className={cn(
            'arcade-font text-white pixel-fade-in',
            type === 'ko' ? 'text-7xl mb-4 arcade-red' : 'text-6xl mb-4',
            phase === 'action' && type !== 'ko' && 'arcade-yellow scale-125 transition-all duration-300'
          )}
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
          {getMessage()}
        </div>

        {type === 'start' && phase === 'round' && (
          <div className="arcade-font text-2xl text-white/80 arcade-cyan">
            Ready...
          </div>
        )}
      </div>

      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none scanlines opacity-30" />
    </div>
  );
}
