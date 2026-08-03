import { useMemo, useState } from 'react';
import { AlertTriangle, Plus, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { Field } from '@/components/shared/Field';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { useActiveUniversity, useStore } from '@/data/store';
import type { InventorRolePolicy, RedactionCriterion } from '@/data/types';
import { cn } from '@/lib/utils';

/**
 * The two school-level decisions that shape everything else.
 *
 * Release criteria are the answer to "make the prompt very strict about what
 * cannot be shared." Holding them as editable data rather than as prompt text
 * buried in a service means a tech transfer office can read the constraints,
 * argue with them, and add the one their own lawyers care about — and the
 * reviewer ticks them one at a time instead of clicking through a single
 * blanket confirmation.
 */
export function PolicyPage() {
  const university = useActiveUniversity();
  const ipItems = useStore((s) => s.ipItems);
  const updateRedactionPolicy = useStore((s) => s.updateRedactionPolicy);
  const setInventorRolePolicy = useStore((s) => s.setInventorRolePolicy);

  const [draft, setDraft] = useState<RedactionCriterion[]>(() => university?.redactionPolicy ?? []);

  const saved = university?.redactionPolicy ?? [];
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  // Adding a criterion invalidates every attestation made before it existed.
  // Say how many items that is, rather than letting it be a surprise.
  const affected = useMemo(() => {
    if (!university) return 0;
    const addedIds = draft
      .map((c) => c.id)
      .filter((id) => !saved.some((c) => c.id === id));
    if (!addedIds.length) return 0;
    return ipItems.filter(
      (i) => i.universityId === university.id && i.publishScope !== 'private',
    ).length;
  }, [draft, saved, ipItems, university]);

  if (!university) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">
        No university selected.
      </div>
    );
  }

  const patch = (id: string, next: Partial<RedactionCriterion>) =>
    setDraft((d) => d.map((c) => (c.id === id ? { ...c, ...next } : c)));

  const add = () =>
    setDraft((d) => [
      ...d,
      { id: `custom-${d.length + 1}-${Date.now().toString(36)}`, label: '', help: '' },
    ]);

  const remove = (id: string) => setDraft((d) => d.filter((c) => c.id !== id));

  const canSave = dirty && draft.every((c) => c.label.trim());

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Stagger className="space-y-5">
        <FadeIn>
          <PageHeader
            icon={ShieldCheck}
            title="Release policy"
            subtitle={`How ${university.shortName} decides what may leave the IP office, and what inventors are offered.`}
          />
        </FadeIn>

        {/* --- Inventor roles ------------------------------------------- */}
        <FadeIn>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Inventor participation</CardTitle>
              <p className="text-sm text-gray-500 mt-0.5">
                Whether inventors here are offered the choice to join a venture, or are always
                listed as a point of contact.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="What inventors may choose">
                <Select
                  value={university.inventorRolePolicy}
                  onValueChange={(v) => setInventorRolePolicy(university.id, v as InventorRolePolicy)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inventor_chooses">
                      Inventors choose — contact only, or involved
                    </SelectItem>
                    <SelectItem value="contact_only">
                      Contact only — no choice offered
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {university.inventorRolePolicy === 'contact_only' && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                  Inventors are not asked. The role control is locked on every disclosure and on the
                  inventor&rsquo;s own invite screen, and anyone previously marked involved has been
                  moved to contact only.
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* --- Release criteria ----------------------------------------- */}
        <FadeIn>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Release criteria</CardTitle>
                  <p className="text-sm text-gray-500 mt-0.5">
                    What a summary must never contain. The model is told to write to these, and the
                    reviewer confirms each one before anything can be published.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={add} className="shrink-0">
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {draft.length === 0 && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  With no criteria, nothing stands between a draft and a campus. Add at least one.
                </p>
              )}

              {draft.map((c, index) => (
                <div key={c.id} className="rounded-xl border border-gray-200 p-3 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-2 w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold flex items-center justify-center shrink-0 tabular-nums">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0 space-y-2">
                      <Field label="Criterion">
                        <Input
                          value={c.label}
                          placeholder="No formulations, parameters or process conditions"
                          onChange={(e) => patch(c.id, { label: e.target.value })}
                        />
                      </Field>
                      <Field label="Why it matters">
                        <Textarea
                          rows={2}
                          value={c.help}
                          placeholder="Shown under the checkbox so a reviewer knows what to look for."
                          onChange={(e) => patch(c.id, { help: e.target.value })}
                        />
                      </Field>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(c.id)}
                      className="text-gray-400 hover:text-red-600 shrink-0"
                      aria-label={`Remove criterion ${index + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {affected > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-900">
                    Adding a criterion means {affected} already-published item
                    {affected === 1 ? '' : 's'} {affected === 1 ? 'has' : 'have'} not been checked
                    against it. {affected === 1 ? 'It stays' : 'They stay'} visible, but will need
                    re-checking before {affected === 1 ? 'its' : 'their'} scope can widen again.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  variant="gradient"
                  disabled={!canSave}
                  onClick={() => updateRedactionPolicy(university.id, draft)}
                >
                  <Save className="w-4 h-4" />
                  Save criteria
                </Button>
                {dirty && (
                  <Button variant="outline" onClick={() => setDraft(saved)}>
                    Discard
                  </Button>
                )}
                <span className={cn('text-xs ml-auto', dirty ? 'text-amber-600' : 'text-gray-400')}>
                  {dirty ? 'Unsaved changes' : `${saved.length} criteria in force`}
                </span>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </Stagger>
    </div>
  );
}
