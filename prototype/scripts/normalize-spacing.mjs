import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('src')

const replacements = [
  ['gap: 24px', 'gap: var(--app-page-gap)'],
  ['gap: 20px', 'gap: var(--app-page-gap)'],
  ['gap: 16px', 'gap: var(--app-page-gap)'],
  ['gap: 12px', 'gap: var(--app-section-gap)'],
  ['padding: 16px 20px', 'padding: var(--app-panel-padding)'],
  ['padding: 20px 20px 12px', 'padding: var(--app-panel-padding) var(--app-panel-padding) var(--app-section-gap)'],
  ['padding: 20px 24px 24px', 'padding: var(--app-panel-padding) var(--app-content-padding) var(--app-content-padding)'],
  ['padding: 20px 24px 0', 'padding: var(--app-panel-padding) var(--app-content-padding) 0'],
  ['padding: 16px 24px 0', 'padding: var(--app-panel-padding) var(--app-content-padding) 0'],
  ['padding: 20px', 'padding: var(--app-panel-padding)'],
  ['padding: 24px', 'padding: var(--app-panel-padding)'],
  ['padding: 16px;', 'padding: var(--app-panel-padding);'],
  ['margin-bottom: 24px', 'margin-bottom: var(--app-page-gap)'],
  ['margin-bottom: 20px', 'margin-bottom: var(--app-page-gap)'],
  ['margin-bottom: 16px', 'margin-bottom: var(--app-section-gap)'],
  ['margin-bottom: 14px', 'margin-bottom: var(--app-section-gap)'],
  ['margin-bottom: 12px', 'margin-bottom: var(--app-section-gap)'],
  ['margin: 0 0 24px', 'margin: 0 0 var(--app-page-gap)'],
  ['margin: 0 0 20px', 'margin: 0 0 var(--app-page-gap)'],
  ['gap: var(--app-page-gap) 24px', 'gap: var(--app-page-gap) var(--app-content-padding)'],
  ['gap: var(--app-page-gap) 20px', 'gap: var(--app-page-gap) var(--app-page-gap)'],
  ['gap: 8px 20px', 'gap: var(--app-section-gap) var(--app-page-gap)'],
  ['padding: 14px 20px', 'padding: var(--app-section-gap) var(--app-panel-padding)'],
  ['padding: 24px 16px', 'padding: var(--app-panel-padding) var(--app-content-padding)']
]

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
      continue
    }
    if (!/\.(vue|scss)$/.test(entry.name)) continue

    const original = fs.readFileSync(full, 'utf8')
    let next = original
    for (const [from, to] of replacements) {
      next = next.split(from).join(to)
    }
    if (next !== original) {
      fs.writeFileSync(full, next, 'utf8')
      console.log('updated', path.relative(root, full))
    }
  }
}

walk(root)
