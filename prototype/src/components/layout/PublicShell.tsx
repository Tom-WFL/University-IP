import * as React from 'react';
import { Flame } from 'lucide-react';
import { ViewingAsSwitcher } from './ViewingAsSwitcher';

/** Matches the live app's public pages (/submit): warm gradient, narrow column, gradient wordmark. */
export function PublicShell({
  children,
  tagline,
  width = 'max-w-2xl',
}: {
  children: React.ReactNode;
  tagline?: string;
  width?: string;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-50">
      <div className="fixed right-4 top-4 z-40">
        <ViewingAsSwitcher variant="floating" />
      </div>
      <main className={`mx-auto ${width} px-4 py-12 sm:px-6`}>
        <div className="mb-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-3">
            <Flame className="h-10 w-10 text-wildfire-red" strokeWidth={2.2} />
            <h1 className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-4xl font-bold text-transparent">
              Wildfire Labs
            </h1>
          </div>
          {tagline && <p className="text-base text-gray-500">{tagline}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}

export function PublicCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-orange-100 bg-white/80 p-6 shadow-lg backdrop-blur-sm sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}
