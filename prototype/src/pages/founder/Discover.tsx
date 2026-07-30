import * as React from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  EmptyState,
  FilterBar,
  LoadingGrid,
  PageTitle,
  StatusBadge,
  useFakeLoading,
} from '@/components/shared/primitives';
import { useDemo, useScopedIps } from '@/store/DemoStore';
import { CLASSIFICATIONS } from '@/data/seed';
import { INVOLVEMENT_LABEL } from '@/store/types';

/** UIP-12 — what a founder with no idea of their own actually browses. */
export default function Discover() {
  const { state } = useDemo();
  const ips = useScopedIps();
  const loading = useFakeLoading();
  const [q, setQ] = React.useState('');
  const [inst, setInst] = React.useState('all');
  const [cls, setCls] = React.useState('all');

  const filtersActive = q !== '' || inst !== 'all' || cls !== 'all';

  const filtered = ips.filter((ip) => {
    const hay = `${ip.title} ${ip.summary?.text ?? ''} ${ip.keywords.join(' ')}`.toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (inst !== 'all' && ip.institutionId !== inst) return false;
    if (cls !== 'all' && ip.classification !== cls) return false;
    return true;
  });

  const myRaise = (ipId: string) => state.handRaises.find((h) => h.ipId === ipId && h.founderId === 'founder');
  const instName = (id: string) => state.institutions.find((i) => i.id === id)?.shortName ?? id;

  return (
    <div className="space-y-6">
      <PageTitle title="Discover University IP" />
      <p className="-mt-2 text-sm text-gray-500">
        University-owned inventions looking for someone to build a company around them.
      </p>

      <FilterBar cols={3}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search ideas"
            className="pl-10"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={inst} onValueChange={setInst}>
          <SelectTrigger>
            <SelectValue placeholder="University" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All universities</SelectItem>
            {state.institutions.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={cls} onValueChange={setCls}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CLASSIFICATIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      {loading ? (
        <LoadingGrid />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title={filtersActive ? 'No ideas match' : 'No ideas released yet'}
          body={
            filtersActive
              ? 'Try adjusting your filters.'
              : 'Universities release IP to the network as it clears review. Check back.'
          }
        />
      ) : (
        <>
          <p className="text-sm text-gray-500">
            Showing {filtered.length} idea{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ip) => {
              const raise = myRaise(ip.id);
              return (
                <Link key={ip.id} to={`/founder/ip/${ip.id}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold leading-snug text-gray-900">{ip.title}</h3>
                        {raise && <StatusBadge status={raise.status} />}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-xs">
                          {instName(ip.institutionId)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {ip.classification}
                        </Badge>
                        {ip.route === 'hackathon' ? (
                          <Badge variant="outline" className="border-purple-200 bg-purple-100 text-xs text-purple-700">
                            Hackathon idea
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-200 bg-green-100 text-xs text-green-700">
                            Founder Match
                          </Badge>
                        )}
                      </div>
                      <p className="line-clamp-3 text-sm text-gray-600">{ip.summary?.text}</p>
                      <p className="text-xs text-gray-400">Inventor: {INVOLVEMENT_LABEL[ip.involvement]}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
          <p className="text-xs text-gray-400">
            Ideas released only to a campus or a single state are not shown here — you see what has been released to
            the national network.
          </p>
        </>
      )}
    </div>
  );
}
