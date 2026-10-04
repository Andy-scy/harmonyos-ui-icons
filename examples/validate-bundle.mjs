#!/usr/bin/env node
/**
 * validate-bundle.mjs — check this repo against the DSH bundle contract.
 *
 * Runs without installing anything and without touching any DSH profile:
 *   1. package.json carries the manifest fields a bundle needs
 *   2. cordis.patch.yml is a single additive `insert` with a plugin-owned id
 *   3. the patch's `!!js` scalars actually evaluate, with `baseUrl` bound the way
 *      @deepseek-ai/cordis-plugin-loader binds it (`with (ctx) { eval(expr) }`)
 *   4. lib/index.js imports and resolveSkillRoot() finds the bundled skill
 *   5. the bundled SKILL.md has the frontmatter the skill provider requires
 *
 * Usage: node examples/validate-bundle.mjs
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let failures = 0;
let checks = 0;
function ok(msg) { checks++; console.log(`  ok   ${msg}`); }
function bad(msg) { checks++; failures++; console.log(`  FAIL ${msg}`); }
function assert(cond, msg) { cond ? ok(msg) : bad(msg); }

console.log(`harmonyos-ui-icons bundle contract check\nrepo: ${REPO}\n`);

// ---------------------------------------------------------------- 1. manifest
console.log('[1] package.json manifest');
const pkg = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8'));
assert(pkg.name === 'harmonyos-ui-icons', `name = ${pkg.name}`);
assert(typeof pkg.version === 'string' && /^\d+\.\d+\.\d+/.test(pkg.version), `version = ${pkg.version}`);
assert(pkg.type === 'module', 'type = module');
assert(typeof pkg.main === 'string' && fs.existsSync(path.join(REPO, pkg.main)), `main exists (${pkg.main})`);
assert(pkg.exports?.['.'] === pkg.main, 'exports["."] points at main');
assert(pkg.exports?.['./package.json'] === './package.json',
  'exports["./package.json"] present (required: the patch resolves it via createRequire)');
assert(pkg.dsh?.bundle?.patch === './cordis.patch.yml', 'dsh.bundle.patch declared');
assert(fs.existsSync(path.join(REPO, pkg.dsh.bundle.patch)), 'the patch file exists');
assert(typeof pkg.engines?.node === 'string', `engines.node = ${pkg.engines?.node}`);
assert(typeof pkg.dsh?.engines?.dsh === 'string', `dsh.engines.dsh = ${pkg.dsh?.engines?.dsh}`);
assert(typeof pkg.icon === 'string' && fs.existsSync(path.join(REPO, pkg.icon)), `icon exists (${pkg.icon})`);
const iconBytes = fs.statSync(path.join(REPO, pkg.icon)).size;
assert(iconBytes <= 256 * 1024, `icon within the 256 KiB limit (${iconBytes} B)`);
const rel = pkg.dsh?.compatibility?.dshReleases ?? {};
const declared = Object.keys(rel);
assert(declared.length > 0, `dsh.compatibility.dshReleases declares ${declared.length} release(s)`);
for (const [v, s] of Object.entries(rel)) {
  assert(['compatible', 'incompatible', 'unknown'].includes(s), `${v} -> ${s} (allowed value)`);
}
for (const f of ['locale/en.json', 'locale/zh.json']) {
  const p = path.join(REPO, f);
  if (!fs.existsSync(p)) { bad(`${f} missing`); continue; }
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert(typeof j.meta?.title === 'string' && typeof j.meta?.description === 'string', `${f} has meta.title + meta.description`);
}

// ---------------------------------------------------------------- 2. patch shape
console.log('\n[2] cordis.patch.yml shape');
const patchText = fs.readFileSync(path.join(REPO, pkg.dsh.bundle.patch), 'utf8');
assert(!/\t/.test(patchText), 'no tab characters (YAML forbids them for indentation)');
assert(/^-\s*insert:/m.test(patchText), 'top level is a single `- insert:` (additive, not an override)');
assert(!/^-\s*id:/m.test(patchText), 'contains no top-level override row (an override needs an existing id)');
const ids = [...patchText.matchAll(/^\s*-\s*id:\s*(\S+)\s*$/gm)].map(m => m[1]);
const names = [...patchText.matchAll(/^\s*name:\s*['"]?([^'"\n]+)['"]?\s*$/gm)].map(m => m[1].trim());
assert(ids.length >= 1, `declares ${ids.length} entry id(s): ${ids.join(', ')}`);
assert(ids.every(id => !/^@?deepseek-ai/.test(id)), 'entry ids are plugin-owned (none impersonate an official id)');
assert(names.length >= 1, `declares name(s): ${names.join(', ')}`);
assert(names.every(n => !n.startsWith('harmonyos-ui-icons/')),
  'inserted names are package specifiers, not relative paths');

// ---------------------------------------------------------------- 3. !!js evaluation
console.log('\n[3] !!js expressions evaluate with the loader scope');
const jsExprs = [...patchText.matchAll(/!!js\s+(.+)$/gm)].map(m => m[1].trim());
assert(jsExprs.length > 0, `found ${jsExprs.length} !!js expression(s)`);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'icons-bundle-check-'));
try {
  // Simulate a DSH profile: <tmp>/node_modules/harmonyos-ui-icons -> this repo
  fs.mkdirSync(path.join(tmp, 'node_modules'), { recursive: true });
  const link = path.join(tmp, 'node_modules', 'harmonyos-ui-icons');
  fs.symlinkSync(REPO, link, 'junction');

  // Mirror the loader: new Function('ctx','expr', 'with (ctx) { return eval(expr) }')
  const evaluate = new Function('ctx', 'expr', 'with (ctx) {\n  return eval(expr)\n}');
  const ctx = { baseUrl: tmp + path.sep };

  let resolved = null;
  for (const expr of jsExprs) {
    try {
      const value = evaluate(ctx, expr);
      assert(typeof value === 'string' && value.length > 0, `expression returned a non-empty string`);
      resolved = value;
    } catch (e) {
      bad(`expression threw: ${e.message}`);
    }
  }

  // ------------------------------------------------------------ 4. skill root
  console.log('\n[4] bundled skill root');
  if (resolved) {
    assert(fs.existsSync(resolved), `resolved dir exists: ${resolved}`);
    const entries = fs.existsSync(resolved) ? fs.readdirSync(resolved) : [];
    assert(entries.includes('harmonyos-ui-icons'), `contains the skill bundle dir (found: ${entries.join(', ') || 'nothing'})`);
    const skillMd = path.join(resolved, 'harmonyos-ui-icons', 'SKILL.md');
    assert(fs.existsSync(skillMd), 'skills/harmonyos-ui-icons/SKILL.md exists');

    // ------------------------------------------------------------ 5. frontmatter
    console.log('\n[5] SKILL.md frontmatter');
    const md = fs.readFileSync(skillMd, 'utf8');
    const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    assert(Boolean(fm), 'has YAML frontmatter');
    if (fm) {
      assert(/^name:\s*\S+/m.test(fm[1]), 'frontmatter has a name');
      assert(/^description:\s*\S/m.test(fm[1]), 'frontmatter has a description');
      const nm = fm[1].match(/^name:\s*(\S+)/m)[1];
      assert(nm === 'harmonyos-ui-icons', `frontmatter name matches the directory (${nm})`);
    }
  }

  // ------------------------------------------------------------ 6. exports
  console.log('\n[6] lib/index.js exports');
  const mod = await import(pathToFileURL(path.join(REPO, 'lib', 'index.js')).href);
  assert(mod.PACKAGE_NAME === pkg.name, 'PACKAGE_NAME matches package.json name');
  assert(typeof mod.apply === 'function', 'exports an apply() (valid host plugin export form)');
  assert(typeof mod.resolveSkillRoot === 'function', 'exports resolveSkillRoot()');
  try {
    const root = mod.resolveSkillRoot(tmp + path.sep);
    assert(fs.existsSync(path.join(root, 'harmonyos-ui-icons', 'SKILL.md')), 'resolveSkillRoot() finds the bundled skill');
  } catch (e) {
    bad(`resolveSkillRoot() threw: ${e.message}`);
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'}  ${checks - failures}/${checks} checks passed`);
process.exit(failures === 0 ? 0 : 1);
