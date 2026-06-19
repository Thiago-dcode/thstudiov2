import fs from 'fs';
import path from 'path';

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (/\.(tsx|ts|jsx|js)$/.test(e.name)) files.push(p);
  }
  return files;
}

function stripRounded(content, keepFull = false) {
  if (keepFull) {
    return content.replace(/\s*(?:(?:sm|tablet|lg|md|xl|2xl):)?rounded-(?!full\b)[^\s"'`]+/g, '');
  }
  return content.replace(/\s*(?:(?:sm|tablet|lg|md|xl|2xl):)?rounded-[^\s"'`]+/g, '');
}

function cleanSpaces(content) {
  return content.replace(/  +/g, ' ');
}

const targets = process.argv.slice(2);

for (const target of targets) {
  const abs = path.resolve(target);
  const stat = fs.statSync(abs);
  const files = stat.isDirectory() ? walk(abs) : [abs];

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const base = path.basename(file);

    if (base === 'sonner.tsx') {
      content = content.replace('"--border-radius": "0.5rem"', '"--border-radius": "0"');
    } else if (base === 'slider.tsx') {
      // keep rounded-full only
      continue;
    } else if (base === 'scroll-area.tsx') {
      content = stripRounded(content, true);
    } else {
      content = stripRounded(content, false);
    }

    content = cleanSpaces(content);
    fs.writeFileSync(file, content);
  }

  console.log(`Processed ${files.length} files in ${target}`);
}
