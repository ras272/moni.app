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
  const filledSegments = Math.round((percentage / 100) * segmentCount);

  return (
    <div className={cn('flex h-2.5 w-full items-center gap-1', className)}>
      {Array.from({ length: segmentCount }).map((_, index) => {
        const isFilled = index < filledSegments;
        const delay = animated ? index * 35 : 0; // 35ms delay entre cada círculo

        return (
          <div
            key={index}
            className={cn(
              'aspect-square h-2 rounded-full transition-all duration-300',
              isFilled ? 'scale-100 opacity-100' : 'scale-50 opacity-25'
            )}
            style={{
              backgroundColor: isFilled ? color : '#e5e7eb',
              transitionDelay: `${delay}ms`,
              animation:
                isFilled && animated ? 'bounceIn 0.4s ease-out' : 'none'
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
