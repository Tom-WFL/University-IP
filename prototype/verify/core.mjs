import { EXECUTABLE_PATH, chromium, harness } from './_playwright.mjs';
import fs from 'fs';

const BASE = 'http://127.0.0.1:8080';
const SHOTS = '/tmp/claude-0/-home-user-University-IP/e8428285-66a2-5d5b-87a9-b9a15c1b1b6a/scratchpad/shots2';
fs.mkdirSync(SHOTS, { recursive: true });

const fails = [];
const errors = [];
const ok = (label) => console.log(`  ok  ${label}`);
const bad = (label) => {
  fails.push(label);
  console.log(`  FAIL ${label}`);
};
const check = (cond, label) => (cond ? ok(label) : bad(label));

const browser = await chromium.launch({ executablePath: EXECUTABLE_PATH });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(`PAGEERROR ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`CONSOLE ${m.text()}`);
});

const body = () => page.locator('body').innerText();
const shot = (n) => page.screenshot({ path: `${SHOTS}/${n}.png`, fullPage: true });

// ---------------------------------------------------------------------------
// 7. Migration first: plant v1-shaped state and confirm it recovers.
// ---------------------------------------------------------------------------
console.log('\n[7] v1 persisted state migrates instead of white-screening');
await page.goto(BASE);
await page.evaluate(() => {
  // The old shape: inventors as a string inside disclosure, no summary fields.
  localStorage.setItem(
    'university-ip-prototype',
    JSON.stringify({
      version: 1,
      state: {
        ipItems: [
          {
            id: 'ip-old',
            universityId: 'org-mines',
            title: 'Stale v1 row',
            publicSummary: 'x',
            confidentialDetail: 'y',
            disclosure: { disclosureNumber: 'OLD-1', field: 'f', inventors: 'A. Person' },
            ownership: 'bor',
            publishScope: 'private',
            route: 'undecided',
          },
        ],
        currentUserId: 'u-ipm-mines',
        activeUniversityId: 'org-mines',
      },
    }),
  );
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(900);
const afterMigrate = await body();
check(/South Dakota Mines/.test(afterMigrate), 'app renders after v1 state');
check(!/Stale v1 row/.test(afterMigrate), 'incompatible v1 data was dropped');
check(
  await page.evaluate(
    () => JSON.parse(localStorage.getItem('university-ip-prototype')).version === 3,
  ),
  'persisted version bumped to 3',
);

// Clean slate for the rest.
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(700);

// ---------------------------------------------------------------------------
// Dashboard surfaces the review queue
// ---------------------------------------------------------------------------
console.log('\n[0] Dashboard surfaces unreviewed drafts');
const dash = await body();
check(/AI draft summaries need your review/.test(dash), 'attention queue names the drafts');
await shot('01-dashboard');

// ---------------------------------------------------------------------------
// 1. The gate holds
// ---------------------------------------------------------------------------
console.log('\n[1] Publishing is blocked while the draft is unread');
await page.goto(`${BASE}/#/manage/ip?filter=needs_review`);
await page.waitForTimeout(700);
const consoleText = await body();
check(/Draft needs review/.test(consoleText), 'console flags drafts needing review');
check(/4 of 12 disclosures/.test(consoleText), 'needs-review filter narrows to the 4 drafts');
await shot('02-console-needs-review');

// Open the leak case.
await page.getByText('Tailings-to-aggregate reprocessing method').first().click();
await page.waitForTimeout(700);
const detail = await body();
check(
  /still an unread AI draft|unread AI draft/.test(detail),
  'publish is blocked with a stated reason',
);
await shot('03-detail-blocked');

// aria-disabled does not stop a real browser click, so force one through and
// prove the handler itself refuses rather than relying on the attribute.
await page.getByRole('button', { name: /Publish to campus/ }).click({ force: true });
await page.waitForTimeout(500);
check(
  !(await page.getByRole('dialog').isVisible().catch(() => false)),
  'dual-control dialog never opens for an unread draft',
);

// ---------------------------------------------------------------------------
// 2. Review unblocks it
// ---------------------------------------------------------------------------
console.log('\n[2] Reviewing the summary unblocks publishing');
await page.getByRole('button', { name: 'Review the summary' }).click();
await page.waitForTimeout(500);
const contentTab = await body();
check(/must not leave this office/.test(contentTab), 'the seeded draft carries a real leak');
check(/AI draft — needs review/.test(contentTab), 'provenance badge reads as an unread draft');
check(/Nobody has checked this draft yet/.test(contentTab), 'the warning explains why it matters');
await shot('04-summary-needs-review');

await page.getByRole('button', { name: 'Edit summary' }).click();
await page.waitForTimeout(300);
const fixed =
  'A process that reprocesses mine tailings into construction aggregate, diverting waste from containment and producing a saleable material for local construction.';
await page.getByLabel('Non-confidential summary').fill(fixed);
await page.getByRole('button', { name: 'Save summary' }).click();
await page.waitForTimeout(600);

const afterFix = await body();
check(!/must not leave this office/.test(afterFix), 'the leaked phrase is gone');
// A substantial rewrite makes the text the manager's, and the badge has to
// stop crediting the model for it (Phase A defect fix).
check(/Written by/.test(afterFix), 'a full rewrite reattributes the summary to the human');
await shot('05-summary-reviewed');

// Reviewing the text is no longer enough on its own. Phase B added the
// per-criterion attestation, so the gate still holds until each release
// criterion has been ticked — assert that, then clear it.
await page.getByRole('tab', { name: 'Manage' }).click();
await page.waitForTimeout(400);
check(!/unread AI draft/.test(await body()), 'the unread-draft block is gone');
check(
  /release criteri/i.test(await body()),
  'but the release criteria still hold it back until they are checked',
);

await page.evaluate(() => {
  const s = window.__store.getState();
  const item = s.ipItems.find((i) => i.id === 'ip-008');
  const uni = s.universities.find((u) => u.id === item.universityId);
  s.setSummaryCriteria('ip-008', uni.redactionPolicy.map((c) => c.id));
});
await page.waitForTimeout(400);
check(!/release criteri/i.test(await body()), 'attesting each criterion clears the gate');

await page.getByRole('button', { name: /Publish to campus/ }).click();
await page.waitForTimeout(600);
check(await page.getByRole('dialog').isVisible(), 'dual control opens now the draft is reviewed');
check(
  /A process that reprocesses mine tailings/.test(await body()),
  'dual control previews the corrected text',
);
await shot('06-dual-control');

// One checkbox now: the content check happened at review, criterion by
// criterion, and the dialog shows that as evidence instead of re-asking.
await page.getByRole('dialog').getByRole('checkbox').first().check();
await page.getByRole('button', { name: 'Publish', exact: true }).click();
await page.waitForTimeout(700);
check(/Campus/.test(await body()), 'item is published to campus');

// Audit records review and publish as separate events.
await page.getByRole('tab', { name: 'Audit' }).click();
await page.waitForTimeout(500);
const audit = await body();
check(/Corrected the AI draft summary/.test(audit), 'audit logs the summary correction');
check(/Published .* to campus/.test(audit), 'audit logs the publish separately');
await shot('07-audit');

// ---------------------------------------------------------------------------
// 3. Approve-as-is logs differently
// ---------------------------------------------------------------------------
console.log('\n[3] Approving a clean draft as-is');
await page.goto(`${BASE}/#/manage/ip/ip-010`);
await page.waitForTimeout(600);
await page.getByRole('tab', { name: /Content/ }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Looks right' }).click();
await page.waitForTimeout(600);
check(/AI draft, checked by/.test(await body()), 'approve-as-is marks it reviewed');
await page.getByRole('tab', { name: 'Audit' }).click();
await page.waitForTimeout(400);
check(
  /Approved the AI draft summary .* as written/.test(await body()),
  'approve logs distinctly from an edit',
);

// ---------------------------------------------------------------------------
// 4. Full record edit
// ---------------------------------------------------------------------------
console.log('\n[4] Editing the whole record');
await page.goto(`${BASE}/#/manage/ip/ip-001/edit`);
await page.waitForTimeout(700);
const editPage = await body();
check(/Edit disclosure/.test(editPage), 'edit form loads');
const inventorNames = await page.getByPlaceholder('Dr. Jane Turnbull').evaluateAll((els) =>
  els.map((e) => e.value),
);
check(
  inventorNames.includes('A. Voss') && inventorNames.includes('J. Turnbull'),
  'existing inventors are listed',
);
await shot('08-edit-form');

// Add a co-inventor.
await page.getByRole('button', { name: 'Add', exact: true }).click();
await page.waitForTimeout(300);
const nameInputs = page.getByPlaceholder('Dr. Jane Turnbull');
await nameInputs.last().fill('M. Okafor');
await page.getByPlaceholder('j.turnbull@sdmines.example.edu').last().fill('m.okafor@sdsmt.edu');

// Mark the first inventor departed, and make the second the contact.
await page.getByRole('switch').first().click();
await page.getByRole('radio').nth(1).check();

// Change patent status + title, so the audit diff has several fields.
await page.getByRole('combobox').filter({ hasText: /Provisional/ }).click();
await page.waitForTimeout(300);
await page.getByRole('option', { name: 'Filed', exact: true }).click();
await page.waitForTimeout(200);

const titleInput = page.locator('input').first();
await titleInput.fill('Sintered lattice heat exchanger (rev B)');
await shot('09-edit-inventors');

await page.getByRole('button', { name: 'Save changes' }).click();
await page.waitForTimeout(800);

const afterEdit = await body();
check(/Sintered lattice heat exchanger \(rev B\)/.test(afterEdit), 'title change saved');
check(/M. Okafor/.test(afterEdit), 'co-inventor added');
check(/Filed/.test(afterEdit), 'patent status saved');
check(/SDM-2024-014/.test(afterEdit), 'sibling disclosure fields were NOT dropped by the merge');
await shot('10-after-edit');

// The inventor chips live on the Content tab; the header renders the same
// facts as one lowercase line.
check(/A\. Voss \(departed\)/.test(afterEdit), 'header line marks the departed inventor');
await page.getByRole('tab', { name: /Content/ }).click();
await page.waitForTimeout(500);
const contentAfterEdit = await body();
check(/Departed/.test(contentAfterEdit), 'departed chip shows on the inventor row');
check(/Contact/.test(contentAfterEdit), 'contact chip shows on the new primary');
await shot('10b-after-edit-content');

await page.getByRole('tab', { name: 'Audit' }).click();
await page.waitForTimeout(500);
const editAudit = await body();
check(
  /Edited "Sintered lattice heat exchanger \(rev B\)"/.test(editAudit),
  'audit uses the NEW title, not the old one',
);
check(/inventors/.test(editAudit) && /patent status/.test(editAudit), 'audit names changed fields');
await shot('11-edit-audit');

// ---------------------------------------------------------------------------
// 5. Live edit confirms; private does not
// ---------------------------------------------------------------------------
console.log('\n[5] Editing a live summary asks first');
await page.goto(`${BASE}/#/manage/ip/ip-002`); // statewide = live
await page.waitForTimeout(600);
await page.getByRole('tab', { name: /Content/ }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Edit summary' }).click();
await page.waitForTimeout(300);
await page.getByLabel('Non-confidential summary').fill('An edited live summary for verification.');
await page.getByRole('button', { name: 'Save summary' }).click();
await page.waitForTimeout(600);
const liveDialog = await body();
check(/This one is already live/.test(liveDialog), 'live-edit confirm appears for a published item');
check(/Everyone at the other schools/.test(liveDialog), 'it names who currently sees it');
await shot('12-live-edit-confirm');
await page.getByRole('button', { name: 'Update the live summary' }).click();
await page.waitForTimeout(600);
check(
  /An edited live summary for verification/.test(await body()),
  'confirmed live edit saves',
);

// A private item saves with no dialog.
await page.goto(`${BASE}/#/manage/ip/ip-006`);
await page.waitForTimeout(600);
await page.getByRole('tab', { name: /Content/ }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Edit summary' }).click();
await page.waitForTimeout(300);
await page.getByLabel('Non-confidential summary').fill('Private edit, no confirmation expected.');
await page.getByRole('button', { name: 'Save summary' }).click();
await page.waitForTimeout(600);
check(
  !/This one is already live/.test(await body()),
  'private items save without a confirmation',
);

// ---------------------------------------------------------------------------
// 6. Nothing leaks to founders
// ---------------------------------------------------------------------------
console.log('\n[6] Founder views never show confidential text or unread drafts');
await page.goto(`${BASE}/#/discover`);
await page.waitForTimeout(400);
// Switch to the founder persona.
await page.locator('header button').filter({ hasText: /Rae Whitlock|IP Manager/ }).first().click();
await page.waitForTimeout(400);
await page.getByRole('menuitem', { name: /Priya Raman/ }).first().click();
await page.waitForTimeout(900);
await page.goto(`${BASE}/#/discover`);
await page.waitForTimeout(800);

const discover = await body();
check(!/CONFIDENTIAL/.test(discover), 'no confidential text in discovery');
check(!/must not leave this office/.test(discover), 'the leaked phrase never reached a founder');
check(
  !/crown jewel/.test(discover),
  'no crown-jewel phrasing leaked into founder-visible text',
);
// ip-010 was approved but is still private — must not be visible.
check(!/Modular grid-edge battery enclosure/.test(discover), 'reviewed-but-private stays hidden');
await shot('13-founder-discover');

await browser.close();

console.log('\n=== RESULT ===');
console.log(errors.length ? `JS errors:\n  ${errors.join('\n  ')}` : 'JS errors: none');
if (fails.length || errors.length) {
  console.log(`\n${fails.length} check(s) failed.`);
  process.exit(1);
}
console.log('All checks passed.');
