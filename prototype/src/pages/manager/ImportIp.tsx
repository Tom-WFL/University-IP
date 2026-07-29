import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, FileDown, Lock, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/misc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { useStore, type IpDraft } from '@/data/store';
import { SAMPLE_CSV, parseCsv, autoMap, toDrafts, TARGET_FIELDS, type ParsedCsv } from '@/lib/csv';
import { cn } from '@/lib/utils';

const emptyDraft: IpDraft = {
  title: '',
  publicSummary: '',
  confidentialDetail: '',
  disclosureNumber: '',
  field: '',
  inventors: '',
  patentStatus: 'not_filed',
  fundingSource: '',
  ownership: 'bor',
  facultyAttachment: 'attached',
  professorName: '',
  professorEmail: '',
  sendInvite: true,
};

/**
 * Import — the two paths from the meeting in one place: "import that
 * spreadsheet" or "add IP individually with a button". Both land private.
 */
export function ImportIp() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Stagger className="space-y-5">
        <FadeIn>
          <PageHeader
            icon={FileDown}
            title="Import IP"
            subtitle="Bring the portfolio in from a spreadsheet, or add a single disclosure by hand."
          />
        </FadeIn>

        <FadeIn>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex gap-3">
            <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Everything lands private</p>
              <p className="text-sm text-blue-700 mt-0.5">
                Imported IP is visible only to you and this university's IP staff until you deliberately
                publish it. Private is also the valid "hold and decide later" state.
              </p>
            </div>
          </div>
        </FadeIn>

        <FadeIn>
          <Tabs defaultValue="spreadsheet">
            <TabsList>
              <TabsTrigger value="spreadsheet">From a spreadsheet</TabsTrigger>
              <TabsTrigger value="single">Add one disclosure</TabsTrigger>
            </TabsList>
            <TabsContent value="spreadsheet">
              <SpreadsheetImport />
            </TabsContent>
            <TabsContent value="single">
              <SingleAdd />
            </TabsContent>
          </Tabs>
        </FadeIn>
      </Stagger>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spreadsheet path: upload -> map columns -> preview -> import
// ---------------------------------------------------------------------------

type Step = 'upload' | 'map' | 'preview' | 'done';

function SpreadsheetImport() {
  const navigate = useNavigate();
  const addIpItems = useStore((s) => s.addIpItems);
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importedCount, setImportedCount] = useState(0);

  const load = (text: string, name: string) => {
    const result = parseCsv(text);
    setParsed(result);
    setMapping(autoMap(result.headers));
    setFileName(name);
    setStep('map');
  };

  const onFile = async (file: File) => {
    load(await file.text(), file.name);
  };

  const drafts = useMemo(
    () => (parsed ? toDrafts(parsed, mapping) : []),
    [parsed, mapping],
  );
  const validDrafts = drafts.filter((d) => d.valid);
  const invalidDrafts = drafts.filter((d) => !d.valid);

  if (step === 'done') {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-green-600" strokeWidth={3} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Imported {importedCount} disclosure{importedCount === 1 ? '' : 's'}
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            All of them landed private. Open the console to decide who sees each one and where it goes next.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-5">
            <Button variant="gradient" onClick={() => navigate('/manage/ip')}>
              Open the IP Console
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStep('upload');
                setParsed(null);
                setFileName('');
              }}
            >
              Import another file
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {step === 'upload' && 'Step 1 — choose your file'}
          {step === 'map' && 'Step 2 — match your columns'}
          {step === 'preview' && 'Step 3 — check what will be imported'}
        </CardTitle>
        <StepRail step={step} />
      </CardHeader>

      <CardContent className="space-y-4">
        {step === 'upload' && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-gray-300 hover:border-[#ED1C24] hover:bg-orange-50/40 transition-colors p-10 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24] focus-visible:ring-offset-2"
            >
              <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900">Choose a CSV file</p>
              <p className="text-sm text-gray-500 mt-1">
                Export your disclosure spreadsheet as CSV — the columns don't have to match ours.
              </p>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onFile(file);
              }}
            />
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => load(SAMPLE_CSV, 'sdmines-disclosures-sample.csv')}
              >
                No file handy? Use a sample spreadsheet
              </Button>
            </div>
          </>
        )}

        {step === 'map' && parsed && (
          <>
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">{fileName}</span> — {parsed.rows.length} rows.
              We guessed the matches below; change any that look wrong.
            </p>
            <div className="space-y-2">
              {TARGET_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg border border-gray-100 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {field.label}
                      {field.required && <span className="text-[#ED1C24] ml-1">*</span>}
                    </p>
                    <p className="text-xs text-gray-500">{field.help}</p>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-gray-300 rotate-180 sm:rotate-0 justify-self-center hidden sm:block" />
                  <Select
                    value={mapping[field.key] ?? '__none__'}
                    onValueChange={(v) =>
                      setMapping((m) => ({ ...m, [field.key]: v === '__none__' ? '' : v }))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Not mapped" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Not mapped</SelectItem>
                      {parsed.headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep('upload')}>
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button variant="gradient" onClick={() => setStep('preview')} disabled={!mapping.title}>
                Preview {parsed.rows.length} rows
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        {step === 'preview' && parsed && (
          <>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 border border-green-200 px-3 py-1 font-medium">
                <Check className="w-3.5 h-3.5" />
                {validDrafts.length} ready to import
              </span>
              {invalidDrafts.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {invalidDrafts.length} will be skipped
                </span>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
              {drafts.map((d, i) => (
                <div key={i} className={cn('p-3 text-sm', !d.valid && 'bg-amber-50/60')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {d.draft.title || <span className="text-gray-400 italic">No title</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {[d.draft.disclosureNumber, d.draft.field, d.draft.inventors]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </p>
                    </div>
                    {d.valid ? (
                      <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <span className="text-xs text-amber-700 shrink-0">{d.issues.join('; ')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep('map')}>
                <ArrowLeft className="w-4 h-4" />
                Back to mapping
              </Button>
              <Button
                variant="gradient"
                disabled={!validDrafts.length}
                onClick={() => {
                  addIpItems(
                    validDrafts.map((d) => d.draft),
                    'import',
                  );
                  setImportedCount(validDrafts.length);
                  setStep('done');
                }}
              >
                Import {validDrafts.length} as private
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StepRail({ step }: { step: Step }) {
  const order: Step[] = ['upload', 'map', 'preview'];
  const current = order.indexOf(step);
  return (
    <div className="flex gap-1.5 pt-2">
      {order.map((s, i) => (
        <div
          key={s}
          className={cn(
            'h-1 flex-1 rounded-full transition-colors',
            i <= current ? 'bg-gradient-to-r from-[#ED1C24] to-[#F26522]' : 'bg-gray-200',
          )}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single-item path: the USD-derived disclosure form
// ---------------------------------------------------------------------------

function SingleAdd() {
  const navigate = useNavigate();
  const addIpItems = useStore((s) => s.addIpItems);
  const [draft, setDraft] = useState<IpDraft>(emptyDraft);

  const set = <K extends keyof IpDraft>(key: K, value: IpDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const canSubmit = draft.title.trim() && draft.publicSummary.trim();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Disclosure details</CardTitle>
        <p className="text-sm text-gray-500">
          Follows the standard state disclosure form. Only the non-confidential summary is ever published.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title" required className="sm:col-span-2">
            <Input
              value={draft.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Sintered lattice heat exchanger"
            />
          </Field>

          <Field
            label="Non-confidential summary"
            required
            help="This is what gets published. Write it so it's interesting without giving away the invention."
            className="sm:col-span-2"
          >
            <Textarea
              value={draft.publicSummary}
              onChange={(e) => set('publicSummary', e.target.value)}
              rows={3}
              placeholder="What problem does it solve, and for whom?"
            />
          </Field>

          <Field
            label="Confidential detail"
            help="Never published. Visible only to IP staff."
            className="sm:col-span-2"
          >
            <Textarea
              value={draft.confidentialDetail}
              onChange={(e) => set('confidentialDetail', e.target.value)}
              rows={3}
              placeholder="The actual mechanism, claims, data…"
            />
          </Field>

          <Field label="Disclosure number">
            <Input
              value={draft.disclosureNumber}
              onChange={(e) => set('disclosureNumber', e.target.value)}
              placeholder="SDM-2026-014"
            />
          </Field>

          <Field label="Field">
            <Input
              value={draft.field}
              onChange={(e) => set('field', e.target.value)}
              placeholder="Materials / Thermal"
            />
          </Field>

          <Field label="Inventors">
            <Input
              value={draft.inventors}
              onChange={(e) => set('inventors', e.target.value)}
              placeholder="A. Voss, J. Turnbull"
            />
          </Field>

          <Field label="Patent status">
            <Select
              value={draft.patentStatus}
              onValueChange={(v) => set('patentStatus', v as IpDraft['patentStatus'])}
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
              placeholder="NSF MRI + institutional match"
            />
          </Field>

          <Field label="Who owns it" help="Drives what may be published and who has to consent.">
            <Select value={draft.ownership} onValueChange={(v) => set('ownership', v as IpDraft['ownership'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bor">Board of Regents</SelectItem>
                <SelectItem value="student">Student-owned</SelectItem>
                <SelectItem value="entangled">Entangled (faculty + student)</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Faculty involvement">
            <Select
              value={draft.facultyAttachment}
              onValueChange={(v) => set('facultyAttachment', v as IpDraft['facultyAttachment'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attached">Stays attached (day-to-day co-founder)</SelectItem>
                <SelectItem value="idea-only">Idea only (contact for questions)</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Professor name">
            <Input
              value={draft.professorName}
              onChange={(e) => set('professorName', e.target.value)}
              placeholder="Dr. Alan Voss"
            />
          </Field>

          <Field label="Professor email">
            <Input
              type="email"
              value={draft.professorEmail}
              onChange={(e) => set('professorEmail', e.target.value)}
              placeholder="alan.voss@sdmines.edu"
            />
          </Field>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <Switch
            checked={draft.sendInvite}
            onCheckedChange={(v) => set('sendInvite', v)}
            disabled={!draft.professorEmail}
          />
          <div>
            <p className="text-sm font-medium text-gray-900">Send the professor an account invite</p>
            <p className="text-sm text-gray-500">
              Imported professors have no account yet. The invite is how they log in, confirm their
              involvement, and become a Founder.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDraft(emptyDraft)}>
            Clear
          </Button>
          <Button
            variant="gradient"
            disabled={!canSubmit}
            onClick={() => {
              const [id] = addIpItems([draft], 'manual');
              setDraft(emptyDraft);
              if (id) navigate(`/manage/ip/${id}`);
            }}
          >
            Add as private
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  required,
  help,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  help?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label>
        {label}
        {required && <span className="text-[#ED1C24] ml-1">*</span>}
      </Label>
      {children}
      {help && <p className="text-xs text-gray-500">{help}</p>}
    </div>
  );
}
