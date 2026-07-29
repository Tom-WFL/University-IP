import { useMemo, useState } from 'react';
import { FlaskConical, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { IpCard } from '@/components/founder/IpCard';
import { useCurrentUser, useStore, visibleToFounder } from '@/data/store';

/**
 * The IP marketplace. Only shows what the viewer's scope allows — the
 * founder-facing counterpart to the IP manager's publish decisions.
 */
export function Discover() {
  const user = useCurrentUser();
  const ipItems = useStore((s) => s.ipItems);
  const universities = useStore((s) => s.universities);
  const handRaises = useStore((s) => s.handRaises);

  const [query, setQuery] = useState('');
  const [school, setSchool] = useState('all');
  const [faculty, setFaculty] = useState('all');

  const visible = useMemo(
    () => ipItems.filter((item) => visibleToFounder(item, user.universityId, universities)),
    [ipItems, user.universityId, universities],
  );

  const schools = useMemo(
    () =>
      universities.filter((u) => visible.some((item) => item.universityId === u.id)),
    [universities, visible],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible.filter((item) => {
      if (q && !`${item.title} ${item.publicSummary} ${item.disclosure.field}`.toLowerCase().includes(q)) {
        return false;
      }
      if (school !== 'all' && item.universityId !== school) return false;
      if (faculty !== 'all' && item.facultyAttachment !== faculty) return false;
      return true;
    });
  }, [visible, query, school, faculty]);

  const myStatus = (ipItemId: string) =>
    handRaises.find((hr) => hr.ipItemId === ipItemId && hr.userId === user.id)?.status;
  const interestCount = (ipItemId: string) => handRaises.filter((hr) => hr.ipItemId === ipItemId).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Stagger className="space-y-5">
        <FadeIn>
          <PageHeader
            icon={FlaskConical}
            title="University IP"
            subtitle="Research that a university wants someone to commercialize. Find one, raise your hand."
          />
        </FadeIn>

        <FadeIn>
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by keyword or field"
                className="pl-10 h-10"
              />
            </div>
            <Select value={school} onValueChange={setSchool}>
              <SelectTrigger className="w-full sm:w-48 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All universities</SelectItem>
                {schools.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.shortName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={faculty} onValueChange={setFaculty}>
              <SelectTrigger className="w-full sm:w-52 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any faculty involvement</SelectItem>
                <SelectItem value="attached">Faculty stays attached</SelectItem>
                <SelectItem value="idea-only">Idea only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FadeIn>

        <FadeIn>
          <p className="text-sm text-gray-500">
            {filtered.length} of {visible.length} available to you
          </p>
        </FadeIn>

        {filtered.length === 0 ? (
          <FadeIn>
            <EmptyState
              icon={Search}
              title={visible.length ? 'Nothing matches that' : 'No IP published to you yet'}
              body={
                visible.length
                  ? 'Try a different search term or clear the filters.'
                  : 'Universities publish IP in stages — campus first, then statewide, then the national network. Check back as more opens up.'
              }
              actionLabel={visible.length ? 'Clear filters' : undefined}
              onAction={
                visible.length
                  ? () => {
                      setQuery('');
                      setSchool('all');
                      setFaculty('all');
                    }
                  : undefined
              }
            />
          </FadeIn>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((item) => (
              <FadeIn key={item.id}>
                <IpCard
                  item={item}
                  university={universities.find((u) => u.id === item.universityId)}
                  interestCount={interestCount(item.id)}
                  myStatus={myStatus(item.id)}
                />
              </FadeIn>
            ))}
          </div>
        )}
      </Stagger>
    </div>
  );
}
