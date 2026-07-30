import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { VISIBILITY_LABEL, type IpStatus, type VisibilityTier } from '@/store/types';

/** Matches the live app's StatsRow: label + number, no icons, no deltas. */
export function StatCard({ label, value, caption }: { label: string; value: React.ReactNode; caption?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {caption && <p className="mt-1 text-xs text-gray-400">{caption}</p>}
      </CardContent>
    </Card>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">{children}</div>;
}

const STATUS_STYLE: Record<string, string> = {
  published: 'bg-green-100 text-green-700 border-green-200',
  converted: 'bg-purple-100 text-purple-700 border-purple-200',
  in_review: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  unreviewed: 'bg-blue-100 text-blue-700 border-blue-200',
  inactive: 'bg-gray-100 text-gray-700 border-gray-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  connected: 'bg-blue-100 text-blue-700 border-blue-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  declined: 'bg-red-100 text-red-700 border-red-200',
  draft: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const STATUS_LABEL: Record<string, string> = {
  in_review: 'In review',
  unreviewed: 'Not reviewed',
  converted: 'Converted',
  published: 'Released',
  inactive: 'Inactive',
};

export function StatusBadge({ status, className }: { status: IpStatus | string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn('text-xs capitalize', STATUS_STYLE[status] ?? STATUS_STYLE.inactive, className)}
    >
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

const VISIBILITY_STYLE: Record<VisibilityTier, string> = {
  private: 'bg-gray-100 text-gray-700 border-gray-200',
  campus: 'bg-blue-100 text-blue-700 border-blue-200',
  statewide: 'bg-purple-100 text-purple-700 border-purple-200',
  network: 'bg-green-100 text-green-700 border-green-200',
};

export function VisibilityBadge({ tier }: { tier: VisibilityTier }) {
  return (
    <Badge variant="outline" className={cn('text-xs', VISIBILITY_STYLE[tier])}>
      {VISIBILITY_LABEL[tier]}
    </Badge>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
      <Icon className="mx-auto mb-4 h-12 w-12 text-gray-300" />
      <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mb-4 text-gray-500">{body}</p>
      {action}
    </div>
  );
}

export function LoadingGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-100" />
      ))}
    </div>
  );
}

export function LoadingRows({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
      ))}
    </div>
  );
}

/** First-mount delay so list screens show their skeleton state at least once per session. */
export function useFakeLoading(ms = 450): boolean {
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}

export function PageTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function FilterBar({ children, cols = 4 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div
        className={cn(
          'grid grid-cols-1 gap-4',
          cols === 2 && 'md:grid-cols-2',
          cols === 3 && 'md:grid-cols-3',
          cols === 4 && 'md:grid-cols-4',
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function PrototypeNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500', className)}>
      {children}
    </div>
  );
}
