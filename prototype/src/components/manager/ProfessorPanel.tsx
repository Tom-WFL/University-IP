import { Mail, UserCheck, UserMinus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/shared/chips';
import type { FacultyAttachment, Invite, IpItem, User } from '@/data/types';
import { formatDate, initials } from '@/lib/utils';
import { cn } from '@/lib/utils';

/**
 * The professor side of an item: who invented it, whether they stay involved,
 * and whether they can actually log in yet (approved recommendation REC-1 —
 * imported professors have no account).
 */
export function ProfessorPanel({
  item,
  professor,
  invite,
  onSendInvite,
  onChangeAttachment,
}: {
  item: IpItem;
  professor: User | undefined;
  invite: Invite | undefined;
  onSendInvite: () => void;
  onChangeAttachment: (attachment: FacultyAttachment) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">The inventor</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Whoever picks this up needs to know if the professor is joining them or just answering questions.
        </p>
      </div>

      {professor ? (
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
          <span className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold flex items-center justify-center shrink-0">
            {initials(professor.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">{professor.name}</p>
            <p className="text-xs text-gray-500 truncate">{professor.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {invite ? (
                <>
                  <StatusChip status={invite.status} />
                  <span className="text-xs text-gray-400">
                    {invite.status === 'accepted'
                      ? `Accepted ${formatDate(invite.acceptedAt ?? invite.sentAt)}`
                      : `Sent ${formatDate(invite.sentAt)}`}
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-500">No account yet — they cannot log in.</span>
              )}
            </div>
          </div>
          {invite?.status !== 'accepted' && (
            <Button variant="outline" size="sm" onClick={onSendInvite} className="shrink-0">
              <Mail className="w-4 h-4" />
              {invite ? 'Resend' : 'Invite'}
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 p-4 flex items-center gap-3">
          <UserPlus className="w-5 h-5 text-gray-300 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-gray-700">No professor attached</p>
            <p className="text-xs text-gray-500">
              Common for older disclosures where the inventor has left. Listed inventors:{' '}
              {item.disclosure.inventors || 'unknown'}.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(
          [
            {
              value: 'attached' as const,
              label: 'Stays attached',
              body: 'Day-to-day co-founder. Joins the team when a match is approved.',
              icon: UserCheck,
            },
            {
              value: 'idea-only' as const,
              label: 'Idea only',
              body: 'Hands it off. Available as a contact for questions.',
              icon: UserMinus,
            },
          ]
        ).map((option) => {
          const Icon = option.icon;
          const active = item.facultyAttachment === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onChangeAttachment(option.value)}
              aria-pressed={active}
              className={cn(
                'text-left rounded-xl border p-3 transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24] focus-visible:ring-offset-2',
                active ? 'border-[#ED1C24] bg-orange-50/60' : 'border-gray-200 hover:shadow-md',
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className={cn('w-4 h-4', active ? 'text-[#ED1C24]' : 'text-gray-400')} />
                <span className="text-sm font-medium text-gray-900">{option.label}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{option.body}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
