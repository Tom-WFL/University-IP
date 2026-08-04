import { ScrollText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { AuditTimeline } from '@/components/shared/AuditTimeline';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { useStore, useUniversityScope } from '@/data/store';

export function AuditPage() {
  const scope = useUniversityScope();
  const audit = useStore((s) => s.audit).filter((e) => scope.matches(e.universityId));
  const users = useStore((s) => s.users);
  const universities = useStore((s) => s.universities);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Stagger className="space-y-5">
        <FadeIn>
          <PageHeader
            icon={ScrollText}
            title="Audit trail"
            subtitle="Every import, publish, route change, and match decision — with who did it and when."
          />
        </FadeIn>

        <FadeIn>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">
              For BOR-owned IP this is the defensibility record. If a disclosure is ever questioned, this
              shows exactly who authorised the release and what was published.
            </p>
          </div>
        </FadeIn>

        <FadeIn>
          <Card>
            <CardContent className="p-6">
              <AuditTimeline events={audit} users={users} universities={universities} />
            </CardContent>
          </Card>
        </FadeIn>
      </Stagger>
    </div>
  );
}
