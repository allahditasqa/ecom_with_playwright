/* eslint-disable no-console */
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { CATALOG, type CaseSpec } from './testCaseCatalog';
import { moduleBySlug } from './modules';

/**
 * Custom reporter: one HTML report per MODULE per RUN, with the executed test cases, status,
 * duration and a screenshot for every test. A run never overwrites an older report - the file
 * name carries the date and time (`auth test 18-11-2026_15-20.html`) and, if two runs start in
 * the same minute, a seconds / counter suffix. `reports/index.html` lists the whole history.
 *
 * Output:  reports/<module>/<module> test <DD-MM-YYYY_HH-MM>.html (+ matching .csv)
 *          reports/history.json  (append-only)   reports/index.html (rebuilt from history)
 */

const ROOT = 'reports';
const SKIP_PROJECTS = new Set(['setup', 'cleanup']);

interface Row {
  id: string;
  title: string;
  describe: string;
  file: string;
  status: 'passed' | 'failed' | 'skipped';
  note: string;
  durationMs: number;
  error: string;
  screenshot: string; // data URI or ''
  tags: string[];
  spec: CaseSpec | undefined;
  executedAt: string;
}

interface HistoryEntry {
  module: string;
  file: string;
  csv: string;
  ts: string;
  date: string;
  time: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationSec: number;
}

const pad = (n: number) => String(n).padStart(2, '0');
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// eslint-disable-next-line no-control-regex
const stripAnsi = (s: string) => s.replace(/\u001b\[[0-9;]*m/g, '');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function moduleOf(test: TestCase): string {
  const base = basename(test.location.file).replace(/\.spec\.ts$/, '');
  return base === 'contactAndNavigation' ? 'contact' : base === 'api' ? 'api' : base;
}

class ModuleReporter implements Reporter {
  private start = new Date();
  private rows = new Map<string, Row[]>();

  onBegin(): void {
    this.start = new Date();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const project = test.parent.project()?.name ?? '';
    if (SKIP_PROJECTS.has(project)) return;
    const outcome = test.outcome();
    const lastResult = test.results[test.results.length - 1] ?? result;
    if (result !== lastResult) return; // only the final attempt is reported

    const status: Row['status'] =
      outcome === 'skipped' ? 'skipped' : outcome === 'unexpected' ? 'failed' : 'passed';
    const notes: string[] = [];
    if (outcome === 'flaky') notes.push(`flaky - passed on retry ${result.retry}`);
    if (test.expectedStatus === 'failed' && status === 'passed')
      notes.push('known defect (test.fail) - bug still present, as expected');

    const shot = result.attachments.find((a) => a.name === 'screenshot' && a.contentType === 'image/png');
    let screenshot = '';
    try {
      const buf = shot?.body ?? (shot?.path ? readFileSync(shot.path) : undefined);
      if (buf) screenshot = `data:image/png;base64,${buf.toString('base64')}`;
    } catch {
      /* screenshot is optional */
    }

    const titlePath = test.titlePath().slice(3); // drop root, project, file
    const describe = titlePath.slice(0, -1).join(' › ');
    const id = test.title.split(' - ')[0] ?? test.title;
    const mod = moduleOf(test);
    const row: Row = {
      id,
      title: test.title,
      describe,
      file: basename(test.location.file),
      status,
      note: notes.join('; '),
      durationMs: result.duration,
      error:
        status === 'failed' ? stripAnsi(result.error?.message ?? 'Unexpected result').slice(0, 1500) : '',
      screenshot,
      tags: test.tags,
      spec: CATALOG[id],
      executedAt: result.startTime.toISOString().replace('T', ' ').slice(0, 19),
    };
    const list = this.rows.get(mod) ?? [];
    list.push(row);
    this.rows.set(mod, list);
  }

  onEnd(result: FullResult): void {
    if (this.rows.size === 0) return;
    mkdirSync(ROOT, { recursive: true });
    const historyFile = join(ROOT, 'history.json');
    const history: HistoryEntry[] = existsSync(historyFile)
      ? JSON.parse(readFileSync(historyFile, 'utf8'))
      : [];
    const d = this.start;
    const date = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    const stamp = `${date}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

    for (const [mod, rows] of [...this.rows.entries()].sort()) {
      rows.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
      const dir = join(ROOT, mod);
      mkdirSync(dir, { recursive: true });
      const display = moduleBySlug(mod)?.name ?? cap(mod);
      // <Module Name> test <DD-MM-YYYY>_<HH-mm-ss>.html ; never overwrite (counter if the second is taken)
      let name = `${display} test ${stamp}`;
      let csvName = `${display} test cases ${stamp}`;
      for (let i = 2; existsSync(join(dir, `${name}.html`)); i++) {
        name = `${display} test ${stamp}-${i}`;
        csvName = `${display} test cases ${stamp}-${i}`;
      }

      const durationSec = Math.round(rows.reduce((s, r) => s + r.durationMs, 0) / 1000);
      const count = (s: Row['status']) => rows.filter((r) => r.status === s).length;
      const entry: HistoryEntry = {
        module: mod,
        file: `${mod}/${name}.html`,
        csv: `${mod}/${csvName}.csv`,
        ts: d.toISOString(),
        date,
        time,
        total: rows.length,
        passed: count('passed'),
        failed: count('failed'),
        skipped: count('skipped'),
        durationSec,
      };
      writeFileSync(join(dir, `${name}.html`), moduleHtml(entry, rows, result.status));
      writeFileSync(join(dir, `${csvName}.csv`), csv(rows, display));
      history.push(entry);
    }
    writeFileSync(historyFile, JSON.stringify(history, null, 2));
    writeFileSync(join(ROOT, 'index.html'), indexHtml(history));
    console.log(`\nModule reports written to ${ROOT}/ (open ${ROOT}/index.html)`);
  }
}

const CSS = `:root{--bg:#f6f7f9;--fg:#1c1f24;--card:#fff;--line:#dde1e6;--pass:#1a7f37;--fail:#cf222e;--skip:#8a6d00;--mute:#6b7380}
@media(prefers-color-scheme:dark){:root{--bg:#14161a;--fg:#e6e8eb;--card:#1d2026;--line:#2e333b;--pass:#3fb950;--fail:#ff7b72;--skip:#d4a72c;--mute:#9aa3b0}}
body{margin:0;padding:24px 16px;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,Segoe UI,sans-serif}
main{max-width:1100px;margin:auto}h1{margin:0 0 4px}h2{margin:28px 0 8px}.meta{color:var(--mute);font-size:13px}a{color:inherit}
.sum{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}.sum div{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:10px 16px}
.sum b{font-size:22px;display:block}.card{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--line);border-radius:8px;padding:12px 16px;margin:12px 0}
.card.pass{border-left-color:var(--pass)}.card.fail{border-left-color:var(--fail)}.card.skip{border-left-color:var(--skip)}
.head{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}.badge{font-size:12px;text-transform:uppercase;padding:2px 8px;border-radius:99px;border:1px solid currentColor}
.badge.pass{color:var(--pass)}.badge.fail{color:var(--fail)}.badge.skip{color:var(--skip)}
pre{background:var(--bg);padding:10px;border-radius:6px;overflow:auto;white-space:pre-wrap;color:var(--fail)}
.shots{display:flex;gap:12px;flex-wrap:wrap;margin-top:10px}figure{margin:0}img{max-width:300px;border:1px solid var(--line);border-radius:6px;cursor:zoom-in}
img.big{max-width:100%;cursor:zoom-out}figcaption{font-size:12px;color:var(--mute)}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line)}th,td{text-align:left;padding:8px 12px;border-bottom:1px solid var(--line)}
.pass-t{color:var(--pass)}.fail-t{color:var(--fail)}.skip-t{color:var(--skip)}.note{color:var(--skip);font-size:13px}`;

function moduleHtml(e: HistoryEntry, rows: Row[], overall: string): string {
  const cards = rows
    .map((r) => {
      const cls = r.status === 'passed' ? 'pass' : r.status === 'failed' ? 'fail' : 'skip';
      return `<section class="card ${cls}">
  <div class="head"><span class="badge ${cls}">${r.status}</span><b>${esc(r.title)}</b>
  <span class="meta">${esc(r.file)} › ${esc(r.describe)} · ${(r.durationMs / 1000).toFixed(1)}s${r.tags.length ? ' · ' + esc(r.tags.join(' ')) : ''}</span></div>
  ${r.note ? `<div class="note">${esc(r.note)}</div>` : ''}
  ${r.spec ? specHtml(r.spec) : ''}
  ${r.error ? `<pre>${esc(r.error)}</pre>` : ''}
  ${r.screenshot ? `<div class="shots"><figure><img src="${r.screenshot}" alt="screenshot" onclick="this.classList.toggle('big')"><figcaption>screenshot</figcaption></figure></div>` : '<p class="meta">No screenshot (test was skipped)</p>'}
</section>`;
    })
    .join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${moduleBySlug(e.module)?.name ?? cap(e.module)} Test Report ${e.date} ${e.time}</title><style>${CSS}</style></head><body><main>
<p class="meta"><a href="../index.html">&larr; All reports</a></p>
<h1>${moduleBySlug(e.module)?.name ?? cap(e.module)}</h1>
<div class="meta">Run: ${e.date} ${e.time} · test time ${e.durationSec}s · overall: ${e.failed ? 'failed' : overall === 'interrupted' ? 'interrupted' : 'passed'} · click a screenshot to enlarge</div>
<div class="sum"><div><b>${e.total}</b>total</div><div><b class="pass-t">${e.passed}</b>passed</div><div><b class="fail-t">${e.failed}</b>failed</div><div><b class="skip-t">${e.skipped}</b>skipped</div></div>
${cards}
</main></body></html>
`;
}

function specHtml(c: CaseSpec): string {
  return `<details><summary class="meta">Test case: ${esc(c.feature)} · ${esc(c.priority)} · ${esc(c.type)}</summary>
  <p class="meta"><b>Precondition:</b> ${esc(c.pre)}</p>
  <ol class="meta">${c.steps.map((st) => `<li>${esc(st)}</li>`).join('')}</ol>
  <p class="meta"><b>Test data:</b> ${esc(c.data)}</p>
  <p class="meta"><b>Expected result:</b> ${esc(c.expected)}</p></details>`;
}

const NL = '\n';

function csv(rows: Row[], module: string): string {
  const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = [
    'Test Case ID',
    'Module',
    'Feature',
    'Test Case Title',
    'Priority',
    'Test Type',
    'Preconditions',
    'Test Steps',
    'Test Data',
    'Expected Result',
    'Automation Status',
    'Automation Script',
    'Execution Status',
    'Actual Result',
    'Duration (s)',
    'Executed On',
    'Environment',
    'Remarks',
  ];
  const lines = rows.map((r) => {
    const c = r.spec;
    const actual =
      r.status === 'failed'
        ? r.error
        : r.status === 'skipped'
          ? 'Not executed'
          : 'As expected' + (r.note.includes('known defect') ? ' (known defect reproduced)' : '');
    return [
      r.id,
      cap(module),
      c?.feature ?? '',
      r.title.replace(/^[^ ]+ - /, ''),
      c?.priority ?? '',
      c?.type ?? '',
      c?.pre ?? '',
      (c?.steps ?? []).map((st, n) => `${n + 1}. ${st}`).join(NL),
      c?.data ?? '',
      c?.expected ?? '',
      'Automated',
      `${r.file} > ${r.describe}`,
      r.status === 'passed' ? 'Pass' : r.status === 'failed' ? 'Fail' : 'Skipped',
      actual,
      (r.durationMs / 1000).toFixed(1),
      r.executedAt,
      'automationexercise.com / Chromium',
      r.note,
    ]
      .map(q)
      .join(',');
  });
  // UTF-8 BOM so that Excel opens the file with the right encoding
  return '\uFEFF' + [header.map(q).join(','), ...lines].join('\r\n') + '\r\n';
}

function indexHtml(history: HistoryEntry[]): string {
  const runs = new Map<string, HistoryEntry[]>();
  for (const h of history) {
    const key = `${h.date}  •  ${h.time}`;
    runs.set(key, [...(runs.get(key) ?? []), h]);
  }
  const ordered = [...runs.entries()].sort((a, b) => ((a[1][0]?.ts ?? '') < (b[1][0]?.ts ?? '') ? 1 : -1));
  const body = ordered
    .map(([key, items]) => {
      const sum = (f: (h: HistoryEntry) => number) => items.reduce((s, h) => s + f(h), 0);
      const rowsHtml = items
        .map((h) => {
          const result = h.failed ? '<td class="fail-t">Failed</td>' : '<td class="pass-t">Passed</td>';
          return `<tr><td>${moduleBySlug(h.module)?.name ?? cap(h.module)}</td><td><a href="${encodeURI(h.file)}">${h.date} ${h.time}</a></td><td>${h.total}</td><td class="pass-t">${h.passed}</td><td class="${h.failed ? 'fail-t' : ''}">${h.failed}</td><td class="skip-t">${h.skipped}</td><td>${h.durationSec}s</td>${result}<td><a href="${encodeURI(h.csv)}">CSV</a></td></tr>`;
        })
        .join('\n');
      return `<h2>${key} <span class="meta">&nbsp;total ${sum((h) => h.total)} · <span class="pass-t">${sum((h) => h.passed)} pass</span> · <span class="${sum((h) => h.failed) ? 'fail-t' : ''}">${sum((h) => h.failed)} fail</span> · <span class="skip-t">${sum((h) => h.skipped)} skip</span></span></h2>
<table><thead><tr><th>Module</th><th>Report</th><th>Total</th><th>Pass</th><th>Fail</th><th>Skip</th><th>Time</th><th>Result</th><th>Test cases</th></tr></thead><tbody>${rowsHtml}</tbody></table>`;
    })
    .join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ecom_with_playwright - Test Reports</title><style>${CSS}</style></head><body><main>
<h1>ecom_with_playwright - Test Reports</h1><div class="meta">History: newest run first. Under every date-time the module-wise reports. Old reports are never overwritten or deleted.</div>
${body}
</main></body></html>
`;
}

export default ModuleReporter;
