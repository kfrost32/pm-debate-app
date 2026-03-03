import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import type { HealthState } from '../../lib/health';

interface HealthBarProps {
  health: HealthState;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  isBoss?: boolean;
}

export function HealthBar({
  health,
  showLabel = true,
  size = 'medium',
  isBoss = false,
}: HealthBarProps) {
  const [displayHp, setDisplayHp] = useState(health.currentHp);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (displayHp !== health.currentHp) {
      setIsFlashing(true);
      const timer = setTimeout(() => {
        setDisplayHp(health.currentHp);
        setIsFlashing(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [health.currentHp, displayHp]);

  const percentage = (health.currentHp / health.maxHp) * 100;

  const getHpBarColor = () => {
    if (percentage > 60) return '';
    if (percentage > 30) return 'low';
    return 'critical';
  };

  const sizeClasses = {
    small: 'h-3 text-xs',
    medium: 'h-4 text-sm',
    large: 'h-6 text-base',
  };

  return (
    <div className={cn('w-full', isBoss && 'max-w-2xl mx-auto')}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1 arcade-font text-white px-1">
          <span className="text-xs">
            {isBoss ? 'PRD BOSS' : health.agentId.toUpperCase()}
          </span>
          <span className="text-xs">
            {Math.max(0, Math.floor(displayHp))} / {health.maxHp}
          </span>
        </div>
      )}

      <div className={cn('hp-bar-container', isFlashing && 'damage-flash')}>
        <div className="relative">
          <div
            className={cn(
              'hp-bar-fill',
              getHpBarColor(),
              sizeClasses[size],
              'transition-all duration-500 ease-out'
            )}
            style={{
              width: `${Math.max(0, percentage)}%`,
            }}
          >
            {/* Segmented effect for retro look */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.3) 8px, rgba(0,0,0,0.3) 10px)',
              }}
            />

            {/* Shine effect */}
            <div
              className="absolute top-0 left-0 right-0 h-1/2 opacity-50"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
