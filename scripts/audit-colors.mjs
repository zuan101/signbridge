import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Hue range 165deg - 330deg covers Cyan, Sky, Blue, Indigo, Violet, Purple, Magenta
const MIN_FORBIDDEN_HUE = 165;
const MAX_FORBIDDEN_HUE = 330;
const MIN_MEANINGFUL_SATURATION = 0.06; // 6%

// Prohibited named colors
const FORBIDDEN_NAMED_COLORS = new Set([
  'blue', 'cyan', 'turquoise', 'navy', 'indigo', 'violet', 'purple',
  'teal', 'aqua', 'deepskyblue', 'dodgerblue', 'royalblue', 'mediumblue',
  'darkblue', 'midnightblue', 'cornflowerblue', 'slateblue', 'darkslateblue',
  'mediumslateblue', 'cadetblue', 'darkcyan', 'lightcyan', 'darkturquoise',
  'mediumturquoise', 'paleturquoise', 'aquamarine', 'powderblue', 'lightblue',
  'lightskyblue', 'skyblue', 'lightsteelblue', 'steelblue', 'lavender',
  'mediumpurple', 'darkviolet', 'darkorchid', 'blueviolet', 'darkmagenta',
  'magenta', 'fuchsia', 'orchid', 'plum', 'thistle'
]);

// Forbidden Tailwind class prefixes
const FORBIDDEN_CLASS_REGEX = /\b(bg|text|border|ring|outline|from|to|via|accent|fill|stroke)-(blue|sky|cyan|indigo|violet|purple|slate|zinc|coolGray|gray)-[0-9]{2,3}\b/i;

function hexToRgb(hex) {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  } else if (cleanHex.length === 4) {
    cleanHex = cleanHex.slice(0, 3).split('').map(c => c + c).join('');
  } else if (cleanHex.length === 8) {
    cleanHex = cleanHex.slice(0, 6);
  }
  if (cleanHex.length !== 6) return null;
  const num = parseInt(cleanHex, 16);
  if (Number.isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s, l };
}

function isForbiddenHsl(h, s, l) {
  // If brightness is pure black or pure white with no saturation, it's neutral
  if (l <= 0.02 || l >= 0.99) return false;
  if (s < MIN_MEANINGFUL_SATURATION) return false;
  return h >= MIN_FORBIDDEN_HUE && h <= MAX_FORBIDDEN_HUE;
}

const EXTENSIONS = new Set(['.css', '.tsx', '.ts', '.html', '.jsx', '.js', '.json']);
const EXCLUDED_DIRS = new Set(['node_modules', 'dist', '.git', 'public/wasm', 'public/models', '.system_generated']);

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(projectRoot, fullPath).replace(/\\/g, '/');
    if (EXCLUDED_DIRS.has(relPath) || relPath.startsWith('node_modules/') || relPath.startsWith('dist/') || relPath.startsWith('.git/')) {
      continue;
    }
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, fileList);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (EXTENSIONS.has(ext) && !relPath.includes('audit-colors')) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

console.log('🛡️  Running SignBridge Absolute No-Blue Color Audit...');
const files = walkDir(projectRoot);
let violations = [];

const HEX_REGEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const RGB_REGEX = /rgba?\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)/g;
const HSL_REGEX = /hsla?\(\s*([0-9.]+)(?:deg)?\s*,\s*([0-9.]+)%\s*,\s*([0-9.]+)%/g;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const relFile = path.relative(projectRoot, file).replace(/\\/g, '/');

    // Skip comments that describe audit or rules
    if (line.includes('audit') || line.includes('PROHIBITED') || line.includes('forbidden')) {
      // Still check actual CSS or TSX code, but skip documentation comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('<!--')) {
        return;
      }
    }

    // Check Tailwind forbidden classes
    const classMatch = line.match(FORBIDDEN_CLASS_REGEX);
    if (classMatch) {
      violations.push({
        file: relFile,
        line: lineNum,
        reason: `Forbidden Tailwind class: "${classMatch[0]}"`,
        sample: line.trim()
      });
    }

    // Check Hex colors
    let match;
    while ((match = HEX_REGEX.exec(line)) !== null) {
      const rgb = hexToRgb(match[0]);
      if (rgb) {
        const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
        if (isForbiddenHsl(h, s, l)) {
          violations.push({
            file: relFile,
            line: lineNum,
            reason: `Hex ${match[0]} falls in forbidden blue/purple hue range (H:${Math.round(h)}° S:${Math.round(s * 100)}% L:${Math.round(l * 100)}%)`,
            sample: line.trim()
          });
        }
      }
    }

    // Check rgb()
    while ((match = RGB_REGEX.exec(line)) !== null) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      const { h, s, l } = rgbToHsl(r, g, b);
      if (isForbiddenHsl(h, s, l)) {
        violations.push({
          file: relFile,
          line: lineNum,
          reason: `RGB(${r},${g},${b}) falls in forbidden blue/purple hue range (H:${Math.round(h)}° S:${Math.round(s * 100)}% L:${Math.round(l * 100)}%)`,
          sample: line.trim()
        });
      }
    }

    // Check hsl()
    while ((match = HSL_REGEX.exec(line)) !== null) {
      const h = parseFloat(match[1]);
      const s = parseFloat(match[2]) / 100;
      const l = parseFloat(match[3]) / 100;
      if (isForbiddenHsl(h, s, l)) {
        violations.push({
          file: relFile,
          line: lineNum,
          reason: `HSL(${h}, ${Math.round(s*100)}%, ${Math.round(l*100)}%) falls in forbidden blue/purple hue range`,
          sample: line.trim()
        });
      }
    }

    // Check prohibited named colors (in CSS properties or values)
    FORBIDDEN_NAMED_COLORS.forEach(namedColor => {
      const regex = new RegExp(`\\b${namedColor}\\b`, 'i');
      if (regex.test(line)) {
        // avoid false positive if line is an import or identifier like 'bluetooth'
        if (line.includes(':') && !line.includes('import') && !line.includes('export')) {
          violations.push({
            file: relFile,
            line: lineNum,
            reason: `Forbidden named color: "${namedColor}"`,
            sample: line.trim()
          });
        }
      }
    });
  });
}

if (violations.length > 0) {
  console.error(`\n❌ COLOR AUDIT FAILED: Found ${violations.length} forbidden blue/cool-hue violations:\n`);
  violations.forEach(v => {
    console.error(`  - ${v.file}:${v.line} -> ${v.reason}`);
    console.error(`    Code: "${v.sample}"\n`);
  });
  process.exit(1);
} else {
  console.log(`\n✅ COLOR AUDIT PASSED: 0 blue/cool-hue violations found across ${files.length} audited files.`);
  console.log('Palette strictly honors warm tokens: ivory, cream, sand, terracotta, burnt-orange, chocolate, brown, muted-text, border, olive, brick.\n');
  process.exit(0);
}
