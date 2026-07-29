import type { LucideIcon } from 'lucide-react';

/** Page header: tinted icon chip + title + subtitle, as in InvestorPortal.tsx. */
export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-orange-100 shrink-0">
          <Icon className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
