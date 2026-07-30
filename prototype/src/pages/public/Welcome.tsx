import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicShell } from '@/components/layout/PublicShell';
import { useDemo } from '@/store/DemoStore';
import { DEEP_LINK_IP_ID } from '@/data/seed';

/**
 * MB-3 / MB-4 — a stand-in for the marketing surface where an outsider first sees an idea.
 * Teasers deliberately show no summary text: reading the concept requires an account (MB-2).
 */
export default function Welcome() {
  const { state } = useDemo();
  const navigate = useNavigate();

  const released = state.ips.filter((ip) => ip.visibility === 'network' && ip.summary?.status === 'approved');
  // The deep-link IP is pinned first so the walkthrough always has the same starting click.
  const teasers = [
    ...released.filter((ip) => ip.id === DEEP_LINK_IP_ID),
    ...released.filter((ip) => ip.id !== DEEP_LINK_IP_ID),
  ].slice(0, 4);
  const instName = (id: string) => state.institutions.find((i) => i.id === id)?.name ?? id;

  return (
    <PublicShell tagline="University IP — ideas looking for founders">
      <div className="mb-6 rounded-md border border-gray-200 bg-white/70 px-4 py-3 text-center text-xs text-gray-500">
        Stand-in for a marketing page, so the prototype can show how someone gets from an idea they saw online into
        the app.
      </div>

      <div className="space-y-4">
        {teasers.map((ip) => (
          <button
            key={ip.id}
            onClick={() => navigate(`/signup?ip=${ip.id}`)}
            className="w-full rounded-xl border border-orange-100 bg-white/80 p-6 text-left shadow-lg backdrop-blur-sm transition-shadow hover:shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-gray-400">IP #{ip.displayNo}</p>
                <h2 className="mt-1 text-lg font-semibold text-gray-900">{ip.title}</h2>
                <p className="mt-1 text-sm text-gray-500">{instName(ip.institutionId)}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-xs">
                    {ip.classification}
                  </Badge>
                  <Badge variant="outline" className="border-green-200 bg-green-100 text-xs text-green-700">
                    Looking for a founder
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-gray-400">Create an account to read what this is.</p>
              </div>
              <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-orange-500" />
            </div>
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        + {Math.max(0, released.length - teasers.length)} more ideas across the network
      </p>

      <div className="mt-8 text-center">
        <Button
          size="lg"
          className="bg-gradient-to-r from-orange-500 to-red-500 font-semibold text-white hover:from-orange-600 hover:to-red-600"
          asChild
        >
          <Link to="/signup">Create an account to browse</Link>
        </Button>
        <p className="mt-4 text-xs text-gray-500">
          Ideas sit behind a sign-in on purpose — it is a small barrier, and it leaves a record of who read what.
        </p>
      </div>
    </PublicShell>
  );
}
