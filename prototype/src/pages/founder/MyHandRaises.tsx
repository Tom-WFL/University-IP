import { Link } from 'react-router-dom';
import { Hand } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { EmptyState, PageTitle, StatusBadge } from '@/components/shared/primitives';
import { useDemo } from '@/store/DemoStore';
import { formatDate } from '@/lib/format';

const NEXT_STEP: Record<string, string> = {
  pending: 'The IP Manager is reviewing it.',
  connected: 'You have been introduced — expect an email.',
  approved: 'Approved. Your Wildfire onboarding is ready.',
  declined: 'Not a fit this time.',
};

export default function MyHandRaises() {
  const { state } = useDemo();
  const mine = state.handRaises
    .filter((h) => h.founderId === 'founder')
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div className="space-y-6">
      <PageTitle title="My Hand Raises" />

      {mine.length === 0 ? (
        <EmptyState
          icon={Hand}
          title="You haven't raised your hand yet"
          body="Browse the ideas universities have released and put your hand up for one you want to build."
          action={
            <Button asChild>
              <Link to="/founder">Discover IP</Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Idea</TableHead>
                <TableHead className="hidden md:table-cell">University</TableHead>
                <TableHead className="hidden md:table-cell">Raised</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next step</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mine.map((r) => {
                const ip = state.ips.find((i) => i.id === r.ipId);
                const inst = state.institutions.find((i) => i.id === ip?.institutionId);
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link to={`/founder/ip/${r.ipId}`} className="text-sm font-medium text-gray-900 hover:text-orange-600">
                        #{ip?.displayNo} {ip?.title}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-sm text-gray-600 md:table-cell">{inst?.shortName}</TableCell>
                    <TableCell className="hidden text-sm text-gray-500 md:table-cell">
                      {formatDate(r.createdAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {r.status === 'approved' ? (
                        <Link to="/founder/journey" className="text-orange-600 hover:underline">
                          {NEXT_STEP.approved}
                        </Link>
                      ) : (
                        <>
                          {NEXT_STEP[r.status]}
                          {r.status === 'declined' && r.declineReason && (
                            <span className="block text-xs text-gray-400">{r.declineReason}</span>
                          )}
                        </>
                      )}
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
