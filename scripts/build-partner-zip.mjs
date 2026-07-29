import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Build the zip that goes to a university partner.
 *
 * This repo holds Wildfire's internal feature-pipeline artifacts alongside the
 * prototype, and those must not go out:
 *
 *   candidates/  — verbatim quotes from a private meeting, including written
 *                  characterisations of other schools' staffing
 *   features/    — the Jul 2 intake, which is USD/DSU discovery and names
 *                  individuals at other Regental institutions
 *   docs/        — the port map, i.e. a map of Wildfire's private codebase
 *
 * So the zip is built from an ALLOW-list, not by excluding things. The file
 * list comes from `git ls-files prototype/`, which means gitignored junk
 * (node_modules, dist, build caches) cannot leak in and the archive cannot
 * balloon to 200 MB the way a naive `zip -r` would.
 *
 * Usage: node scripts/build-partner-zip.mjs [outputDir]
 */

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = process.argv[2] ? path.resolve(process.argv[2]) : repoRoot;

/** What the folder is called when they unzip it. */
const PACKAGE_NAME = 'wildfire-university-ip-prototype';

/** Paths under prototype/ that stay internal even though they're tracked. */
const EXCLUDE = new Set([
  'prototype/.gitignore',
  // Superseded by PARTNER-README.md, which is written for them, not for us.
  'prototype/README.md',
]);

const git = (...args) =>
  execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();

// ---------------------------------------------------------------------------

const tracked = git('ls-files', 'prototype')
  .split('\n')
  .filter(Boolean)
  .filter((f) => !EXCLUDE.has(f));

if (!tracked.length) {
  console.error('No tracked files under prototype/ — is this the right repo?');
  process.exit(1);
}

// The single-file build must exist and be current; it is the whole point of
// the package for a non-technical reader.
const built = path.join(repoRoot, 'prototype/university-ip-prototype.html');
if (!fs.existsSync(built)) {
  console.error('prototype/university-ip-prototype.html is missing — run `npm run build:single` first.');
  process.exit(1);
}

const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'partner-zip-'));
const root = path.join(staging, PACKAGE_NAME);

let copied = 0;
for (const file of tracked) {
  // Strip the leading prototype/ so the app sits at the root of the zip.
  const rel = file.replace(/^prototype\//, '');
  // PARTNER-README.md becomes their README.
  const dest = path.join(root, rel === 'PARTNER-README.md' ? 'README.md' : rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(repoRoot, file), dest);
  copied += 1;
}

if (!fs.existsSync(path.join(root, 'README.md'))) {
  console.error('PARTNER-README.md was not found — the package would ship with no instructions.');
  process.exit(1);
}

const zipPath = path.join(outDir, `${PACKAGE_NAME}.zip`);
fs.rmSync(zipPath, { force: true });
execFileSync('zip', ['-r', '-q', zipPath, PACKAGE_NAME], { cwd: staging });
fs.rmSync(staging, { recursive: true, force: true });

const kb = (fs.statSync(zipPath).size / 1024).toFixed(0);
console.log(`Wrote ${zipPath}`);
console.log(`  ${copied} files, ${kb} KB, unzips to ${PACKAGE_NAME}/`);
console.log('  Internal artifacts excluded: candidates/, features/, docs/, root README.');
