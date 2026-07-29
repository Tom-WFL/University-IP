import { useNavigate } from 'react-router-dom';
import { Check, MapPin, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { useCurrentUser, useStore, visibleToFounder } from '@/data/store';
import { formatDate } from '@/lib/utils';

/**
 * Hackathon discovery. Registering is captured and shows on the home page —
 * running the event itself is a separate module and deliberately absent.
 */
export function Hackathons() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const hackathons = useStore((s) => s.hackathons);
  const registrations = useStore((s) => s.registrations);
  const registerForHackathon = useStore((s) => s.registerForHackathon);
  const ipItems = useStore((s) => s.ipItems);
  const universities = useStore((s) => s.universities);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Stagger className="space-y-5">
        <FadeIn>
          <PageHeader
            icon={Trophy}
            title="Hackathons"
            subtitle="Build something in a weekend. Some events put university IP up as challenges."
          />
        </FadeIn>

        <div className="space-y-4">
          {hackathons.map((hackathon) => {
            const registered = registrations.some(
              (r) => r.hackathonId === hackathon.id && r.userId === user.id,
            );
            const featured = hackathon.featuredIpIds
              .map((id) => ipItems.find((i) => i.id === id))
              .filter(
                (item): item is NonNullable<typeof item> =>
                  Boolean(item) && visibleToFounder(item!, user.universityId, universities),
              );

            return (
              <FadeIn key={hackathon.id}>
                <Card className="rounded-2xl border-gray-100">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">{hackathon.name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {hackathon.host} · {formatDate(hackathon.startsOn)}
                        </p>
                        <p className="text-sm text-gray-500 inline-flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {hackathon.location}
                        </p>

                        {featured.length > 0 && (
                          <div className="mt-3 rounded-xl bg-gray-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                              University IP you can pick up here
                            </p>
                            <ul className="mt-1.5 space-y-1">
                              {featured.map((item) => (
                                <li key={item.id}>
                                  <button
                                    onClick={() => navigate(`/discover/${item.id}`)}
                                    className="text-sm text-gray-700 hover:text-[#ED1C24] transition-colors text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24] focus-visible:ring-offset-2"
                                  >
                                    {item.title}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0">
                        {registered ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 text-sm font-medium">
                            <Check className="w-4 h-4" />
                            Registered
                          </span>
                        ) : (
                          <Button
                            variant="gradient"
                            size="sm"
                            onClick={() => registerForHackathon(hackathon.id)}
                          >
                            Register
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            );
          })}
        </div>

        <FadeIn>
          <p className="text-xs text-gray-400 text-center">
            Registering saves it to your home page. Event management lives in the hackathon module.
          </p>
        </FadeIn>
      </Stagger>
    </div>
  );
}
