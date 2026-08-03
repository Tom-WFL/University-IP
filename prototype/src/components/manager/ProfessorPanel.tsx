import { Lock, Mail, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/shared/chips';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { inventorLine } from '@/data/store';
import type { InventorRole, Invite, IpItem, User } from '@/data/types';
import { formatDate, initials } from '@/lib/utils';

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
  contactOnlyPolicy,
  schoolName,
  onSetInventorRole,
}: {
  item: IpItem;
  professor: User | undefined;
  invite: Invite | undefined;
  onSendInvite: () => void;
  /** The school has removed the choice — see University.inventorRolePolicy. */
  contactOnlyPolicy: boolean;
  schoolName: string;
  onSetInventorRole: (inventorId: string, role: InventorRole) => void;
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
              {inventorLine(item.inventors)}.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Who wants to be part of it
          </p>
          {contactOnlyPolicy && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 text-xs font-medium">
              <Lock className="w-3 h-3" />
              {schoolName} policy
            </span>
          )}
        </div>

        {contactOnlyPolicy && (
          <p className="text-xs text-blue-900 bg-blue-50 border border-blue-200 rounded-lg p-2.5">
            Inventors here are listed as contacts only and are not offered the choice, so these
            cannot be changed.
          </p>
        )}

        {item.inventors.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No inventors recorded.</p>
        ) : (
          <ul className="space-y-2">
            {item.inventors.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{inv.name}</span>
                    {inv.primary && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 text-xs font-medium">
                        Contact
                      </span>
                    )}
                    {inv.departed && (
                      <span className="inline-flex items-center rounded-full bg-gray-200 text-gray-600 border border-gray-300 px-2 py-0.5 text-xs font-medium">
                        Departed
                      </span>
                    )}
                    {!inv.userId && (
                      <span className="text-xs text-gray-400">no account</span>
                    )}
                  </div>
                </div>

                <Select
                  value={inv.role}
                  disabled={contactOnlyPolicy}
                  onValueChange={(v) => onSetInventorRole(inv.id, v as InventorRole)}
                >
                  <SelectTrigger className="w-full sm:w-52 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="undecided">Not asked yet</SelectItem>
                    <SelectItem value="contact_only">Contact only</SelectItem>
                    <SelectItem value="involved">Involved in the venture</SelectItem>
                  </SelectContent>
                </Select>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-gray-500">
          Anyone marked involved who holds an account joins the team when a match is approved.
        </p>
      </div>
    </div>
  );
}
