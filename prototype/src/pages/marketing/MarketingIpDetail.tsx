import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { useStore, visibleOnMarketing } from '@/data/store';

/**
 * One public listing.
 *
 * Renders `publicSummary` and the field — nothing else. No inventor names, no
 * disclosure number, no patent status, and obviously no confidential detail.
 * A visitor with no account gets what a university is happy to see on the open
 * internet, and one route onward: signup, carrying this IP with them.
 */
export function MarketingIpDetail() {
  const { ipId } = useParams<{ ipId: string }>();
  const navigate = useNavigate();
  const ipItems = useStore((s) => s.ipItems);
  const universities = useStore((s) => s.universities);

  const item = ipItems.find((i) => i.id === ipId);

  // Anything not deliberately made public is simply not here.
  if (!item || !visibleOnMarketing(item)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Not available</h1>
        <p className="text-sm text-gray-500 mt-2">
          This technology is not listed publicly. Universities publish in stages, and most of the
          portfolio is only visible to people with an account.
        </p>
        <Button variant="outline" className="mt-5" onClick={() => navigate('/m')}>
          Back to the catalogue
        </Button>
      </div>
    );
  }

  const owner = universities.find((u) => u.id === item.universityId);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6">
      <Stagger className="py-10 sm:py-14 space-y-6">
        <FadeIn>
          <Link
            to="/m"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All technologies
          </Link>
        </FadeIn>

        <FadeIn>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {owner?.name ?? 'University'} · {item.disclosure.field}
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mt-2 leading-tight text-balance">
              {item.title}
            </h1>
          </div>
        </FadeIn>

        <FadeIn>
          <p className="text-base text-gray-700 leading-relaxed">{item.publicSummary}</p>
        </FadeIn>

        <FadeIn>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex items-start gap-3">
            <Lock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600">
              This is the non-confidential summary. The full disclosure stays with{' '}
              {owner?.shortName ?? 'the university'} and is shared under agreement once there is
              somebody serious to share it with.
            </p>
          </div>
        </FadeIn>

        <FadeIn>
          <div className="rounded-2xl bg-gradient-to-br from-[#ED1C24] via-[#f04e23] to-[#F26522] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white text-balance">
              Think you could build this?
            </h2>
            <p className="text-sm text-white/90 mt-2 max-w-xl">
              Create an account and we will put you in front of the IP manager at{' '}
              {owner?.shortName ?? 'the university'} who looks after it. You will not be committing
              to anything — they decide, and so do you.
            </p>
            <Button
              size="lg"
              onClick={() => navigate(`/signup?ip=${item.id}`)}
              className="mt-5 bg-white text-[#ED1C24] hover:bg-white/90"
            >
              I want to build this
            </Button>
          </div>
        </FadeIn>
      </Stagger>
    </div>
  );
}
