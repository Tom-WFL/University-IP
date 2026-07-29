import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch, Separator } from '@/components/ui/misc';
import { Label } from '@/components/ui/label';
import { Field } from '@/components/shared/Field';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { SummaryCard } from '@/components/manager/SummaryCard';
import { LiveEditDialog } from '@/components/manager/LiveEditDialog';
import { useStore, type IpItemPatch } from '@/data/store';
import type { Inventor, IpItem, User } from '@/data/types';
import { cn } from '@/lib/utils';

/**
 * Correct the whole disclosure record.
 *
 * Spreadsheet imports arrive with typos, missing co-inventors and stale
 * contacts, and a disclosure outlives the people on it — so every field an
 * import can populate has to be fixable afterwards, including who invented the
 * thing and who now speaks for it.
 *
 * The summary is deliberately edited through the SAME component as the detail
 * page (`SummaryCard`), so its review state can't be bypassed by coming in
 * through the form instead.
 */
export function EditIp() {
  const { ipId } = useParams<{ ipId: string }>();
  const navigate = useNavigate();

  const ipItems = useStore((s) => s.ipItems);
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);
  const updateIpItem = useStore((s) => s.updateIpItem);
  const updateSummary = useStore((s) => s.updateSummary);
  const approveSummary = useStore((s) => s.approveSummary);
  const regenerateSummary = useStore((s) => s.regenerateSummary);
  const linkProfessor = useStore((s) => s.linkProfessor);

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

  return (
    <EditIpForm
      key={item.id}
      item={item}
      professors={users.filter(
        (u) => u.persona === 'professor' && u.universityId === item.universityId,
      )}
      reviewer={users.find((u) => u.id === (item.summaryReviewedBy ?? currentUserId))}
      onSaveRecord={(patch) => updateIpItem(item.id, patch)}
      onSaveSummary={(text) => updateSummary(item.id, text)}
      onApproveSummary={() => approveSummary(item.id)}
      onRegenerateSummary={() => regenerateSummary(item.id)}
      onLinkProfessor={(target) => linkProfessor(item.id, target)}
      onDone={() => navigate(`/manage/ip/${item.id}`)}
    />
  );
}

type RecordDraft = {
  title: string;
  confidentialDetail: string;
  inventors: Inventor[];
  disclosureNumber: string;
  field: string;
  disclosedOn: string;
  patentStatus: IpItem['disclosure']['patentStatus'];
  fundingSource: string;
  ownership: IpItem['ownership'];
  facultyAttachment: IpItem['facultyAttachment'];
  shelved: boolean;
};

const toDraft = (item: IpItem): RecordDraft => ({
  title: item.title,
  confidentialDetail: item.confidentialDetail,
  // Copy the array so edits don't mutate store state in place.
  inventors: item.inventors.map((i) => ({ ...i })),
  disclosureNumber: item.disclosure.disclosureNumber,
  field: item.disclosure.field,
  disclosedOn: item.disclosure.disclosedOn.slice(0, 10),
  patentStatus: item.disclosure.patentStatus,
  fundingSource: item.disclosure.fundingSource,
  ownership: item.ownership,
  facultyAttachment: item.facultyAttachment,
  shelved: item.shelved,
});

function EditIpForm({
  item,
  professors,
  reviewer,
  onSaveRecord,
  onSaveSummary,
  onApproveSummary,
  onRegenerateSummary,
  onLinkProfessor,
  onDone,
}: {
  item: IpItem;
  professors: User[];
  reviewer: User | undefined;
  onSaveRecord: (patch: IpItemPatch) => void;
  onSaveSummary: (text: string) => void;
  onApproveSummary: () => void;
  onRegenerateSummary: () => void;
  onLinkProfessor: (target: { userId: string } | { name: string; email: string }) => void;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState<RecordDraft>(() => toDraft(item));
  const [pendingSummary, setPendingSummary] = useState<string | null>(null);
  const [newProfessor, setNewProfessor] = useState({ name: '', email: '' });

  const set = <K extends keyof RecordDraft>(key: K, value: RecordDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(toDraft(item)),
    [draft, item],
  );

  const canSave = draft.title.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSaveRecord({
      title: draft.title.trim(),
      confidentialDetail: draft.confidentialDetail,
      inventors: normaliseInventors(draft.inventors),
      ownership: draft.ownership,
      facultyAttachment: draft.facultyAttachment,
      shelved: draft.shelved,
      disclosure: {
        disclosureNumber: draft.disclosureNumber,
        field: draft.field,
        disclosedOn: new Date(draft.disclosedOn).toISOString(),
        patentStatus: draft.patentStatus,
        fundingSource: draft.fundingSource,
      },
    });
    onDone();
  };

  const handleCancel = () => {
    if (dirty && !window.confirm('Discard your changes to this disclosure?')) return;
    onDone();
  };

  const addInventor = () =>
    set('inventors', [
      ...draft.inventors,
      {
        id: `${item.id}-inv-new-${draft.inventors.length}`,
        name: '',
        email: '',
        // First one added to an empty list is the contact by default.
        primary: draft.inventors.length === 0,
        departed: false,
      },
    ]);

  const patchInventor = (id: string, patch: Partial<Inventor>) =>
    set(
      'inventors',
      draft.inventors.map((inv) => (inv.id === id ? { ...inv, ...patch } : inv)),
    );

  /** Exactly one contact. Choosing a new one clears the old. */
  const makePrimary = (id: string) =>
    set(
      'inventors',
      draft.inventors.map((inv) => ({ ...inv, primary: inv.id === id })),
    );

  const removeInventor = (id: string) => {
    const remaining = draft.inventors.filter((inv) => inv.id !== id);
    // Never strand the list without a contact.
    if (remaining.length && !remaining.some((i) => i.primary)) remaining[0].primary = true;
    set('inventors', remaining);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Stagger className="space-y-5">
        <FadeIn>
          <Link
            to={`/manage/ip/${item.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to the disclosure
          </Link>
        </FadeIn>

        <FadeIn>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit disclosure</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Correct anything the import got wrong. Nothing here changes who can see it.
            </p>
          </div>
        </FadeIn>

        {/* The summary keeps its own review rules — same component as the
            detail page, so the publish gate can't be sidestepped from here. */}
        <FadeIn>
          <SummaryCard
            item={item}
            reviewer={reviewer}
            onSave={(text) =>
              item.publishScope === 'private' ? onSaveSummary(text) : setPendingSummary(text)
            }
            onApprove={onApproveSummary}
            onRegenerate={onRegenerateSummary}
          />
        </FadeIn>

        <FadeIn>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">The disclosure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Title" required>
                <Input value={draft.title} onChange={(e) => set('title', e.target.value)} />
              </Field>

              <Field
                label="Confidential detail"
                help="Never published at any scope. This is what the AI drafts the summary from."
              >
                <Textarea
                  rows={4}
                  value={draft.confidentialDetail}
                  onChange={(e) => set('confidentialDetail', e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Disclosure number">
                  <Input
                    value={draft.disclosureNumber}
                    onChange={(e) => set('disclosureNumber', e.target.value)}
                  />
                </Field>
                <Field label="Field">
                  <Input value={draft.field} onChange={(e) => set('field', e.target.value)} />
                </Field>
                <Field label="Disclosed on">
                  <Input
                    type="date"
                    value={draft.disclosedOn}
                    onChange={(e) => set('disclosedOn', e.target.value)}
                  />
                </Field>
                <Field label="Patent status">
                  <Select
                    value={draft.patentStatus}
                    onValueChange={(v) => set('patentStatus', v as RecordDraft['patentStatus'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_filed">Not filed</SelectItem>
                      <SelectItem value="provisional">Provisional</SelectItem>
                      <SelectItem value="filed">Filed</SelectItem>
                      <SelectItem value="granted">Granted</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Funding source" className="sm:col-span-2">
                  <Input
                    value={draft.fundingSource}
                    onChange={(e) => set('fundingSource', e.target.value)}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Inventors</CardTitle>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Everyone credited on the disclosure. Mark one as the contact.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={addInventor} className="shrink-0">
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {draft.inventors.length === 0 && (
                <p className="text-sm text-gray-400 italic">
                  No inventors recorded. Add at least one so there is somebody to contact.
                </p>
              )}

              {draft.inventors.map((inv) => (
                <div
                  key={inv.id}
                  className={cn(
                    'rounded-xl border p-3 space-y-3',
                    inv.primary ? 'border-blue-200 bg-blue-50/40' : 'border-gray-200',
                  )}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Name">
                      <Input
                        value={inv.name}
                        placeholder="Dr. Jane Turnbull"
                        onChange={(e) => patchInventor(inv.id, { name: e.target.value })}
                      />
                    </Field>
                    <Field label="Email">
                      <Input
                        type="email"
                        value={inv.email}
                        placeholder="j.turnbull@sdmines.example.edu"
                        onChange={(e) => patchInventor(inv.id, { email: e.target.value })}
                      />
                    </Field>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="primary-inventor"
                        checked={inv.primary}
                        onChange={() => makePrimary(inv.id)}
                        className="accent-[#ED1C24]"
                      />
                      Contact for this disclosure
                    </label>

                    {/* The Switch must NOT be nested inside its <label>: it
                        renders a button, so the label would re-dispatch the
                        click to it and the toggle would fire twice, landing
                        back where it started. Pair them with htmlFor instead. */}
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`departed-${inv.id}`}
                        checked={inv.departed}
                        onCheckedChange={(v) => patchInventor(inv.id, { departed: v })}
                      />
                      <Label
                        htmlFor={`departed-${inv.id}`}
                        className="text-sm font-normal text-gray-700 cursor-pointer"
                      >
                        No longer here
                      </Label>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInventor(inv.id)}
                      className="ml-auto text-gray-400 hover:text-red-600"
                      aria-label={`Remove ${inv.name || 'inventor'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Separator />

              <ProfessorLink
                item={item}
                professors={professors}
                newProfessor={newProfessor}
                setNewProfessor={setNewProfessor}
                onLink={onLinkProfessor}
              />
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Who owns it" help="Drives what may be published and who consents.">
                  <Select
                    value={draft.ownership}
                    onValueChange={(v) => set('ownership', v as RecordDraft['ownership'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bor">Board of Regents</SelectItem>
                      <SelectItem value="student">Student-owned</SelectItem>
                      <SelectItem value="entangled">Entangled</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Faculty involvement">
                  <Select
                    value={draft.facultyAttachment}
                    onValueChange={(v) =>
                      set('facultyAttachment', v as RecordDraft['facultyAttachment'])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attached">Stays attached</SelectItem>
                      <SelectItem value="idea-only">Idea only</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
                <Switch
                  id="shelved"
                  checked={draft.shelved}
                  onCheckedChange={(v) => set('shelved', v)}
                  className="mt-0.5"
                />
                <Label htmlFor="shelved" className="text-sm font-normal text-gray-700 cursor-pointer">
                  Shelved back-catalog item
                  <span className="block text-xs text-gray-500">
                    Older IP surfaced by an IP-mining sweep rather than a fresh disclosure.
                  </span>
                </Label>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="gradient" onClick={handleSave} disabled={!canSave}>
              <Save className="w-4 h-4" />
              Save changes
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {dirty && <span className="text-xs text-gray-400 ml-auto">Unsaved changes</span>}
          </div>
        </FadeIn>
      </Stagger>

      <LiveEditDialog
        item={item}
        pendingText={pendingSummary}
        onCancel={() => setPendingSummary(null)}
        onConfirm={(text) => {
          onSaveSummary(text);
          setPendingSummary(null);
        }}
      />
    </div>
  );
}

/** Which professor account speaks for this disclosure — separate from the
 *  inventor list, because most inventors will never log in. */
function ProfessorLink({
  item,
  professors,
  newProfessor,
  setNewProfessor,
  onLink,
}: {
  item: IpItem;
  professors: User[];
  newProfessor: { name: string; email: string };
  setNewProfessor: (v: { name: string; email: string }) => void;
  onLink: (target: { userId: string } | { name: string; email: string }) => void;
}) {
  const attached = professors.find((p) => p.id === item.professorId);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">Professor account</p>
        <p className="text-sm text-gray-500 mt-0.5">
          {attached
            ? `${attached.name} currently speaks for this disclosure.`
            : 'Nobody is attached yet — common for older IP where the inventor has left.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Attach an existing professor">
          <Select
            value={item.professorId ?? ''}
            onValueChange={(userId) => onLink({ userId })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose someone" />
            </SelectTrigger>
            <SelectContent>
              {professors.length === 0 && (
                <SelectItem value="none" disabled>
                  No professor accounts at this school yet
                </SelectItem>
              )}
              {professors.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="space-y-1.5">
          <Field label="Or invite someone new">
            <Input
              placeholder="Name"
              value={newProfessor.name}
              onChange={(e) => setNewProfessor({ ...newProfessor, name: e.target.value })}
            />
          </Field>
          <Input
            type="email"
            placeholder="Email"
            value={newProfessor.email}
            onChange={(e) => setNewProfessor({ ...newProfessor, email: e.target.value })}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={!newProfessor.email.trim()}
            onClick={() => {
              onLink({ name: newProfessor.name, email: newProfessor.email });
              setNewProfessor({ name: '', email: '' });
            }}
          >
            <UserPlus className="w-4 h-4" />
            Attach
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Guarantee exactly one contact and drop blank rows before saving. */
function normaliseInventors(inventors: Inventor[]): Inventor[] {
  const kept = inventors.filter((i) => i.name.trim() || i.email.trim());
  if (kept.length && !kept.some((i) => i.primary)) kept[0].primary = true;
  let seenPrimary = false;
  return kept.map((i) => {
    const primary = i.primary && !seenPrimary;
    if (primary) seenPrimary = true;
    return { ...i, name: i.name.trim(), email: i.email.trim(), primary };
  });
}
