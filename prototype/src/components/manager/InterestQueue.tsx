import { Check, Hand, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/shared/chips';
import { EmptyState } from '@/components/shared/EmptyState';
import type { HandRaise, IpItem, User } from '@/data/types';
import { formatDate, initials } from '@/lib/utils';
import { involvedInventors } from '@/data/store';

/**
 * The hand-raise review queue. Approving is the moment a team exists — so the
 * button says exactly that rather than a generic "approve".
 */
export function InterestQueue({
  handRaises,
  users,
  ipItems,
  showItemTitle = false,
  onReview,
  emptyBody,
}: {
  handRaises: HandRaise[];
  users: User[];
  ipItems: IpItem[];
  showItemTitle?: boolean;
  onReview: (handRaiseId: string, decision: 'approved' | 'declined') => void;
  emptyBody: string;
}) {
  if (!handRaises.length) {
    return <EmptyState icon={Hand} title="No hand-raises yet" body={emptyBody} />;
  }

  return (
    <ul className="space-y-3">
      {handRaises.map((hr) => {
        const applicant = users.find((u) => u.id === hr.userId);
        const item = ipItems.find((i) => i.id === hr.ipItemId);
        const pending = hr.status === 'pending';
        // Everyone who said they want in and holds an account joins the team.
        const joiningCount = item ? involvedInventors(item).length : 0;

        return (
          <li key={hr.id} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ED1C24] to-[#F26522] text-white text-sm font-semibold flex items-center justify-center shrink-0">
                {initials(applicant?.name ?? '?')}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{applicant?.name ?? 'Unknown'}</p>
                  <StatusChip status={hr.status} />
                </div>
                <p className="text-xs text-gray-500">
                  {applicant?.title}
                  {applicant && !applicant.universityId && ' · Wildfire Network'}
                </p>
                {showItemTitle && item && (
                  <p className="text-xs text-gray-500 mt-1">
                    on <span className="font-medium text-gray-700">{item.title}</span>
                  </p>
                )}

                <blockquote className="mt-3 rounded-lg bg-gray-50 border-l-2 border-gray-200 px-3 py-2 text-sm text-gray-700">
                  {hr.pitch}
                </blockquote>

                {hr.background && <p className="text-xs text-gray-500 mt-2">{hr.background}</p>}

                <p className="text-xs text-gray-400 mt-2">Raised {formatDate(hr.raisedAt)}</p>

                {pending && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button variant="gradient" size="sm" onClick={() => onReview(hr.id, 'approved')}>
                      <Check className="w-4 h-4" />
                      Approve &amp; form the team
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onReview(hr.id, 'declined')}>
                      <X className="w-4 h-4" />
                      Decline
                    </Button>
                    {joiningCount && (
                      <span className="text-xs text-gray-500 self-center">
                        The professor joins the team too.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
