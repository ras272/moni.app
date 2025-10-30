'use client';

import { cn } from '@/lib/utils';

interface SegmentedProgressBarProps {
  percentage: number;
  color: string;
  segmentCount?: number;
  animated?: boolean;
  className?: string;
}

export function SegmentedProgressBar({
  percentage,
  color,
  segmentCount = 20,
  animated = true,
  className
}: SegmentedProgressBarProps) {
  const isOverBudget = percentage > 100;
  const cappedPercentage = Math.min(percentage, 100);
  const filledSegments = Math.round((cappedPercentage / 100) * segmentCount);

  // Si es > 100%, usar color de alerta
  const displayColor = isOverBudget ? '#f59e0b' : color;

  return (
    <div
      className={cn('relative flex h-2.5 w-full items-center gap-1', className)}
    >
      {Array.from({ length: segmentCount }).map((_, index) => {
        const isFilled = index < filledSegments;
        const delay = animated ? index * 35 : 0; // 35ms delay entre cada círculo

        return (
          <div
            key={index}
            className={cn(
              'aspect-square h-2 rounded-full transition-all duration-300',
              isFilled ? 'scale-100 opacity-100' : 'scale-50 opacity-25',
              isOverBudget && isFilled && 'animate-pulse'
            )}
            style={{
              backgroundColor: isFilled ? displayColor : '#e5e7eb',
              transitionDelay: `${delay}ms`,
              animation:
                isFilled && animated ? 'bounceIn 0.4s ease-out' : 'none',
              boxShadow:
                isOverBudget && isFilled ? `0 0 8px ${displayColor}40` : 'none'
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes bounceIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.8;
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
