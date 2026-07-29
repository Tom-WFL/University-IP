import { motion, type Variants } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/** The app's standard entrance: fadeInUp inside a 0.08s stagger container. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export function Stagger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  );
}

export function FadeIn({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={fadeInUp} className={className}>
      {children}
    </motion.div>
  );
}

/** Counts a stat up from 0 on mount. Respects prefers-reduced-motion. */
export function CountUp({ value, durationMs = 700 }: { value: number; durationMs?: number }) {
  const [display, setDisplay] = useState(value);
  const frame = useRef<number>();

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || value === 0) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const tick = (t: number) => {
      const progress = Math.min(1, (t - start) / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value, durationMs]);

  return <>{display}</>;
}

/**
 * One-shot celebratory burst, used when a match is approved and a team forms.
 * Pure CSS/motion — no dependency, and it disappears on its own.
 */
export function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  const colors = ['#ED1C24', '#F26522', '#F7941E', '#2F8F5E', '#4F46E5'];
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    // Deterministic spread — no Math.random, so the burst looks the same each run.
    x: (i % 14) * 7.5 - 48 + (i % 3) * 4,
    delay: (i % 7) * 0.03,
    color: colors[i % colors.length],
    rotate: (i % 5) * 72,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-start justify-center overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, y: '30vh', x: `${p.x}vw`, rotate: 0, scale: 1 }}
          animate={{ opacity: 0, y: '85vh', rotate: p.rotate + 360, scale: 0.6 }}
          transition={{ duration: 1.5, delay: p.delay, ease: 'easeOut' }}
          className="absolute block h-2.5 w-2 rounded-[1px]"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}
