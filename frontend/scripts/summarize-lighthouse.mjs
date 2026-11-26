import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const label = process.argv[2]
if (!label) throw new Error('Usage: node scripts/summarize-lighthouse.mjs <before|after>')

const paths = [1, 2, 3].map((run) =>
  fileURLToPath(new URL(`../lighthouse/${label}-run${run}.report.json`, import.meta.url)),
)
const reports = await Promise.all(paths.map(async (path) => JSON.parse(await readFile(path, 'utf8'))))
const median = (values) => [...values].sort((a, b) => a - b)[1]
const round = (value, digits = 0) => Number(value.toFixed(digits))
const auditValue = (report, id) => report.audits[id]?.numericValue ?? 0
const transferred = (report, resourceType) => {
  const items = report.audits['network-requests']?.details?.items ?? []
  return (
    items
      .filter((item) => !resourceType || item.resourceType === resourceType)
      .reduce((total, item) => total + (item.transferSize ?? 0), 0) / 1000
  )
}

const summary = {
  runs: reports.map((report, index) => ({
    run: index + 1,
    score: round(report.categories.performance.score * 100),
    fcp: round(auditValue(report, 'first-contentful-paint')),
    lcp: round(auditValue(report, 'largest-contentful-paint')),
    tbt: round(auditValue(report, 'total-blocking-time')),
    cls: round(auditValue(report, 'cumulative-layout-shift'), 3),
    jsTransferred: round(transferred(report, 'Script'), 1),
    imageTransferred: round(transferred(report, 'Image'), 1),
    totalTransferred: round(transferred(report), 1),
  })),
  median: {
    performance: round(median(reports.map((report) => report.categories.performance.score * 100))),
    fcp: round(median(reports.map((report) => auditValue(report, 'first-contentful-paint')))),
    lcp: round(median(reports.map((report) => auditValue(report, 'largest-contentful-paint')))),
    tbt: round(median(reports.map((report) => auditValue(report, 'total-blocking-time')))),
    cls: round(median(reports.map((report) => auditValue(report, 'cumulative-layout-shift'))), 3),
    jsTransferred: round(median(reports.map((report) => transferred(report, 'Script'))), 1),
    imageTransferred: round(median(reports.map((report) => transferred(report, 'Image'))), 1),
    totalTransferred: round(median(reports.map((report) => transferred(report))), 1),
  },
}

const output = fileURLToPath(new URL(`../lighthouse/${label}-summary.json`, import.meta.url))
await writeFile(output, JSON.stringify(summary, null, 2))
console.log(JSON.stringify(summary, null, 2))
