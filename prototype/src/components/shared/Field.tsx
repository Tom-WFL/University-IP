import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * One labelled form field. Shared by the import form and the edit form so a
 * disclosure looks the same whether you are creating it or correcting it.
 */
export function Field({
  label,
  required,
  help,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  help?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label>
        {label}
        {required && <span className="text-[#ED1C24] ml-1">*</span>}
      </Label>
      {children}
      {help && <p className="text-xs text-gray-500">{help}</p>}
    </div>
  );
}
