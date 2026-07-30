import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Check, FileSpreadsheet, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { PageTitle } from '@/components/shared/primitives';
import { parseCsv } from '@/lib/csv';
import { useDemo } from '@/store/DemoStore';
import { CLASSIFICATIONS } from '@/data/seed';
import { SAMPLE_IMPORT_CSV } from '@/data/sampleImport';
import { cn } from '@/lib/utils';

/** The record fields an imported column can be mapped onto. */
const FIELDS = [
  { key: 'title', label: 'Title', required: true },
  { key: 'inventor', label: 'Inventor name', required: false },
  { key: 'inventorEmail', label: 'Inventor email', required: false },
  { key: 'disclosureDate', label: 'Disclosure date', required: false },
  { key: 'classification', label: 'Classification', required: false },
  { key: 'keywords', label: 'Keywords', required: false },
  { key: 'internal', label: 'Internal description', required: false },
] as const;

type FieldKey = (typeof FIELDS)[number]['key'];

const AUTO: Record<string, FieldKey> = {
  title: 'title',
  name: 'title',
  inventor: 'inventor',
  'inventor name': 'inventor',
  'inventor email': 'inventorEmail',
  email: 'inventorEmail',
  'disclosure date': 'disclosureDate',
  disclosed: 'disclosureDate',
  date: 'disclosureDate',
  classification: 'classification',
  category: 'classification',
  keywords: 'keywords',
  tags: 'keywords',
  'internal description': 'internal',
  description: 'internal',
  notes: 'internal',
};

/** UIP-2 — the bulk load that gets a decades-deep spreadsheet backlog into the app. */
export default function ImportWizard() {
  const navigate = useNavigate();
  const { importIps, persona, institution, state } = useDemo();
  const [step, setStep] = React.useState(1);
  const [rows, setRows] = React.useState<string[][]>([]);
  const [mapping, setMapping] = React.useState<Record<number, FieldKey | 'ignore'>>({});
  const fileRef = React.useRef<HTMLInputElement>(null);

  const headers = rows[0] ?? [];
  const body = rows.slice(1);

  const ingest = (text: string) => {
    const parsed = parseCsv(text);
    if (parsed.length < 2) {
      toast({ title: 'Nothing to import', description: 'That file has no data rows.', variant: 'destructive' });
      return;
    }
    setRows(parsed);
    const auto: Record<number, FieldKey | 'ignore'> = {};
    parsed[0].forEach((h, i) => {
      auto[i] = AUTO[h.trim().toLowerCase()] ?? 'ignore';
    });
    setMapping(auto);
    setStep(2);
  };

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => ingest(String(reader.result ?? ''));
    reader.readAsText(file);
  };

  const loadSample = () => ingest(SAMPLE_IMPORT_CSV);

  const colFor = (key: FieldKey): number => Number(Object.keys(mapping).find((k) => mapping[Number(k)] === key) ?? -1);

  const parsedRows = body.map((r) => {
    const get = (key: FieldKey) => {
      const idx = colFor(key);
      return idx >= 0 ? (r[idx] ?? '').trim() : '';
    };
    const title = get('title');
    const disclosureDate = get('disclosureDate');
    const inventor = get('inventor');
    const warnings: string[] = [];
    if (!disclosureDate) warnings.push('No disclosure date');
    if (!inventor) warnings.push('No inventor named');
    if (title && state.ips.some((ip) => ip.title.toLowerCase() === title.toLowerCase()))
      warnings.push('Title already in the portfolio');
    return {
      title,
      inventor,
      inventorEmail: get('inventorEmail'),
      disclosureDate,
      classification: CLASSIFICATIONS.includes(get('classification')) ? get('classification') : 'Materials',
      keywords: get('keywords'),
      internal: get('internal'),
      warnings,
      valid: !!title,
    };
  });

  const importable = parsedRows.filter((r) => r.valid);

  const doImport = () => {
    if (!persona.institutionId) return;
    const n = importIps(
      importable.map((r) => ({
        title: r.title,
        inventors: r.inventor ? [{ name: r.inventor, email: r.inventorEmail || undefined }] : [],
        disclosureDate: r.disclosureDate || new Date().toISOString().slice(0, 10),
        classification: r.classification,
        keywords: r.keywords.split(/[;,]/).map((k) => k.trim()).filter(Boolean),
        internalDescription: r.internal,
        institutionId: persona.institutionId!,
        source: 'import' as const,
      })),
    );
    toast({
      title: `Imported ${n} record${n === 1 ? '' : 's'}`,
      description: 'All of them landed Private — nothing is visible outside the university yet.',
    });
    navigate('/manager');
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/manager')}
          className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to portfolio
        </button>
        <PageTitle title="Import IP" />
      </div>

      <div className="flex items-center gap-2 text-sm">
        {[1, 2, 3].map((n) => (
          <React.Fragment key={n}>
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                step >= n ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400',
              )}
            >
              {step > n ? <Check className="h-3.5 w-3.5" /> : n}
            </span>
            <span className={cn('text-sm', step >= n ? 'text-gray-900' : 'text-gray-400')}>
              {n === 1 ? 'Choose file' : n === 2 ? 'Map columns' : 'Confirm'}
            </span>
            {n < 3 && <span className="mx-2 h-px w-8 bg-gray-200" />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Upload a spreadsheet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-10 text-center">
              <FileSpreadsheet className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="mb-1 text-sm font-medium text-gray-900">Drop a CSV or Excel export here</p>
              <p className="mb-4 text-xs text-gray-500">
                This prototype reads CSV. Excel support is a real-build item — the column template still needs deciding.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => fileRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Choose file
                </Button>
                <Button variant="outline" onClick={loadSample}>
                  Use the sample file
                </Button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
            </div>
            <p className="text-sm text-gray-500">
              Everything imported lands Private. You decide what gets a summary and what gets released.
            </p>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Map columns ({body.length} rows found)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {headers.map((h, i) => (
                <div key={i} className="space-y-1.5">
                  <p className="text-sm font-medium text-gray-900">{h || `Column ${i + 1}`}</p>
                  <Select
                    value={mapping[i] ?? 'ignore'}
                    onValueChange={(v) => setMapping((m) => ({ ...m, [i]: v as FieldKey | 'ignore' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ignore">Ignore this column</SelectItem>
                      {FIELDS.map((f) => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Inventor</TableHead>
                    <TableHead className="hidden md:table-cell">Disclosed</TableHead>
                    <TableHead>Checks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.slice(0, 8).map((r, i) => (
                    <TableRow key={i} className={r.warnings.length ? 'bg-yellow-50' : undefined}>
                      <TableCell className="text-sm text-gray-900">
                        {r.title || <span className="text-red-600">Missing title — row will be skipped</span>}
                      </TableCell>
                      <TableCell className="hidden text-sm text-gray-600 md:table-cell">{r.inventor || '—'}</TableCell>
                      <TableCell className="hidden text-sm text-gray-600 md:table-cell">
                        {r.disclosureDate || '—'}
                      </TableCell>
                      <TableCell>
                        {r.warnings.length === 0 ? (
                          <Badge variant="outline" className="border-green-200 bg-green-100 text-xs text-green-700">
                            OK
                          </Badge>
                        ) : (
                          <span className="flex items-start gap-1.5 text-xs text-yellow-800">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            {r.warnings.join(' · ')}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedRows.length > 8 && (
                <p className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
                  Showing the first 8 of {parsedRows.length} rows.
                </p>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={importable.length === 0}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Confirm import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-900">
                <span className="font-semibold">{importable.length}</span> record
                {importable.length === 1 ? '' : 's'} will be added to {institution?.name} as{' '}
                <span className="font-semibold">Private</span>.
              </p>
              {parsedRows.length - importable.length > 0 && (
                <p className="mt-1 text-sm text-yellow-800">
                  {parsedRows.length - importable.length} row
                  {parsedRows.length - importable.length === 1 ? '' : 's'} will be skipped for having no title.
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                No summaries are generated on import — each record needs one written and approved before it can be
                released.
              </p>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={doImport}>Import {importable.length} records</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
