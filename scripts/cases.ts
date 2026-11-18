/* eslint-disable no-console */
/**
 * Test case documentation tool.
 *   npm run cases:generate   writes docs/test-cases/<module>.md and the master CSV <module>.csv
 *   npm run cases:check      traceability check: fails when code, catalogue and docs drift apart
 *
 * Source of truth: the tests (IDs in the test titles, listed by Playwright) and the catalogue
 * (reporters/testCaseCatalog.ts: preconditions, steps, data, expected result).
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { CATALOG, type CaseSpec } from '../reporters/testCaseCatalog';
import { MODULES } from '../reporters/modules';

const DOCS = 'docs/test-cases';
const ID_RE = /^(TC\d{2}[a-z]?(\.\d+)?|API\d+[a-z]?|DEF-\d{2}(\.\d+)?)$/;
const TYPE_ORDER: CaseSpec['type'][] = [
  'Positive',
  'Negative',
  'Validation',
  'Security',
  'Boundary',
  'Defect',
];

interface Found {
  id: string;
  title: string;
  file: string;
  module: string;
  tags: string[];
}
interface JsonSuite {
  suites?: JsonSuite[];
  specs?: { title: string; file: string; tags?: string[] }[];
}

const slugOf = (file: string): string => {
  const base = basename(file).replace(/\.spec\.ts$/, '');
  return base === 'contactAndNavigation' ? 'contact' : base;
};

function listTests(): Found[] {
  const out = execSync('npx playwright test --project=chromium --list --reporter=json', {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const json = JSON.parse(out) as JsonSuite;
  const found: Found[] = [];
  const walk = (s: JsonSuite): void => {
    for (const spec of s.specs ?? []) {
      if (spec.file.includes('setup')) continue;
      found.push({
        id: spec.title.split(' - ')[0] ?? spec.title,
        title: spec.title.replace(/^[^ ]+ - /, ''),
        file: `tests/${spec.file.replace(/\\/g, '/')}`,
        module: slugOf(spec.file),
        tags: spec.tags ?? [],
      });
    }
    (s.suites ?? []).forEach(walk);
  };
  walk(json);
  return found;
}

const idKey = (id: string): (string | number)[] =>
  id.split(/(\d+)/).map((p) => (/^\d+$/.test(p) ? Number(p) : p));
const byId = (a: { id: string }, b: { id: string }): number => {
  const x = idKey(a.id);
  const y = idKey(b.id);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const p = x[i] ?? '';
    const r = y[i] ?? '';
    if (p === r) continue;
    return typeof p === 'number' && typeof r === 'number' ? p - r : String(p) < String(r) ? -1 : 1;
  }
  return 0;
};

// ---- CSV helpers -------------------------------------------------------------------------------
const q = (v: string): string => `"${v.replace(/"/g, '""')}"`;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQ = false;
  const src = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQ) {
      if (c === '"' && src[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') {
      row.push(cur);
      cur = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
    } else cur += c;
  }
  if (cur || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

const HEADER = [
  'ID',
  'Module',
  'Feature',
  'Type',
  'Title',
  'Priority',
  'Preconditions',
  'Test Data',
  'Steps',
  'Expected Result',
  'Automation',
  'Automation Script',
  'Smoke',
  'Regression',
  'Last Updated',
];

const today = (): string => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

/** Rows that did not change keep their "Last Updated" date; a new or changed row gets today's date. */
function csvFor(slug: string, tests: Found[]): string {
  const file = join(DOCS, `${slug}.csv`);
  const old = new Map<string, { content: string; date: string }>();
  if (existsSync(file)) {
    for (const r of parseCsv(readFileSync(file, 'utf8')).slice(1)) {
      if (r[0]) old.set(r[0], { content: r.slice(0, -1).join('\u0001'), date: r[r.length - 1] ?? '' });
    }
  }
  const mod = MODULES.find((m) => m.slug === slug);
  const lines = tests.map((t) => {
    const c = CATALOG[t.id] as CaseSpec;
    const cells = [
      t.id,
      mod?.name ?? slug,
      c.feature,
      c.type,
      t.title,
      c.priority,
      c.pre,
      c.data,
      c.steps.map((s, n) => `${n + 1}. ${s}`).join('\n'),
      c.expected,
      'Automated',
      t.file,
      t.tags.includes('smoke') ? 'Yes' : 'No',
      t.tags.includes('regression') ? 'Yes' : 'No',
    ];
    const prev = old.get(t.id);
    const date = prev && prev.content === cells.join('\u0001') ? prev.date : today();
    return [...cells, date].map(q).join(',');
  });
  return '\uFEFF' + [HEADER.map(q).join(','), ...lines].join('\r\n') + '\r\n';
}

// ---- Markdown ----------------------------------------------------------------------------------
const md = (s: string): string => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');

function docFor(slug: string, tests: Found[]): string {
  const mod = MODULES.find((m) => m.slug === slug);
  const name = mod?.name ?? slug;
  const sections: string[] = [];
  let letter = 65;
  const countOf = (type: CaseSpec['type']): number =>
    tests.filter((t) => (CATALOG[t.id] as CaseSpec).type === type).length;
  for (const type of TYPE_ORDER) {
    const group = tests.filter((t) => (CATALOG[t.id] as CaseSpec).type === type);
    if (!group.length) continue;
    const rows = group.map((t) => {
      const c = CATALOG[t.id] as CaseSpec;
      const steps = c.steps.map((s, n) => `${n + 1}. ${s}`).join(' ');
      return `| ${t.id} | ${md(t.title)} | ${c.priority} | ${md(c.pre)} | ${md(c.data)} | ${md(steps)} | ${md(c.expected)} |`;
    });
    sections.push(
      `## ${String.fromCharCode(letter++)}. ${type} cases\n\n| ID | Title | Priority | Preconditions | Test data | Steps | Expected result |\n| --- | --- | --- | --- | --- | --- | --- |\n${rows.join('\n')}`,
    );
  }
  const summary = TYPE_ORDER.filter((type) => countOf(type) > 0)
    .map((type) => `| ${type} | ${countOf(type)} | ${countOf(type)} |`)
    .join('\n');
  return `# ${name} Test Cases

**Automation:** \`${tests[0]?.file ?? mod?.spec}\`  |  **Master CSV:** \`docs/test-cases/${slug}.csv\`  |  **Reports:** \`reports/${slug}/${name} test <DD-MM-YYYY>_<HH-mm-ss>.html\` (all runs: \`reports/index.html\`)
**Application:** https://automationexercise.com

## Overview
${mod?.overview ?? ''}

## Scope and notes
${mod?.scope ?? ''}

${sections.join('\n\n')}

## Summary

| Type | Cases | Automated |
| --- | --- | --- |
${summary}
| **Total** | **${tests.length}** | **${tests.length}** |

> Generated by \`npm run cases:generate\` from the test titles and \`reporters/testCaseCatalog.ts\`. Do not edit by hand; \`npm run cases:check\` fails when this file and the code differ.
`;
}

// ---- main --------------------------------------------------------------------------------------
function fail(errors: string[]): never {
  console.error(`Traceability check FAILED:\n - ${errors.join('\n - ')}`);
  process.exit(1);
}

function main(): void {
  const mode = process.argv[2] === 'generate' ? 'generate' : 'check';
  const errors: string[] = [];
  const tests = listTests();

  const seen = new Set<string>();
  for (const t of tests) {
    if (!ID_RE.test(t.id)) errors.push(`Bad or missing test case ID in title: "${t.id}" (${t.file})`);
    if (seen.has(t.id)) errors.push(`Duplicate test case ID ${t.id}`);
    seen.add(t.id);
    if (!CATALOG[t.id])
      errors.push(`${t.id} is in the code (${t.file}) but NOT documented in reporters/testCaseCatalog.ts`);
    if (!MODULES.some((m) => m.slug === t.module))
      errors.push(`Module "${t.module}" (${t.file}) is missing in reporters/modules.ts`);
  }
  for (const id of Object.keys(CATALOG)) {
    if (!seen.has(id)) errors.push(`${id} is documented in the catalogue but no test with this ID exists`);
  }
  if (errors.length) fail(errors);

  mkdirSync(DOCS, { recursive: true });
  for (const m of MODULES) {
    const list = tests.filter((t) => t.module === m.slug).sort(byId);
    if (!list.length) {
      errors.push(`Module ${m.slug} has no tests`);
      continue;
    }
    const mdPath = join(DOCS, `${m.slug}.md`);
    const csvPath = join(DOCS, `${m.slug}.csv`);
    const wantMd = docFor(m.slug, list);
    const wantCsv = csvFor(m.slug, list);
    if (mode === 'generate') {
      writeFileSync(mdPath, wantMd);
      writeFileSync(csvPath, wantCsv);
      continue;
    }
    const norm = (s: string): string => s.replace(/\r\n/g, '\n');
    if (!existsSync(mdPath) || norm(readFileSync(mdPath, 'utf8')) !== wantMd) {
      errors.push(`${mdPath} is out of date (run npm run cases:generate)`);
    }
    if (!existsSync(csvPath)) errors.push(`${csvPath} is missing`);
    else if (norm(readFileSync(csvPath, 'utf8')) !== norm(wantCsv))
      errors.push(`${csvPath} is out of date (run npm run cases:generate)`);
  }
  if (errors.length) fail(errors);
  console.log(
    `${mode === 'generate' ? 'Generated' : 'Traceability OK:'} ${tests.length} test cases in ${MODULES.length} modules (code <-> catalogue <-> docs <-> master CSV).`,
  );
}

main();
