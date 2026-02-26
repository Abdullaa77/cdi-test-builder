#!/usr/bin/env node
/**
 * Build script: reads public/vendor/jspdf.umd.min.js and writes
 * src/lib/htmlTemplates/jspdfBundle.js as a plain JS string export.
 * Run: node scripts/bundle-jspdf.js
 */
const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '..', 'public', 'vendor', 'jspdf.umd.min.js')
const dest = path.join(__dirname, '..', 'src', 'lib', 'htmlTemplates', 'jspdfBundle.js')

const jspdfSource = fs.readFileSync(src, 'utf-8')

// Escape backticks and ${} inside the source so template literal is safe
const escaped = jspdfSource
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${')

const output = `// AUTO-GENERATED — do not edit manually.\n// Run: node scripts/bundle-jspdf.js\nexport const JSPDF_INLINE_SCRIPT = \`<script>${escaped}</script>\`\n`

fs.writeFileSync(dest, output, 'utf-8')
console.log(`Wrote ${dest} (${(output.length / 1024).toFixed(1)} KB)`)
