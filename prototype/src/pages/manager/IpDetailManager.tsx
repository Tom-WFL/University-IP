import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Eye,
  Lock,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { StatusBadge, VisibilityBadge } from '@/components/shared/primitives';
import { GuardrailPanel } from '@/components/shared/GuardrailPanel';
import { VisibilitySelect } from '@/components/shared/VisibilitySelect';
import { HandRaiseActions } from '@/components/shared/HandRaiseActions';
import { useDemo } from '@/store/DemoStore';
import { CLASSIFICATIONS } from '@/data/seed';
import { formatDate } from '@/lib/format';
import { ROUTE_LABEL, type Involvement, type IpRoute } from '@/store/types';

const EVENT_LABEL: Record<string, string> = {
  viewed_summary: 'Viewed summary',
  nda_accepted: 'Accepted NDA',
  hand_raise: 'Raised hand',
  deep_link_signup: 'Signed up from a shared link',
};

export default function IpDetailManager() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const {
    state,
    persona,
    institution,
    updateIp,
    generateSummary,
    updateSummaryText,
    approveSummary,
    setRoute,
    setInvolvement,
  } = useDemo();

  const ip = state.ips.find((i) => i.id === id);
  const [generating, setGenerating] = React.useState(false);
  const [approveAnyway, setApproveAnyway] = React.useState(false);
  const [archiveOpen, setArchiveOpen] = React.useState(false);
  const [draftText, setDraftText] = React.useState(ip?.summary?.text ?? '');

  React.useEffect(() => {
    setDraftText(ip?.summary?.text ?? '');
  }, [ip?.summary?.text, ip?.id]);

  if (!ip) {
    return (
      <div className="space-y-4">
        <p className="text-gray-500">That IP record is not in this portfolio.</p>
        <Button variant="outline" onClick={() => navigate('/manager')}>
          Back to portfolio
        </Button>
      </div>
    );
  }

  const raises = state.handRaises.filter((h) => h.ipId === ip.id);
  const log = state.accessLog.filter((a) => a.ipId === ip.id).slice().reverse();
  const flags = ip.summary?.guardrailFlags ?? [];
  const forceContactOnly = !!institution?.forceContactOnly;

  const doGenerate = async () => {
    setGenerating(true);
    await generateSummary(ip.id);
    setGenerating(false);
    toast({ title: 'Draft summary generated', description: 'Review it against the criteria before approving.' });
  };

  const doApprove = () => {
    if (flags.length > 0 && !approveAnyway) {
      setApproveAnyway(true);
      return;
    }
    approveSummary(ip.id, persona.name);
    setApproveAnyway(false);
    toast({ title: 'Summary approved', description: 'This IP can now be released.' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/manager"
            className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to portfolio
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{ip.title}</h1>
            <Badge variant="outline" className="text-xs text-gray-500">
              IP #{ip.displayNo}
            </Badge>
            <StatusBadge status={ip.status} />
            <VisibilityBadge tier={ip.visibility} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {institution?.name}
            </span>
            <span className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              {ip.classification}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Disclosed {formatDate(ip.disclosureDate)}
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={() => setArchiveOpen(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Archive
        </Button>
      </div>

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this IP?</AlertDialogTitle>
            <AlertDialogDescription>
              It moves to Private and Inactive. It stays in the portfolio and in the analytics counts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                updateIp(ip.id, { status: 'inactive', visibility: 'private', releasedAt: undefined });
                setArchiveOpen(false);
                toast({ title: 'Archived', description: `IP #${ip.displayNo} is inactive and private.` });
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Record details — UIP-4 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Record details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="d-title">Title</Label>
              <Input id="d-title" value={ip.title} onChange={(e) => updateIp(ip.id, { title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-date">Disclosure date</Label>
              <Input
                id="d-date"
                type="date"
                value={ip.disclosureDate.slice(0, 10)}
                onChange={(e) => updateIp(ip.id, { disclosureDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Classification</Label>
              <Select value={ip.classification} onValueChange={(v) => updateIp(ip.id, { classification: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLASSIFICATIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-keywords">Keywords</Label>
              <Input
                id="d-keywords"
                value={ip.keywords.join(', ')}
                onChange={(e) =>
                  updateIp(ip.id, { keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean) })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Inventors</Label>
            {ip.inventors.map((inv, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2">
                <Input
                  className="min-w-[140px] flex-1"
                  value={inv.name}
                  onChange={(e) =>
                    updateIp(ip.id, {
                      inventors: ip.inventors.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)),
                    })
                  }
                />
                <Input
                  className="min-w-[160px] flex-1"
                  placeholder="Email"
                  value={inv.email ?? ''}
                  onChange={(e) =>
                    updateIp(ip.id, {
                      inventors: ip.inventors.map((x, i) => (i === idx ? { ...x, email: e.target.value } : x)),
                    })
                  }
                />
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <Checkbox
                    checked={!!inv.retired}
                    onCheckedChange={(v) =>
                      updateIp(ip.id, {
                        inventors: ip.inventors.map((x, i) => (i === idx ? { ...x, retired: !!v } : x)),
                      })
                    }
                  />
                  Retired
                </label>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateIp(ip.id, { inventors: [...ip.inventors, { name: '', email: '' }] })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add inventor
            </Button>
            {ip.inventors.some((i) => i.retired) && (
              <p className="text-xs text-gray-500">
                A retired inventor has no active department contact — decades-old disclosures often start here.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="d-internal">Internal description</Label>
            <Textarea
              id="d-internal"
              className="min-h-[110px] resize-y"
              value={ip.internalDescription}
              onChange={(e) => updateIp(ip.id, { internalDescription: e.target.value })}
            />
            <p className="text-xs text-gray-500">Internal only — never rendered on a founder-facing screen.</p>
          </div>
        </CardContent>
      </Card>

      {/* AI summary — UIP-8 / UIP-9 / UIP-10 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Concept summary (AI)</CardTitle>
            <div className="flex items-center gap-2">
              {ip.summary && (
                <Badge
                  variant="outline"
                  className={
                    ip.summary.status === 'approved'
                      ? 'border-green-200 bg-green-100 text-xs text-green-700'
                      : 'border-yellow-200 bg-yellow-100 text-xs text-yellow-700'
                  }
                >
                  {ip.summary.status === 'approved' ? 'Approved' : 'Draft — needs approval'}
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={doGenerate} disabled={generating}>
                <Sparkles className="mr-2 h-4 w-4" />
                {generating ? 'Synthesizing…' : ip.summary ? 'Regenerate' : 'Generate summary'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            This is what a founder reads. It should convey what the idea is for — never how it is done.
          </p>

          {generating && (
            <div className="animate-pulse rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
              Synthesizing a concept-only summary…
            </div>
          )}

          {!generating && !ip.summary && (
            <div className="rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              No summary yet. Generate one, edit it, then approve it — an IP cannot leave Private without an approved
              summary.
            </div>
          )}

          {!generating && ip.summary && (
            <>
              <Textarea
                className="min-h-[160px] resize-y"
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                onBlur={() => {
                  if (draftText !== ip.summary?.text) {
                    updateSummaryText(ip.id, draftText);
                    toast({
                      title: 'Summary edited',
                      description: 'Edited summaries go back to draft and need approving again.',
                    });
                  }
                }}
              />
              <GuardrailPanel flags={flags} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-gray-500">
                  {ip.summary.status === 'approved'
                    ? `Approved by ${ip.summary.approvedBy} on ${formatDate(ip.summary.approvedAt)} · version ${ip.summary.version}`
                    : `Draft version ${ip.summary.version} — not visible to anyone outside the university`}
                </p>
                {ip.summary.status !== 'approved' && <Button onClick={doApprove}>Approve summary</Button>}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={approveAnyway} onOpenChange={setApproveAnyway}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Guardrail flags are still outstanding</AlertDialogTitle>
            <AlertDialogDescription>
              {flags.length} phrase{flags.length === 1 ? '' : 's'} in this summary match the non-disclosure criteria.
              Approving publishes the text as written.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back and edit</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                approveSummary(ip.id, persona.name);
                setApproveAnyway(false);
                toast({ title: 'Approved with flags outstanding', variant: 'destructive' });
              }}
            >
              Approve anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Visibility + route + involvement */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Visibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <VisibilitySelect ip={ip} />
            <p className="text-sm text-gray-500">
              {institution?.releasePolicy === 'staged'
                ? `${institution.shortName} policy: release campus-first, let it sit, then widen to statewide and the national network.`
                : `${institution?.shortName} policy: wide net — release straight to the national network.`}
            </p>
            {ip.releasedAt && <p className="text-xs text-gray-400">Released {formatDate(ip.releasedAt)}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Commercialization route</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={ip.route} onValueChange={(v) => setRoute(ip.id, v as IpRoute)} className="gap-3">
              {(
                [
                  ['founder', 'A founder is already identified. The IP stays private and they sign an NDA directly.'],
                  ['hackathon', 'Becomes a pickable hackathon idea. Hackathons are in person, so reach is local.'],
                  ['founder_match', 'Goes into Founder Match so founders at the released scope can raise their hand.'],
                ] as [IpRoute, string][]
              ).map(([value, help]) => (
                <label key={value} className="flex cursor-pointer items-start gap-3">
                  <RadioGroupItem value={value} id={`route-${value}`} className="mt-1" />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">{ROUTE_LABEL[value]}</span>
                    <span className="block text-xs text-gray-500">{help}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      {/* Inventor involvement — UIP-17 / UIP-18 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Inventor involvement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <RadioGroup
            value={ip.involvement}
            onValueChange={(v) => setInvolvement(ip.id, v as Involvement)}
            className="gap-3"
          >
            <label className="flex cursor-pointer items-start gap-3">
              <RadioGroupItem value="contact_only" id="inv-contact" className="mt-1" />
              <span>
                <span className="block text-sm font-medium text-gray-900">Contact only</span>
                <span className="block text-xs text-gray-500">
                  The inventor is a contact; whoever takes the idea runs with it.
                </span>
              </span>
            </label>
            <label
              className={`flex items-start gap-3 ${forceContactOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <RadioGroupItem value="involved" id="inv-involved" className="mt-1" disabled={forceContactOnly} />
              <span>
                <span className="block text-sm font-medium text-gray-900">Wants to be involved</span>
                <span className="block text-xs text-gray-500">
                  The inventor works alongside the founder day to day.
                </span>
              </span>
            </label>
          </RadioGroup>

          {forceContactOnly && (
            <p className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
              <Lock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              Institution policy: inventors are contacts only. Change it in Institution Settings.
            </p>
          )}
          {ip.involvementSetBeforePolicy && ip.involvement === 'involved' && (
            <p className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
              Set before the contact-only policy was turned on — left as-is rather than changed silently.
            </p>
          )}
          <p className="text-xs text-gray-500">
            Professors are often career-disincentivized from founding a company, which is why most records sit at
            contact-only.
          </p>
        </CardContent>
      </Card>

      {/* Hand raises on this IP */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Hand raises ({raises.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {raises.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">No founder has raised their hand on this IP yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Founder</TableHead>
                  <TableHead className="hidden md:table-cell">Note</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {raises.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-gray-900">{r.founderName}</TableCell>
                    <TableCell className="hidden max-w-sm text-sm text-gray-600 md:table-cell">
                      {r.note ?? <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>
                      <HandRaiseActions raise={r} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Access log — MB-2 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-gray-400" />
            <CardTitle>Who has seen this</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-gray-500">
            The record behind requiring an account: if a summary shows up somewhere it shouldn't, this is who had it.
          </p>
          {log.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">No access recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {log.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm text-gray-900">
                      <span className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        {entry.userName}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{EVENT_LABEL[entry.event] ?? entry.event}</TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDate(entry.at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
