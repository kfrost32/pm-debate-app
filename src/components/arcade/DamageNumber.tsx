import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface DamageNumberProps {
  damage: number;
  isCritical: boolean;
  x: number;
  y: number;
  onComplete?: () => void;
}

export function DamageNumber({
  damage,
  isCritical,
  x,
  y,
  onComplete,
}: DamageNumberProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, isCritical ? 1200 : 1000);

    return () => clearTimeout(timer);
  }, [isCritical, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'damage-number absolute pointer-events-none',
        isCritical ? 'critical arcade-yellow' : 'arcade-red'
      )}
      style={{
        left: x,
        top: y,
        textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
      }}
    >
      {isCritical && (
        <span className="mr-2 arcade-cyan">CRITICAL!</span>
      )}
      -{damage}
    </div>
  );
}
