import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Archive,
  EyeOff,
  Hand,
  PencilLine,
  ScrollText,
  Send,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/misc';
import { AuditTimeline } from '@/components/shared/AuditTimeline';
import { Confetti, FadeIn, Stagger } from '@/components/shared/motion';
import { FacultyChip, OwnershipChip, RouteChip, ScopeChip } from '@/components/shared/chips';
import { ScopeStepper } from '@/components/manager/ScopeStepper';
import { RouteSelector } from '@/components/manager/RouteSelector';
import { ProfessorPanel } from '@/components/manager/ProfessorPanel';
import { InterestQueue } from '@/components/manager/InterestQueue';
import { SendToCohortDialog } from '@/components/manager/SendToCohortDialog';
import { SummaryCard } from '@/components/manager/SummaryCard';
import { LiveEditDialog } from '@/components/manager/LiveEditDialog';
import { inventorLine, itemInvolvement, needsSummaryReview, useStore } from '@/data/store';
import { formatDate } from '@/lib/utils';

const patentLabels: Record<string, string> = {
  not_filed: 'Not filed',
  provisional: 'Provisional',
  filed: 'Filed',
  granted: 'Granted',
};

export function IpDetail() {
  const { ipId } = useParams<{ ipId: string }>();
  const navigate = useNavigate();

  const ipItems = useStore((s) => s.ipItems);
  const users = useStore((s) => s.users);
  const invites = useStore((s) => s.invites);
  const handRaises = useStore((s) => s.handRaises);
  const teams = useStore((s) => s.teams);
  const audit = useStore((s) => s.audit);
  const cohortApplications = useStore((s) => s.cohortApplications);
  const cohorts = useStore((s) => s.cohorts);

  const updateScope = useStore((s) => s.updateScope);
  const updateRoute = useStore((s) => s.updateRoute);
  const updateIpItem = useStore((s) => s.updateIpItem);
  const updateSummary = useStore((s) => s.updateSummary);
  const approveSummary = useStore((s) => s.approveSummary);
  const regenerateSummary = useStore((s) => s.regenerateSummary);
  const sendProfessorInvite = useStore((s) => s.sendProfessorInvite);
  const reviewHandRaise = useStore((s) => s.reviewHandRaise);
  const currentUserId = useStore((s) => s.currentUserId);

  const [celebrate, setCelebrate] = useState(false);
  const [cohortDialogTeamId, setCohortDialogTeamId] = useState<string | null>(null);
  const [showConfidential, setShowConfidential] = useState(false);
  // Controlled so the blocked-publish notice can send the user to the summary.
  const [tab, setTab] = useState('manage');
  // Holds an edit to a LIVE summary until it's confirmed.
  const [pendingSummary, setPendingSummary] = useState<string | null>(null);

  const item = ipItems.find((i) => i.id === ipId);

  if (!item) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">That disclosure no longer exists.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/manage/ip')}>
          Back to the console
        </Button>
      </div>
    );
  }

  const professor = users.find((u) => u.id === item.professorId);
  const invite = invites.find((inv) => inv.ipItemId === item.id && inv.role === 'professor');
  const itemHandRaises = handRaises.filter((hr) => hr.ipItemId === item.id);
  const pendingCount = itemHandRaises.filter((hr) => hr.status === 'pending').length;
  const team = teams.find((t) => t.ipItemId === item.id);
  const itemAudit = audit.filter((e) => e.ipItemId === item.id);
  const application = team ? cohortApplications.find((a) => a.teamId === team.id) : undefined;
  const appliedCohort = application ? cohorts.find((c) => c.id === application.cohortId) : undefined;

  const handleReview = (handRaiseId: string, decision: 'approved' | 'declined') => {
    const teamId = reviewHandRaise(handRaiseId, decision);
    if (teamId) {
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 1800);
    }
  };

  /** Private items save straight away; live ones stop for a confirmation. */
  const handleSaveSummary = (text: string) => {
    if (item.publishScope === 'private') {
      updateSummary(item.id, text);
    } else {
      setPendingSummary(text);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Confetti show={celebrate} />
      <Stagger className="space-y-5">
        <FadeIn>
          <Link
            to="/manage/ip"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            IP Console
          </Link>
        </FadeIn>

        {/* Identity header */}
        <FadeIn>
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-[#ED1C24] via-[#f04e23] to-[#F26522] px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/70">
                    {item.disclosure.disclosureNumber || 'No disclosure number'}
                  </p>
                  <h1 className="text-2xl font-bold text-white mt-1 leading-tight">{item.title}</h1>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.shelved && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 border border-white/30 px-2.5 py-1 text-xs font-medium text-white">
                      <Archive className="w-3 h-3" />
                      Shelved
                    </span>
                  )}
                  <Button
                    size="sm"
                    onClick={() => navigate(`/manage/ip/${item.id}/edit`)}
                    className="bg-white/20 border border-white/30 text-white hover:bg-white/30"
                  >
                    <PencilLine className="w-4 h-4" />
                    Edit
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <ScopeChip scope={item.publishScope} />
                <RouteChip route={item.route} />
                <OwnershipChip ownership={item.ownership} />
                <FacultyChip attachment={itemInvolvement(item)} />
              </div>
            </div>
            <div className="bg-white px-6 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Field', value: item.disclosure.field || '—' },
                  { label: 'Patent', value: patentLabels[item.disclosure.patentStatus] },
                  { label: 'Inventors', value: inventorLine(item.inventors) },
                  { label: 'Updated', value: formatDate(item.updatedAt) },
                ].map((meta) => (
                  <div key={meta.label} className="bg-gray-50 rounded-xl p-3 min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{meta.label}</p>
                    <p className="text-sm text-gray-900 mt-0.5 truncate" title={meta.value}>
                      {meta.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </FadeIn>

        {/* Team banner — only once a match has been approved */}
        {team && (
          <FadeIn>
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Team formed · {team.memberIds.length} member{team.memberIds.length === 1 ? '' : 's'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {team.memberIds
                      .map((id) => users.find((u) => u.id === id)?.name ?? 'Unknown')
                      .join(' · ')}
                  </p>
                </div>
                {application && appliedCohort ? (
                  <span className="text-sm text-emerald-700 font-medium shrink-0">
                    Sent to {appliedCohort.name}
                  </span>
                ) : (
                  <Button
                    variant="gradient"
                    size="sm"
                    onClick={() => setCohortDialogTeamId(team.id)}
                    className="shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    Send to I-Corps
                  </Button>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        )}

        <FadeIn>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="manage">Manage</TabsTrigger>
              <TabsTrigger value="content">
                Content
                {needsSummaryReview(item) && (
                  <span
                    className="ml-1.5 w-2 h-2 rounded-full bg-amber-500"
                    aria-label="Summary needs review"
                  />
                )}
              </TabsTrigger>
              <TabsTrigger value="interest">
                Interest
                {pendingCount > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ED1C24] px-1.5 text-xs font-semibold text-white">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
            </TabsList>

            <TabsContent value="manage">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <ScopeStepper
                    item={item}
                    onChange={(scope) => updateScope(item.id, scope)}
                    onReviewSummary={() => setTab('content')}
                  />
                  <Separator />
                  <RouteSelector route={item.route} onChange={(route) => updateRoute(item.id, route)} />
                  <Separator />
                  <ProfessorPanel
                    item={item}
                    professor={professor}
                    invite={invite}
                    onSendInvite={() => sendProfessorInvite(item.id)}
                    onChangeAttachment={(attachment) =>
                      // Involvement lives per inventor now. This item-level
                      // control is a bridge: it sets the designated contact's
                      // role and is replaced by the per-inventor list in the
                      // edit form.
                      updateIpItem(item.id, {
                        inventors: item.inventors.map((inv) =>
                          inv.primary
                            ? {
                                ...inv,
                                role: attachment === 'attached' ? 'involved' : 'contact_only',
                              }
                            : inv,
                        ),
                      })
                    }
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content">
              <div className="space-y-4">
                <SummaryCard
                  item={item}
                  reviewer={users.find((u) => u.id === (item.summaryReviewedBy ?? currentUserId))}
                  onSave={handleSaveSummary}
                  onApprove={() => approveSummary(item.id)}
                  onRegenerate={() => regenerateSummary(item.id)}
                />

                <Card className="border-gray-300">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4 text-gray-400" />
                        <CardTitle className="text-base">Confidential detail</CardTitle>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setShowConfidential((v) => !v)}>
                        {showConfidential ? 'Hide' : 'Reveal'}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Never published at any scope. IP staff only.
                    </p>
                  </CardHeader>
                  <CardContent>
                    {showConfidential ? (
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {item.confidentialDetail || (
                          <span className="text-gray-400 italic">Nothing recorded.</span>
                        )}
                      </p>
                    ) : (
                      <div className="rounded-lg bg-gray-100 h-16 flex items-center justify-center">
                        <p className="text-sm text-gray-400">Hidden</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">Disclosure record</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/manage/ip/${item.id}/edit`)}
                      >
                        <PencilLine className="w-4 h-4" />
                        Edit record
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {[
                        ['Disclosure number', item.disclosure.disclosureNumber || '—'],
                        ['Field', item.disclosure.field || '—'],
                        ['Disclosed', formatDate(item.disclosure.disclosedOn)],
                        ['Patent status', patentLabels[item.disclosure.patentStatus]],
                        ['Funding source', item.disclosure.fundingSource || '—'],
                      ].map(([label, value]) => (
                        <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
                          <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            {label}
                          </dt>
                          <dd className="text-gray-900 mt-0.5">{value}</dd>
                        </div>
                      ))}
                    </dl>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1.5">
                        Inventors
                      </p>
                      {item.inventors.length ? (
                        <ul className="space-y-1.5">
                          {item.inventors.map((inv) => (
                            <li
                              key={inv.id}
                              className="flex flex-wrap items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm"
                            >
                              <span className="text-gray-900 font-medium">{inv.name}</span>
                              {inv.email && <span className="text-gray-500">{inv.email}</span>}
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
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No inventors recorded.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="interest">
              <InterestQueue
                handRaises={itemHandRaises}
                users={users}
                ipItems={ipItems}
                onReview={handleReview}
                emptyBody={
                  item.publishScope === 'private'
                    ? 'Nobody can see this yet. Publish it to campus or wider and interest will show up here.'
                    : 'Published, but nobody has raised a hand yet. Widening the scope reaches more people.'
                }
              />
            </TabsContent>

            <TabsContent value="audit">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <ScrollText className="w-4 h-4 text-gray-400" />
                    <CardTitle className="text-base">Everything that happened to this item</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <AuditTimeline events={itemAudit} users={users} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </FadeIn>

        {pendingCount > 0 && (
          <FadeIn>
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 flex items-center gap-3">
              <Hand className="w-5 h-5 text-orange-600 shrink-0" />
              <p className="text-sm text-orange-900">
                {pendingCount} {pendingCount === 1 ? 'person wants' : 'people want'} to build this. Open the
                Interest tab to review.
              </p>
            </div>
          </FadeIn>
        )}
      </Stagger>

      <SendToCohortDialog teamId={cohortDialogTeamId} onClose={() => setCohortDialogTeamId(null)} />

      <LiveEditDialog
        item={item}
        pendingText={pendingSummary}
        onCancel={() => setPendingSummary(null)}
        onConfirm={(text) => {
          updateSummary(item.id, text);
          setPendingSummary(null);
        }}
      />
    </div>
  );
}
