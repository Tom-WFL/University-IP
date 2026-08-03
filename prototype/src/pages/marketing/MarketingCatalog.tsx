import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { useStore, visibleOnMarketing } from '@/data/store';

/**
 * The public catalogue. Read-only, no account, no hand-raising — the only
 * action is to say you want to build one, which takes you into signup with
 * that IP carried along.
 */
export function MarketingCatalog() {
  const navigate = useNavigate();
  const ipItems = useStore((s) => s.ipItems);
  const universities = useStore((s) => s.universities);
  const [query, setQuery] = useState('');

  const listed = useMemo(() => ipItems.filter(visibleOnMarketing), [ipItems]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listed;
    return listed.filter((i) =>
      `${i.title} ${i.publicSummary} ${i.disclosure.field}`.toLowerCase().includes(q),
    );
  }, [listed, query]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <Stagger className="py-12 sm:py-16 space-y-8">
        <FadeIn>
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight text-balance">
              University research, looking for someone to build it.
            </h1>
            <p className="text-base text-gray-600 mt-3">
              South Dakota&rsquo;s universities hold patented technology that has never been
              commercialized. If one of these is your field, you can pick it up — the university
              wants it built, and they are looking for the founder to do it.
            </p>
          </div>
        </FadeIn>

        <FadeIn>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keyword or field"
              className="pl-10 h-11"
              aria-label="Search available technology"
            />
          </div>
        </FadeIn>

        <FadeIn>
          <p className="text-sm text-gray-500">
            {filtered.length} {filtered.length === 1 ? 'technology' : 'technologies'} available
          </p>
        </FadeIn>

        {filtered.length === 0 ? (
          <FadeIn>
            <div className="rounded-2xl border border-gray-200 p-10 text-center">
              <p className="text-gray-900 font-medium">Nothing matches that</p>
              <p className="text-sm text-gray-500 mt-1">
                Try a broader term, or clear the search to see everything available.
              </p>
            </div>
          </FadeIn>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((item) => {
              const owner = universities.find((u) => u.id === item.universityId);
              return (
                <FadeIn key={item.id}>
                  <article
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/m/ip/${item.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/m/ip/${item.id}`);
                      }
                    }}
                    className="group h-full rounded-2xl border border-gray-200 p-6 flex flex-col gap-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24] focus-visible:ring-offset-2"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {owner?.name ?? 'University'} · {item.disclosure.field}
                    </p>
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[#ED1C24] transition-colors text-balance">
                      {item.title}
                    </h2>
                    <p className="text-sm text-gray-600 leading-relaxed flex-1">
                      {item.publicSummary}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#ED1C24] mt-1">
                      Read more
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </article>
                </FadeIn>
              );
            })}
          </div>
        )}

        <FadeIn>
          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-base font-semibold text-gray-900">
                Not sure which one, but interested?
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Create an account and you can see everything published to the founder network —
                more than is listed here — plus hackathons and I-Corps cohorts you could join.
              </p>
            </div>
            <Button variant="gradient" onClick={() => navigate('/signup')} className="shrink-0">
              Create an account
            </Button>
          </div>
        </FadeIn>
      </Stagger>
    </div>
  );
}
