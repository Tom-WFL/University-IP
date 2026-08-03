import { useNavigate } from 'react-router-dom';
import { Building2, Hand } from 'lucide-react';
import { FacultyChip, ScopeChip } from '@/components/shared/chips';
import type { IpItem, University } from '@/data/types';
import { cn } from '@/lib/utils';
import { itemInvolvement } from '@/data/store';

/**
 * A published IP item as a founder sees it. Renders `publicSummary` only —
 * `confidentialDetail` is never passed anywhere near this component.
 */
export function IpCard({
  item,
  university,
  interestCount,
  myStatus,
  compact = false,
}: {
  item: IpItem;
  university: University | undefined;
  interestCount: number;
  myStatus?: 'pending' | 'approved' | 'declined';
  compact?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/discover/${item.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/discover/${item.id}`);
        }
      }}
      className={cn(
        'group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 cursor-pointer',
        'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24] focus-visible:ring-offset-2',
        compact && 'w-72 shrink-0',
      )}
    >
      {/* Provenance first — a founder needs to know whose IP this is. */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Building2 className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">University IP · {university?.shortName ?? 'Unknown'}</span>
      </div>

      <div className="min-w-0">
        <h3 className="font-semibold text-gray-900 group-hover:text-[#ED1C24] transition-colors leading-snug">
          {item.title}
        </h3>
        <p className={cn('text-sm text-gray-600 mt-1.5 leading-relaxed', compact ? 'line-clamp-3' : 'line-clamp-4')}>
          {item.publicSummary}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-1">
        <FacultyChip attachment={itemInvolvement(item)} />
        {!compact && <ScopeChip scope={item.publishScope} showIcon={false} />}
        {myStatus && (
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border',
              myStatus === 'approved'
                ? 'bg-green-100 text-green-700 border-green-200'
                : myStatus === 'pending'
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200',
            )}
          >
            <Hand className="w-3 h-3" />
            {myStatus === 'approved'
              ? "You're on this"
              : myStatus === 'pending'
                ? 'Hand raised'
                : 'Not selected'}
          </span>
        )}
        {interestCount > 0 && !myStatus && (
          <span className="text-xs text-gray-400 ml-auto">
            {interestCount} interested
          </span>
        )}
      </div>
    </article>
  );
}
