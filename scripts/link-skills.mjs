/**
 * Points `.claude/skills` at `.agents/skills`.
 *
 * `.agents/skills` is the tracked home of the project's skills. Claude Code only discovers
 * them under `.claude/skills`, so the two have to be the same directory - copying would let
 * them drift, and the copy is what would get edited.
 *
 * The link itself is gitignored and has to be recreated per clone, because neither kind of
 * link survives this repo's checkouts: `core.symlinks` is false, so git would write a symlink
 * out as a text file containing its target path.
 *
 * Uses the `junction` type, which is why this is a script rather than an `ln -s`: on Windows a
 * junction needs no admin rights or Developer Mode, unlike a directory symlink. Node ignores
 * the argument on macOS and Linux and creates an ordinary symlink.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(repoRoot, '.agents', 'skills');
const link = path.join(repoRoot, '.claude', 'skills');

if (!fs.existsSync(target)) {
  console.error(`✗ Nothing to link: ${path.relative(repoRoot, target)} does not exist.`);
  process.exit(1);
}

const existing = fs.lstatSync(link, { throwIfNoEntry: false });

if (existing?.isSymbolicLink()) {
  if (path.resolve(path.dirname(link), fs.readlinkSync(link)) === target) {
    console.log('✓ .claude/skills already points at .agents/skills');
    process.exit(0);
  }
  fs.unlinkSync(link);
} else if (existing?.isDirectory()) {
  // A real directory here means someone copied the skills instead of linking them. Deleting it
  // could throw away edits that were never mirrored back, so stop and let a human look.
  console.error(
    '✗ .claude/skills is a real directory, not a link.\n' +
      '  It may hold edits that never reached .agents/skills. Compare the two, keep whatever\n' +
      '  is newer in .agents/skills, remove .claude/skills, then run this again.',
  );
  process.exit(1);
} else if (existing) {
  fs.unlinkSync(link);
}

fs.mkdirSync(path.dirname(link), { recursive: true });
fs.symlinkSync(target, link, 'junction');
console.log('✓ Linked .claude/skills -> .agents/skills');
