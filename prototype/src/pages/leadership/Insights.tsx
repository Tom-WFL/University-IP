import { BarChart3 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { useActiveUniversity } from '@/data/store';

/**
 * University leadership — read-only oversight.
 *
 * Placeholder. The real dashboard (portfolio volume, the
 * import → publish → hand-raise → team → I-Corps funnel, and where things
 * stall) is Phase D. It exists now so the persona has somewhere to land:
 * without a route here the wildcard would redirect to the persona home, which
 * would redirect to the wildcard, and so on.
 */
export function Insights() {
  const university = useActiveUniversity();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Stagger className="space-y-6">
        <FadeIn>
          <PageHeader
            icon={BarChart3}
            title={university ? `${university.name} — Insights` : 'Insights'}
            subtitle="How much IP is in the platform, and how well it is flowing into hackathons, I-Corps and Wildfire."
          />
        </FadeIn>
        <FadeIn>
          <EmptyState
            icon={BarChart3}
            title="Being built"
            body="Portfolio volume, the pipeline from import through to an I-Corps cohort, and where teams are stalling. Read-only throughout — this view answers questions without needing to ask the IP manager."
          />
        </FadeIn>
      </Stagger>
    </div>
  );
}
