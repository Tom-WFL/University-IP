import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** The app's empty-state shape: gray icon, heading, body, optional CTA. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
      <Icon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="text-gray-500 mt-1 max-w-md mx-auto text-sm">{body}</p>
      {actionLabel && onAction && (
        <Button variant="gradient" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
