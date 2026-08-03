import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, FlaskConical, Mail, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/shared/Field';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { useStore } from '@/data/store';
import { MIN_INTENT_CHARS } from '@/lib/leadRisk';
import { cn } from '@/lib/utils';

/**
 * Account creation, with the friction that keeps the funnel usable.
 *
 * Two jobs. The first is to carry the IP someone clicked on all the way
 * through, so they arrive attached to the right disclosure and the right IP
 * manager rather than dumped on a generic home page. The second is to make
 * automated signups expensive enough to be worth catching, without making a
 * genuine prospect give up: everyone gets an account, but suspicious ones are
 * held before they can raise a hand.
 *
 * The captcha and the emailed code are simulated. What is real is the decision
 * they feed and the queue that decision produces.
 */
export function Signup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const ipContext = params.get('ip');

  const ipItems = useStore((s) => s.ipItems);
  const universities = useStore((s) => s.universities);
  const signUp = useStore((s) => s.signUp);

  const item = ipContext ? ipItems.find((i) => i.id === ipContext) : undefined;
  const owner = item ? universities.find((u) => u.id === item.universityId) : undefined;

  const [step, setStep] = useState<'details' | 'verify'>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [intent, setIntent] = useState('');
  const [notARobot, setNotARobot] = useState(false);
  // Hidden from humans; only a script fills this in.
  const [honeypot, setHoneypot] = useState('');
  const [code, setCode] = useState('');

  const emailLooksReal = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  const canContinue = name.trim() && emailLooksReal && intent.trim() && notARobot;

  const finish = (emailVerified: boolean) => {
    const { userId, held } = signUp({
      name,
      email,
      intent,
      honeypot,
      emailVerified,
      ipContext,
    });
    // Land them where they were trying to get to. A held account still sees
    // the item — it just cannot raise a hand yet, and the page says so.
    navigate(item ? `/discover/${item.id}` : '/home', { state: { justSignedUp: true, userId, held } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-10 sm:py-16">
        <Stagger className="space-y-5">
          <FadeIn>
            <Link
              to={item ? `/m/ip/${item.id}` : '/m'}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </FadeIn>

          {/* Carrying the context visibly is the point — they should never
              wonder whether the thing they clicked came with them. */}
          {item && (
            <FadeIn>
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-br from-[#ED1C24] via-[#f04e23] to-[#F26522] px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                    You&rsquo;re signing up to build
                  </p>
                  <p className="text-base font-bold text-white mt-1 leading-snug">{item.title}</p>
                  <p className="text-xs text-white/80 mt-1">{owner?.name}</p>
                </div>
              </Card>
            </FadeIn>
          )}

          <FadeIn>
            <Card>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                    <FlaskConical className="w-5 h-5 text-orange-500" />
                  </span>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">
                      {step === 'details' ? 'Create your account' : 'Check your email'}
                    </h1>
                    <p className="text-sm text-gray-500">
                      {step === 'details'
                        ? 'Takes a minute. No cost, and nothing is shared with the university until you ask.'
                        : `We sent a six-digit code to ${email}.`}
                    </p>
                  </div>
                </div>

                {step === 'details' ? (
                  <>
                    <Field label="Your name" required>
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Moreau" />
                    </Field>

                    <Field label="Email" required>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                    </Field>

                    <Field
                      label="What would you do with it?"
                      required
                      help={
                        intent.trim().length > 0 && intent.trim().length < MIN_INTENT_CHARS
                          ? `A sentence or two helps — ${MIN_INTENT_CHARS - intent.trim().length} more characters.`
                          : 'The IP manager reads this. A real answer gets you taken seriously.'
                      }
                    >
                      <Textarea
                        rows={4}
                        value={intent}
                        onChange={(e) => setIntent(e.target.value)}
                        placeholder="What you'd build, who you think would buy it, and what you'd want to find out first."
                      />
                    </Field>

                    {/* Honeypot. Off-screen rather than display:none so simple
                        bots still see and fill it. */}
                    <div aria-hidden className="absolute left-[-9999px] w-px h-px overflow-hidden">
                      <label htmlFor="company-website">Company website</label>
                      <input
                        id="company-website"
                        name="company-website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                      />
                    </div>

                    <label className="flex gap-3 items-center cursor-pointer rounded-xl border border-gray-200 p-3 hover:bg-gray-50 transition-colors">
                      <Checkbox
                        checked={notARobot}
                        onCheckedChange={(v) => setNotARobot(v === true)}
                      />
                      <span className="text-sm text-gray-700 flex-1">I&rsquo;m not a robot</span>
                      <ShieldCheck className="w-4 h-4 text-gray-300" />
                    </label>

                    <Button
                      variant="gradient"
                      className="w-full"
                      disabled={!canContinue}
                      onClick={() => setStep('verify')}
                    >
                      Continue
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 flex items-start gap-2.5">
                      <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-900">
                        Demo shortcut: the code is <span className="font-mono font-semibold">204815</span>.
                        Verifying is optional here so you can see both outcomes.
                      </p>
                    </div>

                    <Field label="Six-digit code">
                      <Input
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="204815"
                        inputMode="numeric"
                        className={cn('tracking-[0.3em] font-mono')}
                      />
                    </Field>

                    <div className="space-y-2">
                      <Button
                        variant="gradient"
                        className="w-full"
                        disabled={code !== '204815'}
                        onClick={() => finish(true)}
                      >
                        <Check className="w-4 h-4" />
                        Verify and finish
                      </Button>
                      <Button variant="ghost" className="w-full" onClick={() => finish(false)}>
                        Skip verification for now
                      </Button>
                    </div>

                    <p className="text-xs text-gray-500">
                      Skipping is allowed, but unverified accounts are reviewed by a person before
                      they can approach a university.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn>
            <p className="text-xs text-gray-500 text-center">
              Already have an account?{' '}
              <button
                onClick={() => {
                  useStore.getState().signIn();
                  navigate('/');
                }}
                className="text-[#ED1C24] hover:underline"
              >
                Sign in
              </button>
            </p>
          </FadeIn>
        </Stagger>
      </div>
    </div>
  );
}
