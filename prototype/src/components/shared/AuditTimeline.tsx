import {
  Building2,
  CheckCircle2,
  FileDown,
  Globe,
  Hand,
  Lock,
  Mail,
  PencilLine,
  Scale,
  Send,
  ShieldCheck,
  Signpost,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import type { AuditAction, AuditEvent, University, User } from '@/data/types';
import { formatDate } from '@/lib/utils';

const actionMeta: Record<AuditAction, { icon: typeof Lock; className: string }> = {
  import: { icon: FileDown, className: 'bg-blue-50 text-blue-600' },
  create: { icon: PencilLine, className: 'bg-blue-50 text-blue-600' },
  edit: { icon: PencilLine, className: 'bg-gray-100 text-gray-500' },
  summary_reviewed: { icon: ShieldCheck, className: 'bg-amber-50 text-amber-600' },
  route: { icon: Signpost, className: 'bg-indigo-50 text-indigo-600' },
  publish: { icon: Globe, className: 'bg-orange-50 text-orange-600' },
  unpublish: { icon: Lock, className: 'bg-gray-100 text-gray-500' },
  invite: { icon: Mail, className: 'bg-teal-50 text-teal-600' },
  hand_raise: { icon: Hand, className: 'bg-yellow-50 text-yellow-600' },
  match_approved: { icon: CheckCircle2, className: 'bg-green-50 text-green-600' },
  match_declined: { icon: XCircle, className: 'bg-gray-100 text-gray-500' },
  team_formed: { icon: Users, className: 'bg-emerald-50 text-emerald-600' },
  cohort_handoff: { icon: Send, className: 'bg-purple-50 text-purple-600' },
  org_provisioned: { icon: Building2, className: 'bg-slate-100 text-slate-600' },
  signup: { icon: UserPlus, className: 'bg-sky-50 text-sky-600' },
  lead_reviewed: { icon: ShieldCheck, className: 'bg-teal-50 text-teal-600' },
  policy_changed: { icon: Scale, className: 'bg-violet-50 text-violet-600' },
};

/**
 * The audit trail (approved recommendation R2/REC-7). Every publish, route
 * change, match decision and handoff lands here with an actor and a time —
 * the defensibility record for a BOR-owned portfolio.
 */
export function AuditTimeline({
  events,
  users,
  universities,
  limit,
}: {
  events: AuditEvent[];
  users: User[];
  /** Supply to attribute Wildfire staff actions to the school they acted on. */
  universities?: University[];
  limit?: number;
}) {
  const shown = limit ? events.slice(0, limit) : events;

  if (!shown.length) {
    return <p className="text-sm text-gray-500">No activity recorded yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {shown.map((event) => {
        const meta = actionMeta[event.action];
        const Icon = meta.icon;
        const actor = users.find((u) => u.id === event.actorId);
        return (
          <li key={event.id} className="flex gap-3">
            <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${meta.className}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm text-gray-900 leading-snug">{event.detail}</p>
              <p className="text-xs text-gray-400 mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <span>
                  {actor?.name ?? 'Unknown'} · {formatDate(event.at)}
                </span>
                {/* A university needs to see at a glance when somebody outside
                    their own office changed their portfolio. Derived from the
                    actor's persona, so it appears on every action they have
                    ever taken rather than only on new ones. */}
                {actor?.persona === 'super_admin' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 text-[11px] font-medium">
                    <Building2 className="w-2.5 h-2.5" />
                    Wildfire Labs
                    {universities && (
                      <>
                        {' · acting for '}
                        {universities.find((u) => u.id === event.universityId)?.shortName ??
                          'the platform'}
                      </>
                    )}
                  </span>
                )}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
