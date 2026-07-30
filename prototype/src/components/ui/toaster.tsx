import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

export function Toaster() {
  const { toasts, dismiss } = useToast();
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-bottom-2',
            t.variant === 'destructive' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white',
          )}
        >
          <div className="flex-1">
            {t.title && (
              <p className={cn('text-sm font-semibold', t.variant === 'destructive' ? 'text-red-900' : 'text-gray-900')}>
                {t.title}
              </p>
            )}
            {t.description && (
              <p className={cn('mt-0.5 text-sm', t.variant === 'destructive' ? 'text-red-800' : 'text-gray-500')}>
                {t.description}
              </p>
            )}
          </div>
          <button onClick={() => dismiss(t.id)} className="text-gray-400 hover:text-gray-600" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
