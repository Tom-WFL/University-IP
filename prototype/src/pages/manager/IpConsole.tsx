import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Archive, FlaskConical, Hand, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { FacultyChip, OwnershipChip, RouteChip, ScopeChip } from '@/components/shared/chips';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { useStore } from '@/data/store';
import { formatDate } from '@/lib/utils';

type FilterKey = 'all' | 'private' | 'published' | 'undecided' | 'shelved' | 'interest';

const filterLabels: Record<FilterKey, string> = {
  all: 'All IP',
  private: 'Private only',
  published: 'Published',
  undecided: 'No route yet',
  shelved: 'Shelved / back catalog',
  interest: 'Has interest',
};

/**
 * The IP management console — every disclosure the school holds, with its
 * scope and route visible at a glance. Desktop gets a table, mobile gets
 * stacked cards (the app's dual-render list pattern).
 */
export function IpConsole() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');

  const universityId = useStore((s) => s.activeUniversityId);
  const ipItems = useStore((s) => s.ipItems);
  const handRaises = useStore((s) => s.handRaises);

  const filter = (searchParams.get('filter') as FilterKey) || 'all';
  const setFilter = (next: FilterKey) => {
    if (next === 'all') setSearchParams({});
    else setSearchParams({ filter: next });
  };

  const mine = useMemo(
    () => ipItems.filter((i) => i.universityId === universityId),
    [ipItems, universityId],
  );

  const interestCount = (ipItemId: string) =>
    handRaises.filter((hr) => hr.ipItemId === ipItemId && hr.status === 'pending').length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mine.filter((item) => {
      if (q && !`${item.title} ${item.disclosure.disclosureNumber} ${item.disclosure.field}`.toLowerCase().includes(q)) {
        return false;
      }
      switch (filter) {
        case 'private':
          return item.publishScope === 'private';
        case 'published':
          return item.publishScope !== 'private';
        case 'undecided':
          return item.route === 'undecided';
        case 'shelved':
          return item.shelved;
        case 'interest':
          return interestCount(item.id) > 0;
        default:
          return true;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine, query, filter, handRaises]);

  if (!mine.length) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <PageHeader
          icon={FlaskConical}
          title="IP Console"
          subtitle="Every disclosure this university holds, and where each one stands."
        />
        <EmptyState
          icon={FlaskConical}
          title="No IP in the platform yet"
          body="Import your disclosure spreadsheet to bring the portfolio in. Everything lands private — nothing is visible to anyone until you publish it."
          actionLabel="Import IP"
          onAction={() => navigate('/manage/import')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Stagger className="space-y-5">
        <FadeIn>
          <PageHeader
            icon={FlaskConical}
            title="IP Console"
            subtitle="Every disclosure this university holds, and where each one stands."
            action={
              <Button variant="gradient" onClick={() => navigate('/manage/import')}>
                Import IP
              </Button>
            }
          />
        </FadeIn>

        <FadeIn>
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, disclosure number, or field"
                className="pl-10 h-10"
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
              <SelectTrigger className="w-full sm:w-56 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(filterLabels) as FilterKey[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {filterLabels[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </FadeIn>

        <FadeIn>
          <p className="text-sm text-gray-500">
            {filtered.length} of {mine.length} disclosures
          </p>
        </FadeIn>

        {filtered.length === 0 ? (
          <FadeIn>
            <EmptyState
              icon={Search}
              title="Nothing matches that"
              body="Try a different search term or clear the filter."
              actionLabel="Clear filter"
              onAction={() => {
                setQuery('');
                setFilter('all');
              }}
            />
          </FadeIn>
        ) : (
          <>
            {/* Desktop table */}
            <FadeIn>
              <Card className="hidden md:block overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3">Disclosure</th>
                      <th className="px-4 py-3">Ownership</th>
                      <th className="px-4 py-3">Who can see it</th>
                      <th className="px-4 py-3">Route</th>
                      <th className="px-4 py-3 text-right">Interest</th>
                      <th className="px-4 py-3">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((item) => {
                      const interest = interestCount(item.id);
                      return (
                        <tr
                          key={item.id}
                          onClick={() => navigate(`/manage/ip/${item.id}`)}
                          tabIndex={0}
                          role="button"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(`/manage/ip/${item.id}`);
                            }
                          }}
                          className="cursor-pointer hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ED1C24]"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-start gap-2">
                              {item.shelved && (
                                <Archive className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-label="Shelved" />
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate max-w-xs">{item.title}</p>
                                <p className="text-xs text-gray-500">
                                  {item.disclosure.disclosureNumber} · {item.disclosure.field}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-start gap-1">
                              <OwnershipChip ownership={item.ownership} />
                              <FacultyChip attachment={item.facultyAttachment} />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <ScopeChip scope={item.publishScope} />
                          </td>
                          <td className="px-4 py-3">
                            <RouteChip route={item.route} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            {interest > 0 ? (
                              <span className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600">
                                <Hand className="w-3.5 h-3.5" />
                                {interest}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                            {formatDate(item.updatedAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </FadeIn>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((item) => {
                const interest = interestCount(item.id);
                return (
                  <FadeIn key={item.id}>
                    <Card
                      onClick={() => navigate(`/manage/ip/${item.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/manage/ip/${item.id}`);
                        }
                      }}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24]"
                    >
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.disclosure.disclosureNumber} · {item.disclosure.field}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <ScopeChip scope={item.publishScope} />
                        <RouteChip route={item.route} />
                        <OwnershipChip ownership={item.ownership} />
                      </div>
                      {interest > 0 && (
                        <p className="text-sm text-orange-600 font-medium mt-2 inline-flex items-center gap-1">
                          <Hand className="w-3.5 h-3.5" />
                          {interest} waiting on review
                        </p>
                      )}
                    </Card>
                  </FadeIn>
                );
              })}
            </div>
          </>
        )}
      </Stagger>
    </div>
  );
}
