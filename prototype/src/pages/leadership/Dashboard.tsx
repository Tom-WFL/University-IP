import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LoadingRows,
  PageTitle,
  PrototypeNote,
  StatCard,
  StatRow,
  StatusBadge,
  VisibilityBadge,
  useFakeLoading,
} from '@/components/shared/primitives';
import { useDemo, useScopedIps } from '@/store/DemoStore';
import { VISIBILITY_LABEL, VISIBILITY_ORDER } from '@/store/types';
import { daysSince, year } from '@/lib/format';

/**
 * UIP-19 / UIP-20 — the read-only view for people above the IP Manager.
 * "They don't need a lot of edit access. But I want to see how much IP do we have in here."
 */
export default function LeadershipDashboard() {
  const { state, institution } = useDemo();
  const ips = useScopedIps();
  const loading = useFakeLoading();

  const raisesFor = (ipId: string) => state.handRaises.filter((h) => h.ipId === ipId).length;
  const totalRaises = ips.reduce((n, ip) => n + raisesFor(ip.id), 0);

  const byTier = VISIBILITY_ORDER.map((tier) => ({
    tier,
    count: ips.filter((ip) => ip.visibility === tier).length,
  }));
  const maxTier = Math.max(1, ...byTier.map((t) => t.count));

  // "Aging" = released a while ago with nobody putting their hand up. The problem the
  // whole module exists to fix, measured.
  const aging = ips
    .slice()
    .sort((a, b) => (daysSince(b.releasedAt ?? b.addedAt) ?? 0) - (daysSince(a.releasedAt ?? a.addedAt) ?? 0));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle title={`Portfolio Analytics — ${institution?.shortName ?? ''}`} />
        <Badge variant="outline" className="border-gray-200 bg-gray-100 text-xs text-gray-600">
          Read-only
        </Badge>
      </div>

      <StatRow>
        <StatCard label="IP added" value={ips.length} />
        <StatCard label="Kept private" value={ips.filter((i) => i.visibility === 'private').length} />
        <StatCard label="Released" value={ips.filter((i) => i.visibility !== 'private').length} />
        <StatCard label="Takers (hand raises)" value={totalRaises} />
        <StatCard
          label="Converted"
          value={ips.filter((i) => i.status === 'converted').length}
          caption="Manager-marked"
        />
      </StatRow>

      <PrototypeNote>
        “Converted” means someone is working on the idea, inside Wildfire or outside it. Conversions that happen
        entirely outside Wildfire have no data source — the IP Manager marks those by hand.
      </PrototypeNote>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Portfolio by release scope</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {byTier.map(({ tier, count }) => (
            <div key={tier} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-sm text-gray-600">{VISIBILITY_LABEL[tier]}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-orange-400" style={{ width: `${(count / maxTier) * 100}%` }} />
              </div>
              <span className="w-8 shrink-0 text-right text-sm font-medium text-gray-900">{count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Aging</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-gray-500">
            How long each disclosure has been sitting, and whether anyone has raised their hand.
          </p>
          {loading ? (
            <LoadingRows count={6} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP</TableHead>
                  <TableHead className="hidden md:table-cell">Disclosed</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Days in system</TableHead>
                  <TableHead>Hand raises</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aging.map((ip) => {
                  const days = daysSince(ip.releasedAt ?? ip.addedAt) ?? 0;
                  const raises = raisesFor(ip.id);
                  const stale = ip.visibility !== 'private' && days > 90 && raises === 0;
                  return (
                    <TableRow key={ip.id}>
                      <TableCell>
                        <span className="text-sm font-medium text-gray-900">
                          #{ip.displayNo} {ip.title}
                        </span>
                        {stale && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-yellow-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                            aging
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-sm text-gray-600 md:table-cell">
                        {year(ip.disclosureDate)}
                      </TableCell>
                      <TableCell>
                        <VisibilityBadge tier={ip.visibility} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ip.status} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{days}</TableCell>
                      <TableCell className="text-sm text-gray-600">{raises}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PrototypeNote>
        Scoped to {institution?.name}. The cross-program funnel — how many people arrive through university IP, do a
        hackathon, then join Wildfire — is a main-app feature, not part of this module.
      </PrototypeNote>
    </div>
  );
}
