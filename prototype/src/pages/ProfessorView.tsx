import { useState } from 'react';
import { Check, GraduationCap, Hand, Mail, UserCheck, UserMinus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { FacultyChip, ScopeChip, StatusChip } from '@/components/shared/chips';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { itemInvolvement, useCurrentUser, useStore } from '@/data/store';
import { cn, formatDate } from '@/lib/utils';
import type { InventorRole } from '@/data/types';

/**
 * The professor's slice: the invite that gives them an account (REC-1), the
 * involvement decision, and visibility into who wants their idea.
 */
export function ProfessorView() {
  const user = useCurrentUser();
  const ipItems = useStore((s) => s.ipItems);
  const invites = useStore((s) => s.invites);
  const handRaises = useStore((s) => s.handRaises);
  const universities = useStore((s) => s.universities);
  const teams = useStore((s) => s.teams);
  const users = useStore((s) => s.users);
  const acceptInvite = useStore((s) => s.acceptInvite);

  const myItems = ipItems.filter((i) => i.professorId === user.id);
  const pendingInvite = invites.find((inv) => inv.email === user.email && inv.status === 'sent');
  const pendingItem = pendingInvite ? ipItems.find((i) => i.id === pendingInvite.ipItemId) : undefined;

  const [choice, setChoice] = useState<InventorRole>('involved');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Stagger className="space-y-5">
        <FadeIn>
          <PageHeader
            icon={GraduationCap}
            title="My idea"
            subtitle="Your disclosure in the Wildfire app, and who wants to build it."
          />
        </FadeIn>

        {/* The invite — this is how an imported professor gets an account. */}
        {pendingInvite && pendingItem && (
          <FadeIn>
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0">
                    <Mail className="w-4.5 h-4.5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {universities.find((u) => u.id === pendingInvite.universityId)?.shortName} invited you
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Your disclosure "{pendingItem.title}" is in the platform. Sent{' '}
                      {formatDate(pendingInvite.sentAt)}.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">
                  Before anyone picks this up, tell them how involved you want to be. You can change this later.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      {
                        value: 'involved' as const,
                        label: "I'm in",
                        body: 'Join the team as a day-to-day co-founder when someone is matched.',
                        icon: UserCheck,
                      },
                      {
                        value: 'contact_only' as const,
                        label: 'Just a contact',
                        body: 'Hand it off. Happy to answer questions, but not building it.',
                        icon: UserMinus,
                      },
                    ]
                  ).map((option) => {
                    const Icon = option.icon;
                    const active = choice === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setChoice(option.value)}
                        aria-pressed={active}
                        className={cn(
                          'text-left rounded-xl border bg-white p-4 transition-all duration-200',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24] focus-visible:ring-offset-2',
                          active ? 'border-[#ED1C24] shadow-sm' : 'border-gray-200 hover:shadow-md',
                        )}
                      >
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center mb-2',
                            active
                              ? 'bg-gradient-to-br from-[#ED1C24] to-[#F26522] text-white'
                              : 'bg-gray-100 text-gray-500',
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">{option.label}</p>
                        <p className="text-xs text-gray-500 mt-1">{option.body}</p>
                      </button>
                    );
                  })}
                </div>

                <Button variant="gradient" onClick={() => acceptInvite(pendingInvite.id, choice)}>
                  <Check className="w-4 h-4" />
                  Accept and continue
                </Button>
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {myItems.length === 0 ? (
          <FadeIn>
            <EmptyState
              icon={GraduationCap}
              title="Nothing associated with you yet"
              body="When your university's IP manager imports one of your disclosures and associates it with you, it will show up here."
            />
          </FadeIn>
        ) : (
          myItems.map((item) => {
            const interest = handRaises.filter((hr) => hr.ipItemId === item.id);
            const team = teams.find((t) => t.ipItemId === item.id);
            return (
              <FadeIn key={item.id}>
                <Card className="rounded-2xl border-gray-100">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h2 className="font-semibold text-gray-900 text-lg leading-snug">{item.title}</h2>
                      <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{item.publicSummary}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <ScopeChip scope={item.publishScope} />
                      <FacultyChip attachment={itemInvolvement(item)} />
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4">
                      <div className="flex items-center gap-2">
                        <Hand className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900">
                          {interest.length === 0
                            ? 'Nobody has raised a hand yet'
                            : `${interest.length} ${interest.length === 1 ? 'person has' : 'people have'} raised a hand`}
                        </p>
                      </div>
                      {interest.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {interest.map((hr) => {
                            const applicant = users.find((u) => u.id === hr.userId);
                            return (
                              <li key={hr.id} className="flex items-center gap-2 text-sm text-gray-600">
                                <span>{applicant?.name}</span>
                                <StatusChip status={hr.status} />
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Your IP manager decides who gets matched.
                      </p>
                    </div>

                    {team && (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                        <p className="text-sm font-medium text-gray-900">A team is building this</p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {team.memberIds
                            .map((id) => users.find((u) => u.id === id)?.name)
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </FadeIn>
            );
          })
        )}
      </Stagger>
    </div>
  );
}
