/**
 * Phase G — the Wildfire admin as a full IP manager.
 *
 *   npx vite --host 127.0.0.1 --port 8080 --strictPort   # in another shell
 *   node verify/phase-g.mjs
 */
import { EXECUTABLE_PATH, chromium, harness } from './_playwright.mjs';

const BASE = process.env.BASE ?? 'http://127.0.0.1:8080';
const { check, watch, finish } = harness();

const browser = await chromium.launch({ executablePath: EXECUTABLE_PATH });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
watch(page);
const body = () => page.locator('body').innerText();

const reset = async (userId) => {
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.evaluate((id) => window.__store.getState().setCurrentUser(id), userId);
};

const MANAGER_ROUTES = [
  '/manage',
  '/manage/ip',
  '/manage/import',
  '/manage/interest',
  '/manage/teams',
  '/manage/audit',
  '/manage/policy',
  '/manage/leads',
];

await reset('u-admin');

// ---------------------------------------------------------------------------
console.log('\n[G1] the admin gets the whole IP-office toolkit');
await page.goto(`${BASE}/#/admin`);
await page.waitForTimeout(900);
const navLinks = await page.locator('nav a').allInnerTexts();
for (const label of [
  'Universities',
  'Dashboard',
  'IP Console',
  'Import IP',
  'Hand-raises',
  'Lead review',
  'Teams & I-Corps',
  'Audit trail',
  'Release policy',
]) {
  check(navLinks.some((l) => l.includes(label)), `nav offers "${label}"`);
}
check(/Acting as/.test(await body()), 'the nav says which school the toolkit is pointed at');

// Every manager route opens rather than bouncing.
for (const route of MANAGER_ROUTES) {
  await page.goto(`${BASE}/#${route}`);
  await page.waitForTimeout(350);
  check(page.url().endsWith(`#${route}`), `${route} opens for the admin`);
}

// ---------------------------------------------------------------------------
console.log('\n[G2] the switcher works, and only the admin may see every school');
await page.goto(`${BASE}/#/manage/ip`);
await page.waitForTimeout(700);
await page.getByRole('button', { name: /Acting as/ }).click();
await page.waitForTimeout(400);
const menu = await body();
check(/work on behalf of/i.test(menu), 'the switcher is framed as acting for a school');
check(/All universities/.test(menu), 'and offers the cross-school view');

await page.getByRole('menuitem', { name: 'All universities' }).click();
await page.waitForTimeout(800);
const allView = await body();
check(/every university on the platform/.test(allView), 'the console says it is showing everything');
check(/\bschool\b/i.test(allView), 'a school column appears');
const total = await page.evaluate(() => window.__store.getState().ipItems.length);
check(new RegExp(`of ${total} disclosures`).test(allView), `all ${total} disclosures are listed`);
check(/DSU/.test(allView) && /USD/.test(allView), 'other schools’ disclosures are visible');

// An IP manager must not be able to get there.
const managerBlocked = await page.evaluate(() => {
  const s = window.__store.getState();
  s.setCurrentUser('u-ipm-mines');
  window.__store.getState().setActiveUniversity('all');
  return window.__store.getState().activeUniversityId;
});
check(managerBlocked !== 'all', `an IP manager cannot enter all-schools mode (got "${managerBlocked}")`);

// Nor inherit it by persona switch.
const inherited = await page.evaluate(() => {
  const s = window.__store.getState();
  s.setCurrentUser('u-admin');
  s.setActiveUniversity('all');
  window.__store.getState().setCurrentUser('u-ipm-mines');
  return window.__store.getState().activeUniversityId;
});
check(inherited !== 'all', `switching away from the admin drops the cross-school view (got "${inherited}")`);

// ---------------------------------------------------------------------------
console.log('\n[G3] acting on one school never files into another');
await reset('u-admin');
const filing = await page.evaluate(() => {
  const s = window.__store.getState();
  // Point the session at DSU, then publish a MINES disclosure by id.
  s.setActiveUniversity('org-dsu');
  const st = window.__store.getState();
  const mines = st.ipItems.find((i) => {
    const uni = st.universities.find((u) => u.id === i.universityId);
    return i.universityId === 'org-mines' && window.__canPublish(i, uni.redactionPolicy).ok;
  });
  window.__store.getState().updateScope(mines.id, 'statewide');
  const ev = window.__store.getState().audit[0];
  return { session: 'org-dsu', filedTo: ev.universityId, itemOwner: mines.universityId, detail: ev.detail };
});
check(
  filing.filedTo === filing.itemOwner,
  `the event files to the item's owner, not the session (${filing.filedTo} vs session ${filing.session})`,
);

await page.evaluate(() => window.__store.getState().setActiveUniversity('org-mines'));
await page.goto(`${BASE}/#/manage/audit`);
await page.waitForTimeout(800);
check((await body()).includes(filing.detail), 'and it shows on the owning school’s audit trail');

await page.evaluate(() => window.__store.getState().setActiveUniversity('org-dsu'));
await page.waitForTimeout(700);
check(!(await body()).includes(filing.detail), 'and not on the school that merely happened to be selected');

// A policy change has no item, so it must name its school explicitly.
const policyFiling = await page.evaluate(() => {
  const s = window.__store.getState();
  s.setActiveUniversity('org-mines');
  const usd = s.universities.find((u) => u.id === 'org-usd');
  window.__store.getState().updateRedactionPolicy('org-usd', usd.redactionPolicy.slice(0, 3));
  return window.__store.getState().audit[0].universityId;
});
check(policyFiling === 'org-usd', `a policy change files to the school it changed (${policyFiling})`);

// ---------------------------------------------------------------------------
console.log('\n[G4] a university can see when Wildfire acted on its portfolio');
await page.evaluate(() => window.__store.getState().setActiveUniversity('org-mines'));
await page.goto(`${BASE}/#/manage/audit`);
await page.waitForTimeout(800);
const audit = await body();
check(/Wildfire Labs/.test(audit), 'admin actions are badged');
check(/acting for SD Mines/.test(audit), 'and name the school they were taken on behalf of');

// ---------------------------------------------------------------------------
console.log('\n[G5] importing needs a destination');
await page.evaluate(() => {
  window.__store.getState().setCurrentUser('u-admin');
  window.__store.getState().setActiveUniversity('all');
});
await page.goto(`${BASE}/#/manage/import`);
await page.waitForTimeout(800);
check(/Pick a university first/.test(await body()), 'import refuses in the all-schools view');

await page.evaluate(() => window.__store.getState().setActiveUniversity('org-usd'));
await page.waitForTimeout(700);
const importUsd = await body();
check(!/Pick a university first/.test(importUsd), 'and works once a school is chosen');
check(/USD/.test(importUsd), 'naming the school the rows will land in');

// Release policy has the same "which school?" problem.
await page.evaluate(() => window.__store.getState().setActiveUniversity('all'));
await page.goto(`${BASE}/#/manage/policy`);
await page.waitForTimeout(800);
check(/pick which one you are editing/.test(await body()), 'the policy page asks which school');
await page.getByRole('button', { name: /University of South Dakota/ }).click();
await page.waitForTimeout(700);
check(/release criteria/i.test(await body()), 'choosing one opens its policy');

// ---------------------------------------------------------------------------
console.log('\n[G6] the lead numbers agree with the queue they point at');
await reset('u-ipm-mines');
await page.goto(`${BASE}/#/manage/leads`);
await page.waitForTimeout(900);
const badge = await page.evaluate(() => {
  const link = [...document.querySelectorAll('nav a')].find((a) => a.textContent.includes('Lead review'));
  const pill = link?.querySelector('span:last-child');
  return Number(pill?.textContent?.trim() ?? '0');
});
const queued = await page.evaluate(() => {
  const tab = [...document.querySelectorAll('[role="tab"]')].find((t) => t.textContent.includes('Waiting'));
  return Number((tab?.textContent ?? '').replace(/\D/g, '') || '0');
});
check(badge === queued, `the sidebar badge equals the waiting queue (${badge} vs ${queued})`);

// ---------------------------------------------------------------------------
console.log('\n[G7] the closed route holes stay closed');
const cases = [
  { user: 'u-vpr-mines', route: '/admin', home: '#/insights' },
  { user: 'u-founder', route: '/admin', home: '#/home' },
  { user: 'u-founder', route: '/professor', home: '#/home' },
  { user: 'u-admin', route: '/professor', home: '#/admin' },
];
for (const c of cases) {
  await page.evaluate((id) => window.__store.getState().setCurrentUser(id), c.user);
  await page.goto(`${BASE}/#${c.route}`);
  await page.waitForTimeout(450);
  check(page.url().endsWith(c.home), `${c.user} is bounced from ${c.route} to ${c.home}`);
}

// Leadership stays locked out of every manager route — the Phase D guarantee,
// re-asserted here because this phase widened who counts as a manager.
await page.evaluate(() => window.__store.getState().setCurrentUser('u-vpr-mines'));
for (const route of MANAGER_ROUTES) {
  await page.goto(`${BASE}/#${route}`);
  await page.waitForTimeout(300);
  check(page.url().endsWith('#/insights'), `leadership still bounces off ${route}`);
}

await browser.close();
finish('Phase G');
