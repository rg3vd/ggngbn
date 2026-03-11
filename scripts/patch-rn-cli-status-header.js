/*
  Fix Metro / RN CLI status page crash when project path contains non-ASCII (e.g., Cyrillic).
  The RN CLI sets X-React-Native-Project-Root header to process.cwd(), which must be ASCII.
  We percent-encode it via encodeURI(...).
*/

const fs = require('fs');
const path = require('path');

const target = path.join(
  process.cwd(),
  'node_modules',
  '@react-native-community',
  'cli-server-api',
  'build',
  'statusPageMiddleware.js'
);

function patch(content) {
  const patterns = [
    "res.setHeader('X-React-Native-Project-Root', process.cwd());",
    'res.setHeader(\"X-React-Native-Project-Root\", process.cwd());',
  ];

  for (const p of patterns) {
    if (content.includes(p)) {
      return content.replace(p, p.replace('process.cwd()', 'encodeURI(process.cwd())'));
    }
  }

  // Fallback: generic replace if the file shape changes slightly.
  return content.replace(
    /(res\.setHeader\((['\"])X-React-Native-Project-Root\2,\s*)process\.cwd\(\)(\)\);)/,
    '$1encodeURI(process.cwd())$3'
  );
}

try {
  if (!fs.existsSync(target)) {
    console.log('[patch-rn-cli-status-header] target not found, skipping:', target);
    process.exit(0);
  }

  const before = fs.readFileSync(target, 'utf8');
  const after = patch(before);

  if (after === before) {
    console.log('[patch-rn-cli-status-header] already patched (or pattern not found).');
    process.exit(0);
  }

  fs.writeFileSync(target, after, 'utf8');
  console.log('[patch-rn-cli-status-header] patched:', target);
} catch (e) {
  console.warn('[patch-rn-cli-status-header] failed:', e?.message || e);
  process.exit(0); // best-effort
}
