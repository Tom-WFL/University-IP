import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  FlaskConical,
  Hand,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/shared/chips';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { DiscoverRail } from '@/components/founder/DiscoverRail';
import { IpCard } from '@/components/founder/IpCard';
import { useCurrentUser, useStore, visibleToFounder } from '@/data/store';
import { formatDate, initials } from '@/lib/utils';

/**
 * The founder/applicant home page — one spot to manage everything they are in
 * and find everything they could join. IP, hackathons and I-Corps all surface
 * here; only IP is fully built behind the click.
 */
export function FounderHome() {
  const navigate = useNavigate();
  const user = useCurrentUser();

  const ipItems = useStore((s) => s.ipItems);
  const universities = useStore((s) => s.universities);
  const handRaises = useStore((s) => s.handRaises);
  const teams = useStore((s) => s.teams);
  const cohorts = useStore((s) => s.cohorts);
  const cohortApplications = useStore((s) => s.cohortApplications);
  const hackathons = useStore((s) => s.hackathons);
  const registrations = useStore((s) => s.registrations);

  const myHandRaises = handRaises.filter((hr) => hr.userId === user.id);
  const myTeams = teams.filter((t) => t.memberIds.includes(user.id));
  const myTeamIds = new Set(myTeams.map((t) => t.id));
  const myApplications = cohortApplications.filter((a) => myTeamIds.has(a.teamId));
  const myRegistrations = registrations.filter((r) => r.userId === user.id);

  const visible = ipItems.filter((item) => visibleToFounder(item, user.universityId, universities));
  const raisedIds = new Set(myHandRaises.map((hr) => hr.ipItemId));
  const freshIp = visible.filter((item) => !raisedIds.has(item.id)).slice(0, 8);

  const university = universities.find((u) => u.id === user.universityId);
  const interestCount = (id: string) => handRaises.filter((hr) => hr.ipItemId === id).length;

  const hasAnything =
    myHandRaises.length > 0 || myTeams.length > 0 || myApplications.length > 0 || myRegistrations.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Stagger className="space-y-6">
        {/* Identity hero — the app's ProfileHeroCard pattern */}
        <FadeIn>
          <Card className="overflow-hidden rounded-2xl border-gray-100">
            <div className="bg-gradient-to-br from-[#ED1C24] via-[#f04e23] to-[#F26522] px-6 py-6">
              <div className="flex items-center gap-4">
                <span className="w-20 h-20 rounded-full bg-white ring-4 ring-white text-[#ED1C24] text-2xl font-bold flex items-center justify-center shrink-0">
                  {initials(user.name)}
                </span>
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-white leading-tight">{user.name}</h1>
                  <p className="text-white/80 text-sm mt-0.5 truncate">{user.title}</p>
                  <span className="inline-block mt-2 rounded-full bg-white/20 border border-white/30 px-2.5 py-0.5 text-xs font-medium text-white">
                    {university?.shortName ?? 'Wildfire Network'}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white px-6 py-4">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <Hand className="w-4 h-4" />
                  {myHandRaises.length} hand{myHandRaises.length === 1 ? '' : 's'} raised
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {myTeams.length} team{myTeams.length === 1 ? '' : 's'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" />
                  {myRegistrations.length} hackathon{myRegistrations.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </Card>
        </FadeIn>

        {/* Empty first-run state — say what this page is for. */}
        {!hasAnything && (
          <FadeIn>
            <Card className="border-dashed border-2 border-gray-200 bg-white/60">
              <CardContent className="p-6 text-center">
                <Sparkles className="w-10 h-10 text-orange-300 mx-auto mb-3" />
                <h2 className="font-semibold text-gray-900">This is your home base</h2>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  Everything you join shows up here — university IP you have picked up, your hackathons, your
                  I-Corps cohort. Start by finding some IP worth building.
                </p>
                <Button variant="gradient" className="mt-4" onClick={() => navigate('/discover')}>
                  Browse university IP
                </Button>
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {/* MY STUFF */}
        {myTeams.length > 0 && (
          <FadeIn>
            <MyStuffSection title="My team">
              {myTeams.map((team) => {
                const item = ipItems.find((i) => i.id === team.ipItemId);
                const application = myApplications.find((a) => a.teamId === team.id);
                const cohort = application ? cohorts.find((c) => c.id === application.cohortId) : undefined;
                return (
                  <Card key={team.id} className="rounded-2xl border-emerald-200 bg-emerald-50/40">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900">{team.name}</p>
                          <p className="text-sm text-gray-600 mt-0.5">
                            You matched to this IP on {formatDate(team.formedAt)}.
                          </p>
                          {cohort && application && (
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <StatusChip status={application.status} />
                              <span className="text-xs text-gray-500">
                                {cohort.name} · starts {formatDate(cohort.startsOn)}
                              </span>
                            </div>
                          )}
                        </div>
                        {item && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={() => navigate(`/discover/${item.id}`)}
                          >
                            View
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </MyStuffSection>
          </FadeIn>
        )}

        {myHandRaises.length > 0 && (
          <FadeIn>
            <MyStuffSection title="My hand-raises">
              {myHandRaises.map((hr) => {
                const item = ipItems.find((i) => i.id === hr.ipItemId);
                if (!item) return null;
                const owner = universities.find((u) => u.id === item.universityId);
                return (
                  <Card
                    key={hr.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/discover/${item.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/discover/${item.id}`);
                      }
                    }}
                    className="rounded-2xl border-gray-100 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24] focus-visible:ring-offset-2"
                  >
                    <CardContent className="p-5 flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                        <FlaskConical className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 leading-snug">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{owner?.shortName}</p>
                        <div className="mt-2">
                          <StatusChip status={hr.status} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </MyStuffSection>
          </FadeIn>
        )}

        {myRegistrations.length > 0 && (
          <FadeIn>
            <MyStuffSection title="My hackathons">
              {myRegistrations.map((reg) => {
                const hackathon = hackathons.find((h) => h.id === reg.hackathonId);
                if (!hackathon) return null;
                return (
                  <Card key={reg.id} className="rounded-2xl border-purple-200 bg-purple-50/40">
                    <CardContent className="p-5 flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{hackathon.name}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(hackathon.startsOn)} · {hackathon.location}
                        </p>
                        <p className="text-xs text-purple-700 font-medium mt-1">You're registered</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </MyStuffSection>
          </FadeIn>
        )}

        {/* DISCOVER */}
        <FadeIn>
          <DiscoverRail
            icon={FlaskConical}
            title="University IP"
            subtitle="Research looking for someone to build it."
            seeAllTo="/discover"
            seeAllLabel="See all"
            empty={
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center">
                <p className="text-sm text-gray-500">
                  Nothing published to you yet. Universities publish IP in stages — check back.
                </p>
              </div>
            }
          >
            {freshIp.map((item) => (
              <IpCard
                key={item.id}
                item={item}
                university={universities.find((u) => u.id === item.universityId)}
                interestCount={interestCount(item.id)}
                compact
              />
            ))}
          </DiscoverRail>
        </FadeIn>

        <FadeIn>
          <DiscoverRail
            icon={Trophy}
            title="Hackathons"
            subtitle="Build something in a weekend — some use university IP as challenges."
            seeAllTo="/hackathons"
            seeAllLabel="See all"
          >
            {hackathons.map((hackathon) => {
              const registered = myRegistrations.some((r) => r.hackathonId === hackathon.id);
              return (
                <Card
                  key={hackathon.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate('/hackathons')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate('/hackathons');
                    }
                  }}
                  className="w-72 shrink-0 rounded-2xl border-gray-100 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24] focus-visible:ring-offset-2"
                >
                  <CardContent className="p-5">
                    <Trophy className="w-5 h-5 text-purple-500 mb-2" />
                    <p className="font-semibold text-gray-900 leading-snug">{hackathon.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(hackathon.startsOn)} · {hackathon.location}
                    </p>
                    {registered && (
                      <p className="text-xs text-purple-700 font-medium mt-2">You're registered</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </DiscoverRail>
        </FadeIn>

        <FadeIn>
          <DiscoverRail
            icon={CalendarDays}
            title="I-Corps cohorts"
            subtitle="Customer discovery, run as a cohort."
            seeAllTo="/cohorts"
            seeAllLabel="See all"
          >
            {cohorts.map((cohort) => (
              <Card
                key={cohort.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate('/cohorts')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate('/cohorts');
                  }
                }}
                className="w-72 shrink-0 rounded-2xl border-gray-100 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24] focus-visible:ring-offset-2"
              >
                <CardContent className="p-5">
                  <CalendarDays className="w-5 h-5 text-blue-500 mb-2" />
                  <p className="font-semibold text-gray-900 leading-snug">{cohort.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {cohort.host} · starts {formatDate(cohort.startsOn)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </DiscoverRail>
        </FadeIn>
      </Stagger>
    </div>
  );
}

function MyStuffSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
