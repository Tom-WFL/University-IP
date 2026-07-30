import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, FolderOpen, Plus, Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  EmptyState,
  FilterBar,
  LoadingRows,
  PageTitle,
  StatCard,
  StatRow,
  StatusBadge,
  useFakeLoading,
} from '@/components/shared/primitives';
import { AddIpDialog } from '@/components/shared/AddIpDialog';
import { VisibilitySelect } from '@/components/shared/VisibilitySelect';
import { useDemo, useScopedIps } from '@/store/DemoStore';
import { ROUTE_LABEL, VISIBILITY_LABEL, VISIBILITY_ORDER } from '@/store/types';
import { year } from '@/lib/format';

export default function Portfolio() {
  const { state, institution } = useDemo();
  const ips = useScopedIps();
  const navigate = useNavigate();
  const loading = useFakeLoading();

  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [visibility, setVisibility] = React.useState('all');
  const [route, setRoute] = React.useState('all');
  const [addOpen, setAddOpen] = React.useState(false);

  const filtersActive = q !== '' || status !== 'all' || visibility !== 'all' || route !== 'all';

  const filtered = ips.filter((ip) => {
    const hay = `${ip.title} ${ip.inventors.map((i) => i.name).join(' ')} ${ip.keywords.join(' ')}`.toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (status !== 'all' && ip.status !== status) return false;
    if (visibility !== 'all' && ip.visibility !== visibility) return false;
    if (route !== 'all' && ip.route !== route) return false;
    return true;
  });

  const raiseCount = (ipId: string) =>
    state.handRaises.filter((h) => h.ipId === ipId && h.status !== 'declined').length;

  const pendingRaises = ips.reduce(
    (n, ip) => n + state.handRaises.filter((h) => h.ipId === ip.id && h.status === 'pending').length,
    0,
  );

  return (
    <div className="space-y-6">
      <PageTitle
        title={`IP Portfolio — ${institution?.shortName ?? ''}`}
        action={
          <>
            <Button variant="outline" onClick={() => navigate('/manager/import')}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add IP
            </Button>
          </>
        }
      />

      <AddIpDialog open={addOpen} onOpenChange={setAddOpen} />

      <StatRow>
        <StatCard label="Total IP" value={ips.length} />
        <StatCard label="Private" value={ips.filter((i) => i.visibility === 'private').length} />
        <StatCard label="Released" value={ips.filter((i) => i.visibility !== 'private').length} />
        <StatCard label="Pending hand raises" value={pendingRaises} />
        <StatCard label="Converted" value={ips.filter((i) => i.status === 'converted').length} />
      </StatRow>

      <FilterBar>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search title, inventor, keyword"
            className="pl-10"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="unreviewed">Not reviewed</SelectItem>
            <SelectItem value="in_review">In review</SelectItem>
            <SelectItem value="published">Released</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={visibility} onValueChange={setVisibility}>
          <SelectTrigger>
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All visibility</SelectItem>
            {VISIBILITY_ORDER.map((v) => (
              <SelectItem key={v} value={v}>
                {VISIBILITY_LABEL[v]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={route} onValueChange={setRoute}>
          <SelectTrigger>
            <SelectValue placeholder="Route" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All routes</SelectItem>
            <SelectItem value="unassigned">No route yet</SelectItem>
            <SelectItem value="founder">Founder (direct)</SelectItem>
            <SelectItem value="hackathon">Hackathon</SelectItem>
            <SelectItem value="founder_match">Founder Match</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      {loading ? (
        <LoadingRows count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={filtersActive ? 'No IP found' : 'No IP yet'}
          body={
            filtersActive
              ? 'Try adjusting your filters.'
              : 'Import a spreadsheet of existing disclosures, or add one record at a time.'
          }
          action={
            filtersActive ? undefined : (
              <Button onClick={() => navigate('/manager/import')}>
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
            )
          }
        />
      ) : (
        <>
          <p className="text-sm text-gray-500">
            Showing {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="rounded-lg border border-gray-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden lg:table-cell">Inventor</TableHead>
                  <TableHead className="hidden xl:table-cell">Disclosed</TableHead>
                  <TableHead className="hidden xl:table-cell">Route</TableHead>
                  <TableHead className="w-[190px]">Visibility</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Raises</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ip) => (
                  <TableRow key={ip.id}>
                    <TableCell className="font-medium text-gray-500">#{ip.displayNo}</TableCell>
                    <TableCell>
                      <Link to={`/manager/ip/${ip.id}`} className="font-medium text-gray-900 hover:text-orange-600">
                        {ip.title}
                      </Link>
                      <p className="text-xs text-gray-400">{ip.classification}</p>
                    </TableCell>
                    <TableCell className="hidden text-sm text-gray-600 lg:table-cell">
                      {ip.inventors[0]?.name}
                      {ip.inventors[0]?.retired && <span className="text-gray-400"> (retired)</span>}
                    </TableCell>
                    <TableCell className="hidden text-sm text-gray-600 xl:table-cell">
                      {year(ip.disclosureDate)}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <Badge variant="outline" className="text-xs">
                        {ROUTE_LABEL[ip.route]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <VisibilitySelect ip={ip} compact />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ip.status} />
                    </TableCell>
                    <TableCell className="hidden text-sm text-gray-600 md:table-cell">{raiseCount(ip.id)}</TableCell>
                    <TableCell>
                      <Link to={`/manager/ip/${ip.id}`} aria-label={`Open ${ip.title}`}>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
