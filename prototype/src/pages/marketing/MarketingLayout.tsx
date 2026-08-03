import { Link, Outlet, useNavigate } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/data/store';

/**
 * The public marketing surface — deliberately NOT the app.
 *
 * No sidebar, no persona switcher, no app chrome. A visitor here has no
 * account and is not expected to want one yet; the whole job of this layout is
 * to look like a page a university would link to from its own website, and to
 * make exactly one thing easy — saying "I'd build that."
 *
 * Everything shown here is at `public` scope, which an IP manager set
 * deliberately, one item at a time, through the dual-control gate.
 */
export function MarketingLayout() {
  const navigate = useNavigate();
  const signIn = useStore((s) => s.signIn);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/m" className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ED1C24] to-[#F26522] flex items-center justify-center shrink-0">
              <FlaskConical className="w-4 h-4 text-white" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold bg-gradient-to-r from-[#ED1C24] to-[#F26522] bg-clip-text text-transparent leading-tight">
                Wildfire Labs
              </span>
              <span className="block text-xs text-gray-500 leading-tight">University IP</span>
            </span>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500 ml-2">
            Prototype · synthetic data
          </span>

          <div className="ml-auto flex items-center gap-2">
            {/* Demo affordance: a real visitor would sign in properly. */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                signIn();
                navigate('/');
              }}
            >
              Sign in
            </Button>
            <Button variant="gradient" size="sm" onClick={() => navigate('/signup')}>
              Create an account
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-xs text-gray-500 space-y-1">
          <p>
            Every listing here is a non-confidential summary published by the university that owns
            the IP. The underlying disclosures are not public.
          </p>
          <p>
            This is a prototype. The disclosures, people and numbers on this page are invented for
            the demo.
          </p>
        </div>
      </footer>
    </div>
  );
}
