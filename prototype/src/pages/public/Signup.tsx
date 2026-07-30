import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { PublicCard, PublicShell } from '@/components/layout/PublicShell';
import { useDemo } from '@/store/DemoStore';

/**
 * MB-2 (the account gate) and MB-4 (the click on IP #51 has to survive signup and land the
 * person connected to that IP and its manager).
 */
export default function Signup() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, registerSignup } = useDemo();

  const ipId = params.get('ip') ?? undefined;
  const target = ipId ? state.ips.find((i) => i.id === ipId) : undefined;
  const institution = target ? state.institutions.find((i) => i.id === target.institutionId) : undefined;

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [agreed, setAgreed] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const valid = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email) && password.length >= 6 && agreed;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    registerSignup(name.trim(), target?.id);
    setSubmitting(false);

    if (target && target.visibility === 'network') {
      toast({
        title: 'Account created',
        description: `You're connected to IP #${target.displayNo} and ${institution?.shortName}'s IP Manager.`,
      });
      navigate(`/founder/ip/${target.id}`);
      return;
    }
    if (target) {
      toast({
        title: 'That idea is no longer released',
        description: 'Here is what is currently open across the network.',
      });
    } else {
      toast({ title: 'Account created', description: 'Browse the ideas universities have released.' });
    }
    navigate('/founder');
  };

  return (
    <PublicShell tagline="Create your Wildfire account">
      {target && (
        <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 p-4">
          <p className="text-sm font-semibold text-orange-900">
            You're requesting access to IP #{target.displayNo}
          </p>
          <p className="mt-0.5 text-sm text-orange-800">
            {target.title} — {institution?.name}
          </p>
        </div>
      )}

      <PublicCard>
        <h2 className="mb-6 text-xl font-semibold text-gray-900">Create an account</h2>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className={touched && name.trim().length < 2 ? 'border-red-400' : ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={touched && !/\S+@\S+\.\S+/.test(email) ? 'border-red-400' : ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">
              Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className={touched && password.length < 6 ? 'border-red-400' : ''}
            />
            <p className="text-xs text-gray-500">Not a real account — nothing leaves this browser.</p>
          </div>

          <label className="flex items-start gap-3">
            <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-0.5" />
            <span className="text-sm text-gray-600">
              I understand the ideas in this app are confidential university IP.
            </span>
          </label>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 py-3 text-base font-semibold text-white hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
          >
            {submitting ? 'Creating your account…' : 'Create account'}
          </Button>
        </form>
      </PublicCard>

      <div className="mt-6 rounded-md border border-gray-200 bg-white/70 p-4 text-xs text-gray-500">
        <p className="mb-1 font-semibold text-gray-700">Why an account?</p>
        <p>
          It filters for people motivated enough to sign up, and it leaves a record of who read which idea. It was
          noted at the meeting that an account is not much of a barrier on its own — bot and duplicate-signup handling
          is still an open question.
        </p>
      </div>
    </PublicShell>
  );
}
