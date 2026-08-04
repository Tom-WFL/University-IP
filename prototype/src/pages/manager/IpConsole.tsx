import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Archive,
  ChevronDown,
  FlaskConical,
  Hand,
  MoreHorizontal,
  PencilLine,
  Search,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { FacultyChip, OwnershipChip, RouteChip, SchoolChip, ScopeChip } from '@/components/shared/chips';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { BulkPublishDialog } from '@/components/manager/BulkPublishDialog';
import { SCOPES, SCOPE_ORDER } from '@/data/scopes';
import { itemInvolvement, needsSummaryReview, useStore, useUniversityScope } from '@/data/store';
import type { PublishScope } from '@/data/types';
import { formatDate } from '@/lib/utils';

type FilterKey =
  | 'all'
  | 'needs_review'
  | 'private'
  | 'published'
  | 'undecided'
  | 'shelved'
  | 'interest'
  // Per-level filters, so "take everything currently at campus up to national"
  // is a selection you can make in two clicks instead of by eye.
  | 'at_campus'
  | 'at_statewide'
  | 'at_national'
  | 'at_public';

const filterLabels: Record<FilterKey, string> = {
  all: 'All IP',
  needs_review: 'AI draft — needs review',
  private: 'Private only',
  published: 'Published',
  undecided: 'No route yet',
  shelved: 'Shelved / back catalog',
  interest: 'Has interest',
  at_campus: 'At campus',
  at_statewide: 'At statewide',
  at_national: 'At national network',
  at_public: 'At public',
};

const filterScope: Partial<Record<FilterKey, PublishScope>> = {
  at_campus: 'campus',
  at_statewide: 'statewide',
  at_national: 'national',
  at_public: 'public',
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

  const scope = useUniversityScope();
  const ipItems = useStore((s) => s.ipItems);
  const handRaises = useStore((s) => s.handRaises);
  const universities = useStore((s) => s.universities);
  const updateScopeMany = useStore((s) => s.updateScopeMany);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkScope, setBulkScope] = useState<PublishScope | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const filter = (searchParams.get('filter') as FilterKey) || 'all';
  const setFilter = (next: FilterKey) => {
    if (next === 'all') setSearchParams({});
    else setSearchParams({ filter: next });
  };

  const mine = useMemo(
    () => ipItems.filter((i) => scope.matches(i.universityId)),
    [ipItems, scope],
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
        case 'needs_review':
          return needsSummaryReview(item);
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
        default: {
          // Named `atScope` so it cannot shadow the university scope above.
          const atScope = filterScope[filter];
          return atScope ? item.publishScope === atScope : true;
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine, query, filter, handRaises]);

  // A selection is only meaningful against what is on screen. Changing the
  // filter or the search silently redefines "all of them", so drop it rather
  // than let someone publish rows they can no longer see.
  useEffect(() => {
    setSelected(new Set());
    setLastResult(null);
  }, [filter, query, scope.universityId, scope.all]);

  const visibleIds = filtered.map((i) => i.id);
  const selectedVisible = visibleIds.filter((id) => selected.has(id));
  const allVisibleSelected = visibleIds.length > 0 && selectedVisible.length === visibleIds.length;
  const selectedItems = mine.filter((i) => selected.has(i.id));

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAllVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });

  const runBulk = (scope: PublishScope) => {
    const { published, refused } = updateScopeMany([...selected], scope);
    setBulkScope(null);
    setSelected(new Set());
    setLastResult(
      refused.length
        ? `Published ${published.length} to ${SCOPES[scope].label.toLowerCase()}. ${refused.length} held back: ${refused
            .map((r) => r.title)
            .join(', ')}.`
        : `Published ${published.length} to ${SCOPES[scope].label.toLowerCase()}.`,
    );
  };

  if (!mine.length) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <PageHeader
          icon={FlaskConical}
          title="IP Console"
          subtitle={scope.all
              ? "Every disclosure across every university on the platform."
              : "Every disclosure this university holds, and where each one stands."}
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
            subtitle={scope.all
              ? "Every disclosure across every university on the platform."
              : "Every disclosure this university holds, and where each one stands."}
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

        {lastResult && (
          <FadeIn>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {lastResult}
            </div>
          </FadeIn>
        )}

        {selected.size > 0 && (
          <FadeIn>
            <div className="sticky top-16 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-[#ED1C24]/30 bg-orange-50 px-4 py-3 shadow-sm">
              <p className="text-sm font-medium text-gray-900">
                {selected.size} selected
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="gradient" size="sm">
                    Publish selected to…
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72">
                  <DropdownMenuLabel>Move all of them to</DropdownMenuLabel>
                  {SCOPE_ORDER.filter((s) => s !== 'private').map((scope) => (
                    <DropdownMenuItem
                      key={scope}
                      onSelect={() => setBulkScope(scope)}
                      className="items-start"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-gray-900">
                          {SCOPES[scope].label}
                        </span>
                        <span className="block text-xs text-gray-500 whitespace-normal">
                          {SCOPES[scope].who}
                        </span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            </div>
          </FadeIn>
        )}

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
                      <th className="px-2 py-3 w-10">
                        {/* Selects what is on screen, not the whole portfolio —
                            the filter is part of the selection. */}
                        <Checkbox
                          checked={allVisibleSelected}
                          onCheckedChange={toggleAllVisible}
                          aria-label={
                            allVisibleSelected
                              ? 'Clear selection'
                              : `Select all ${filtered.length} shown`
                          }
                        />
                      </th>
                      <th className="px-4 py-3">Disclosure</th>
                      {scope.all && <th className="px-4 py-3">School</th>}
                      <th className="px-4 py-3">Ownership</th>
                      <th className="px-4 py-3">Who can see it</th>
                      <th className="px-4 py-3">Route</th>
                      <th className="px-4 py-3 text-right">Interest</th>
                      <th className="px-4 py-3">Updated</th>
                      <th className="px-4 py-3 w-10">
                        <span className="sr-only">Actions</span>
                      </th>
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
                          {/* The row navigates, so the checkbox has to keep its
                              click to itself. */}
                          <td
                            className="px-2 py-3 w-10"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={selected.has(item.id)}
                              onCheckedChange={() => toggleOne(item.id)}
                              aria-label={`Select ${item.title}`}
                            />
                          </td>
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
                                {needsSummaryReview(item) && (
                                  <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 text-xs font-medium">
                                    <Sparkles className="w-3 h-3" />
                                    Draft needs review
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-start gap-1">
                              <OwnershipChip ownership={item.ownership} />
                              <FacultyChip attachment={itemInvolvement(item)} />
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
                          {/* The whole row navigates, so every control inside
                              it has to stop the click from bubbling. */}
                          <td
                            className="px-2 py-3"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  aria-label={`Actions for ${item.title}`}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/manage/ip/${item.id}`)}>
                                  Open
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => navigate(`/manage/ip/${item.id}/edit`)}
                                >
                                  <PencilLine className="w-4 h-4" />
                                  Edit disclosure
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                      <div className="flex items-start gap-3">
                        <span
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="pt-0.5"
                        >
                          <Checkbox
                            checked={selected.has(item.id)}
                            onCheckedChange={() => toggleOne(item.id)}
                            aria-label={`Select ${item.title}`}
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.disclosure.disclosureNumber} · {item.disclosure.field}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {scope.all && (
                          <SchoolChip university={universities.find((u) => u.id === item.universityId)} />
                        )}
                        <ScopeChip scope={item.publishScope} />
                        <RouteChip route={item.route} />
                        <OwnershipChip ownership={item.ownership} />
                        {needsSummaryReview(item) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 text-xs font-medium">
                            <Sparkles className="w-3 h-3" />
                            Draft needs review
                          </span>
                        )}
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

      <BulkPublishDialog
        items={selectedItems}
        universities={universities}
        targetScope={bulkScope}
        onCancel={() => setBulkScope(null)}
        onConfirm={runBulk}
      />
    </div>
  );
}
