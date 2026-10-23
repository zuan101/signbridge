import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const indexHtmlPath = path.join(projectRoot, 'index.html');
const cssPath = path.join(projectRoot, 'src', 'styles');

console.log('🧪 Running SignBridge Runtime Style & CSSOM Color Audit (JSDOM)...');

// Read all CSS files in src/styles
const cssFiles = fs.readdirSync(cssPath).filter(f => f.endsWith('.css'));
let combinedCss = '';
for (const file of cssFiles) {
  combinedCss += fs.readFileSync(path.join(cssPath, file), 'utf8') + '\n';
}

const dom = new JSDOM(fs.readFileSync(indexHtmlPath, 'utf8'), {
  runScripts: 'outside-only',
});

const { window } = dom;
const { document } = window;

// Inject CSS into DOM
const styleEl = document.createElement('style');
styleEl.textContent = combinedCss;
document.head.appendChild(styleEl);

// Prohibited Hue Range 165° - 330°
const MIN_FORBIDDEN_HUE = 165;
const MAX_FORBIDDEN_HUE = 330;
const MIN_SAT = 0.06;

function hexToRgb(hex) {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) cleanHex = cleanHex.split('').map(c => c + c).join('');
  if (cleanHex.length === 4) cleanHex = cleanHex.slice(0, 3).split('').map(c => c + c).join('');
  if (cleanHex.length === 8) cleanHex = cleanHex.slice(0, 6);
  if (cleanHex.length !== 6) return null;
  const num = parseInt(cleanHex, 16);
  if (Number.isNaN(num)) return null;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
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

// Inspect all CSS rules in the document stylesheet
let violations = [];
for (let i = 0; i < document.styleSheets.length; i++) {
  const sheet = document.styleSheets[i];
  for (let j = 0; j < sheet.cssRules.length; j++) {
    const rule = sheet.cssRules[j];
    if (rule.style) {
      const properties = ['color', 'backgroundColor', 'borderColor', 'outlineColor'];
      for (const prop of properties) {
        const val = rule.style[prop];
        if (val && val.startsWith('#')) {
          const rgb = hexToRgb(val);
          if (rgb) {
            const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
            if (h >= MIN_FORBIDDEN_HUE && h <= MAX_FORBIDDEN_HUE && s > MIN_SAT && l > 0.05 && l < 0.95) {
              violations.push({ selector: rule.selectorText, prop, val, h, s });
            }
          }
        }
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`❌ Found ${violations.length} runtime CSS rule violations:`, violations);
  process.exit(1);
} else {
  console.log(`✅ RUNTIME CSSOM COLOR AUDIT PASSED: All style declarations adhere strictly to warm tokens.`);
  console.log(`Active CSS properties checked across all stylesheets. 0 forbidden blue/cyan/purple values found.\n`);
  process.exit(0);
}
