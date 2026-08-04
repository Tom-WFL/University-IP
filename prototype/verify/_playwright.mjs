import { createRequire } from 'node:module';

/**
 * Resolve Playwright without making it a dependency of the prototype.
 *
 * These suites are dev tooling. Adding `playwright` to package.json would put
 * a large download in front of every partner who runs `npm install` just to
 * click through the prototype, which is the opposite of what the package is
 * for. So we look for it where this environment actually keeps it, and say
 * something useful if it is missing rather than throwing a bare
 * ERR_MODULE_NOT_FOUND.
 *
 * Override with PLAYWRIGHT_ROOT if it lives somewhere else.
 */
const CANDIDATES = [
  process.env.PLAYWRIGHT_ROOT,
  'playwright',
  '/opt/node22/lib/node_modules/playwright',
  '/usr/lib/node_modules/playwright',
  '/usr/local/lib/node_modules/playwright',
].filter(Boolean);

const require = createRequire(import.meta.url);

function load() {
  const tried = [];
  for (const candidate of CANDIDATES) {
    try {
      return require(candidate);
    } catch {
      tried.push(candidate);
    }
  }
  throw new Error(
    `Could not find Playwright. Tried:\n  ${tried.join('\n  ')}\n` +
      'Install it globally (npm i -g playwright) or set PLAYWRIGHT_ROOT to its path.',
  );
}

export const { chromium } = load();

/** Chromium ships with the image; never download another one. */
export const EXECUTABLE_PATH = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';

/** Shared pass/fail bookkeeping so both suites report identically. */
export function harness() {
  const fails = [];
  const errors = [];
  return {
    fails,
    errors,
    check(condition, label) {
      console.log(`  ${condition ? 'ok  ' : 'FAIL'} ${label}`);
      if (!condition) fails.push(label);
    },
    watch(page) {
      page.on('pageerror', (e) => errors.push(`PAGEERROR ${e.message}`));
      page.on('console', (m) => {
        if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) {
          errors.push(`CONSOLE ${m.text()}`);
        }
      });
    },
    finish(name) {
      console.log('\n=== RESULT ===');
      console.log(errors.length ? `JS errors:\n  ${errors.join('\n  ')}` : 'JS errors: none');
      console.log(fails.length ? `\n${fails.length} failed` : `\nAll ${name} checks passed.`);
      process.exit(fails.length || errors.length ? 1 : 0);
    },
  };
}
