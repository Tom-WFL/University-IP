import { Link } from 'react-router-dom';
import { ArrowRight, type LucideIcon } from 'lucide-react';

/**
 * A horizontally-scrolling discovery row on the founder home page. Keeps the
 * home page one screen tall while still surfacing everything they can find.
 */
export function DiscoverRail({
  icon: Icon,
  title,
  subtitle,
  seeAllTo,
  seeAllLabel,
  children,
  empty,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  seeAllTo: string;
  seeAllLabel: string;
  children: React.ReactNode;
  empty?: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
            <Icon className="w-4.5 h-4.5 text-orange-500" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 leading-tight">{title}</h2>
            <p className="text-sm text-gray-500 leading-snug">{subtitle}</p>
          </div>
        </div>
        <Link
          to={seeAllTo}
          className="text-sm font-medium text-[#ED1C24] hover:underline shrink-0 inline-flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24] focus-visible:ring-offset-2"
        >
          {seeAllLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {hasChildren ? (
        <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">{children}</div>
      ) : (
        empty
      )}
    </section>
  );
}
