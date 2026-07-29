import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CountUp } from './motion';
import { cn } from '@/lib/utils';

export interface Stat {
  label: string;
  value: number;
  icon?: LucideIcon;
  /** Draws attention when there's something waiting on the user. */
  emphasis?: boolean;
}

/** Mirrors super-admin/dashboard/StatsRow.tsx — label above a big bold value. */
export function StatsRow({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className={cn(
              'transition-shadow hover:shadow-md',
              stat.emphasis && stat.value > 0 && 'border-orange-200 bg-orange-50/40',
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-gray-500 leading-snug">{stat.label}</p>
                {Icon && (
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0',
                      stat.emphasis && stat.value > 0 ? 'text-orange-500' : 'text-gray-300',
                    )}
                  />
                )}
              </div>
              <p
                className={cn(
                  'text-2xl font-bold mt-1',
                  stat.emphasis && stat.value > 0 ? 'text-orange-600' : 'text-gray-900',
                )}
              >
                <CountUp value={stat.value} />
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
