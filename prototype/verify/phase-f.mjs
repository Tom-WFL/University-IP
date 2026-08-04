/**
 * Phase F — bulk publishing from the IP console.
 *
 * Lives in the repo rather than a scratch directory on purpose: an earlier
 * container restart wiped the out-of-tree harnesses and took ~150 checks with
 * them. Anything worth trusting has to be committed.
 *
 *   npx vite --host 127.0.0.1 --port 8080 --strictPort   # in another shell
 *   node verify/phase-f.mjs
 */
import { EXECUTABLE_PATH, chromium, harness } from './_playwright.mjs';

const BASE = process.env.BASE ?? 'http://127.0.0.1:8080';
const { check, watch, finish } = harness();

const browser = await chromium.launch({ executablePath: EXECUTABLE_PATH });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
watch(page);
const body = () => page.locator('body').innerText();

await page.goto(BASE);
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await page.evaluate(() => window.__store.getState().setCurrentUser('u-ipm-mines'));

// ---------------------------------------------------------------------------
console.log('\n[F1] the store publishes a batch and holds back what is not ready');
const seed = await page.evaluate(() => {
  const s = window.__store.getState();
  return s.ipItems
    .filter((i) => i.universityId === 'org-mines' && i.publishScope === 'private')
    .map((i) => {
      const uni = s.universities.find((u) => u.id === i.universityId);
      return { id: i.id, ready: window.__canPublish(i, uni.redactionPolicy).ok };
    });
});
const readyIds = seed.filter((s) => s.ready).map((s) => s.id);
const blockedIds = seed.filter((s) => !s.ready).map((s) => s.id);
console.log(`   private items: ${readyIds.length} ready, ${blockedIds.length} gated`);
check(readyIds.length >= 2, 'the seed has at least two publishable private items');
check(blockedIds.length >= 2, 'and at least two the gate should refuse');

const batch = await page.evaluate((ids) => {
  const s = window.__store.getState();
  const before = s.audit.length;
  const result = s.updateScopeMany(ids, 'national');
  const after = window.__store.getState();
  return {
    published: result.published,
    refused: result.refused,
    auditAdded: after.audit.length - before,
    detail: after.audit[0].detail,
    scopes: ids.map((id) => after.ipItems.find((i) => i.id === id).publishScope),
  };
}, [...readyIds, ...blockedIds]);

check(batch.published.length === readyIds.length, `published exactly the ${readyIds.length} ready items`);
check(batch.refused.length === blockedIds.length, `refused exactly the ${blockedIds.length} gated ones`);
check(
  batch.refused.every((r) => r.reason && r.title),
  'every refusal carries a title and a reason',
);
check(batch.auditAdded === 1, `one audit entry for the whole batch, not ${readyIds.length}`);
check(/in one action/.test(batch.detail), `the entry says it was a batch — "${batch.detail}"`);
check(/held back/.test(batch.detail), 'and records that some were held back');

const gatedStillPrivate = await page.evaluate(
  (ids) =>
    ids.every((id) => window.__store.getState().ipItems.find((i) => i.id === id).publishScope === 'private'),
  blockedIds,
);
check(gatedStillPrivate, 'not one gated item moved');

// ---------------------------------------------------------------------------
console.log('\n[F2] a batch never narrows by accident');
const narrowAttempt = await page.evaluate(() => {
  const s = window.__store.getState();
  const wide = s.ipItems.find((i) => i.universityId === 'org-mines' && i.publishScope === 'national');
  const r = s.updateScopeMany([wide.id], 'campus');
  return {
    refused: r.refused.length,
    published: r.published.length,
    scope: window.__store.getState().ipItems.find((i) => i.id === wide.id).publishScope,
  };
});
check(narrowAttempt.published === 0, 'bulk refuses to narrow');
check(narrowAttempt.scope === 'national', 'the item keeps its wider scope');
check(narrowAttempt.refused === 1, 'and says so rather than silently skipping');

// ---------------------------------------------------------------------------
console.log('\n[F3] the console selects, and the selection respects the filter');
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.evaluate(() => window.__store.getState().setCurrentUser('u-ipm-mines'));
await page.goto(`${BASE}/#/manage/ip`);
await page.waitForTimeout(900);

const rowBoxes = await page.locator('table tbody input[type="checkbox"], table tbody [role="checkbox"]').count();
check(rowBoxes > 0, `every row has a checkbox (${rowBoxes})`);

await page.getByRole('checkbox', { name: /Select all \d+ shown/ }).click();
await page.waitForTimeout(400);
const afterAll = await body();
check(/12 selected/.test(afterAll), `select-all takes the whole visible list (${(afterAll.match(/(\d+) selected/) || [])[0]})`);

// Narrowing the filter must drop the selection rather than keep hidden rows.
await page.getByRole('combobox').click();
await page.waitForTimeout(300);
await page.getByRole('option', { name: 'At campus', exact: true }).click();
await page.waitForTimeout(600);
check(!/selected/.test(await body()), 'changing the filter clears the selection');

await page.getByRole('checkbox', { name: /Select all \d+ shown/ }).click();
await page.waitForTimeout(400);
const campusSel = await body();
check(/4 selected/.test(campusSel), `select-all now takes only the filtered rows (${(campusSel.match(/(\d+) selected/) || [])[0]})`);

// ---------------------------------------------------------------------------
console.log('\n[F4] the batch dialog splits ready from held before committing');
await page.getByRole('combobox').click();
await page.waitForTimeout(300);
await page.getByRole('option', { name: 'All IP', exact: true }).click();
await page.waitForTimeout(600);
await page.getByRole('checkbox', { name: /Select all \d+ shown/ }).click();
await page.waitForTimeout(400);

await page.getByRole('button', { name: 'Publish selected to…' }).click();
await page.waitForTimeout(400);
await page.getByRole('menuitem', { name: /Statewide/ }).click();
await page.waitForTimeout(700);

const dlg = await body();
check(/Publish \d+ disclosures?/.test(dlg), 'the dialog counts what will actually go out');
check(/Held back —/.test(dlg), 'and lists the ones that will not, with reasons');
check(/still an unread AI draft/.test(dlg), 'naming the specific blocker');

const dlgBoxes = await page.getByRole('dialog').getByRole('checkbox').count();
check(dlgBoxes === 1, `one authority confirmation for the batch (found ${dlgBoxes})`);

const confirmName = await page.getByRole('dialog').getByRole('button', { name: /^Publish \d+$/ }).count();
check(confirmName === 1, 'the confirm button names the count');

await page.getByRole('dialog').getByRole('checkbox').first().click();
await page.getByRole('dialog').getByRole('button', { name: /^Publish \d+$/ }).click();
await page.waitForTimeout(800);

const after = await body();
check(/Published \d+ to statewide/.test(after), `the page reports what happened — "${(after.match(/Published [^.]+\./) || [])[0]}"`);
check(/held back/.test(after), 'and names the held-back items rather than hiding them');
check(!/selected/.test(after), 'the selection clears after publishing');

const finalState = await page.evaluate(() => {
  const s = window.__store.getState();
  const mine = s.ipItems.filter((i) => i.universityId === 'org-mines');
  return {
    statewide: mine.filter((i) => i.publishScope === 'statewide').length,
    private: mine.filter((i) => i.publishScope === 'private').length,
    unreviewedPrivate: mine.filter((i) => i.publishScope === 'private' && !i.summaryReviewed).length,
  };
});
check(finalState.statewide >= 5, `several moved to statewide (${finalState.statewide})`);
check(
  finalState.private === finalState.unreviewedPrivate,
  `everything still private is there because the gate held it (${finalState.private})`,
);

// ---------------------------------------------------------------------------
console.log('\n[F5] a selection with nothing publishable refuses outright');
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.evaluate(() => window.__store.getState().setCurrentUser('u-ipm-mines'));
await page.goto(`${BASE}/#/manage/ip?filter=needs_review`);
await page.waitForTimeout(900);
await page.getByRole('checkbox', { name: /Select all \d+ shown/ }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Publish selected to…' }).click();
await page.waitForTimeout(400);
await page.getByRole('menuitem', { name: /Campus/ }).click();
await page.waitForTimeout(700);

const blockedDlg = await body();
check(/Nothing can publish/.test(blockedDlg), 'the confirm button refuses when nothing is ready');
const blockedBoxes = await page.getByRole('dialog').getByRole('checkbox').count();
check(blockedBoxes === 0, `and asks for no attestation it could not honour (found ${blockedBoxes})`);
const disabled = await page.getByRole('button', { name: 'Nothing can publish' }).isDisabled();
check(disabled, 'the button is disabled');

await browser.close();
finish('Phase F');
