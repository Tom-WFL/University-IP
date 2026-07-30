import * as React from 'react';
import { Link } from 'react-router-dom';
import { Hand } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  EmptyState,
  LoadingRows,
  PageTitle,
  StatCard,
  StatusBadge,
  useFakeLoading,
} from '@/components/shared/primitives';
import { HandRaiseActions } from '@/components/shared/HandRaiseActions';
import { useDemo, useScopedIps } from '@/store/DemoStore';
import { formatDate } from '@/lib/format';

/** UIP-14 — the manager's queue of founders who put their hand up. */
export default function HandRaiseQueue() {
  const { state } = useDemo();
  const ips = useScopedIps();
  const loading = useFakeLoading();

  const ipById = new Map(ips.map((i) => [i.id, i]));
  const raises = state.handRaises
    .filter((h) => ipById.has(h.ipId))
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const count = (s: string) => raises.filter((r) => r.status === s).length;

  return (
    <div className="space-y-6">
      <PageTitle title="Hand Raises" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pending" value={count('pending')} />
        <StatCard label="Connected" value={count('connected')} />
        <StatCard label="Approved" value={count('approved')} />
        <StatCard label="Declined" value={count('declined')} />
      </div>

      {loading ? (
        <LoadingRows count={5} />
      ) : raises.length === 0 ? (
        <EmptyState
          icon={Hand}
          title="No hand raises yet"
          body="When a founder finds one of your released ideas and puts their hand up, it lands here."
        />
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Founder</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="hidden lg:table-cell">Note</TableHead>
                <TableHead className="hidden md:table-cell">Raised</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {raises.map((r) => {
                const ip = ipById.get(r.ipId);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-gray-900">{r.founderName}</TableCell>
                    <TableCell>
                      <Link to={`/manager/ip/${r.ipId}`} className="text-sm text-gray-900 hover:text-orange-600">
                        #{ip?.displayNo} {ip?.title}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden max-w-xs text-sm text-gray-600 lg:table-cell">
                      {r.note ?? <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell className="hidden text-sm text-gray-500 md:table-cell">
                      {formatDate(r.createdAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                      {r.status === 'declined' && r.declineReason && (
                        <p className="mt-1 max-w-[220px] text-xs text-gray-400">{r.declineReason}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <HandRaiseActions raise={r} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
