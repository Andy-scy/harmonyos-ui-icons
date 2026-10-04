#!/usr/bin/env node
/**
 * bootstrap.mjs — 首次使用本技能前必须跑一次的初始化脚本。
 *
 * 为什么需要它：
 *   本仓库**不包含**任何 SVG 文件。Iconsax 的免费授权允许你把图标用在 App 里，
 *   但不允许把图标本体（含改过的版本）再分发出去 —— 所以公开仓库里不能带图标。
 *   图标由本脚本从 Iconsax 官方 CDN 现场拉取并解密。
 *
 * 它做三件事：
 *   1. 从 https://cdn.iconsax.io 拉取精选图标（默认 181 个 × 6 样式）并解密
 *   2. 基于这些静态 SVG 生成内嵌 SMIL 的动效变体
 *   3. 打印结果摘要 + 下一步怎么做
 *
 * 用法：
 *   node scripts/bootstrap.mjs                # 默认：精选集 + 3 种动效
 *   node scripts/bootstrap.mjs --all          # 拉取全部 7,140 个免费图标（约 11 MB）
 *   node scripts/bootstrap.mjs --force        # 已有资产也重新拉
 *   node scripts/bootstrap.mjs --no-anim      # 只拉静态图标，不生成动效
 *   node scripts/bootstrap.mjs --effects float,pulse,spin,wiggle,beat
 *   node scripts/bootstrap.mjs --names home,user,setting   # 只要这几个
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const STATIC_DIR = path.join(ROOT, 'assets', 'iconsax');
const ANIM_DIR = path.join(ROOT, 'assets', 'iconsax-anim');
const FETCH = path.join(HERE, 'fetch-icons.mjs');
const ANIMATE = path.join(HERE, 'make-animated-svg.mjs');

function parseArgs(argv) {
  const o = { all: false, force: false, noAnim: false, effects: 'float,pulse,wiggle', names: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all') o.all = true;
    else if (a === '--force') o.force = true;
    else if (a === '--no-anim') o.noAnim = true;
    else if (a === '--effects') o.effects = argv[++i];
    else if (a === '--names') o.names = argv[++i];
    else if (a === '-h' || a === '--help') o.help = true;
    else { console.error(`未知参数: ${a}`); process.exit(2); }
  }
  return o;
}

/**
 * 递归统计目录下的 .svg 数量。
 * 静态目录是 <dir>/<style>/<name>.svg（一层），
 * 动效目录是 <dir>/<fx>/<style>/<name>.svg（两层），所以必须递归。
 */
function countSvg(dir) {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) n += countSvg(p);
    else if (entry.name.endsWith('.svg')) n++;
  }
  return n;
}

function run(label, args) {
  console.log(`\n==> ${label}`);
  const r = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`\n✗ ${label} 失败（exit ${r.status}）`);
    process.exit(r.status ?? 1);
  }
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.help) {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8')
      .split('\n').filter(l => l.startsWith(' *') || l.startsWith('/**')).join('\n'));
    return;
  }

  const haveStatic = countSvg(STATIC_DIR);
  const haveAnim = countSvg(ANIM_DIR);

  console.log('harmonyos-ui-icons · 初始化');
  console.log('------------------------------------------------------------');
  console.log(`技能目录   ${ROOT}`);
  console.log(`静态图标   ${haveStatic} 个  ${haveStatic ? '(已就绪)' : '(缺失)'}`);
  console.log(`动效图标   ${haveAnim} 个  ${haveAnim ? '(已就绪)' : '(缺失)'}`);
  console.log('------------------------------------------------------------');

  if (haveStatic > 0 && !o.force) {
    console.log('\n静态图标已存在，跳过拉取。要重新拉取请加 --force。');
  } else {
    const args = [FETCH, '--out', STATIC_DIR, '--concurrency', '12'];
    if (o.names) args.push('--names', o.names);
    else if (o.all) args.push('--all');
    else args.push('--curated');
    // 顺手把 ArkTS 目录重新生成一遍，保证 IconMeta 列表和实际文件对得上
    args.push('--emit-ets', path.join(ROOT, 'templates', 'IconsaxCatalog.ets'));
    run('从 Iconsax 官方 CDN 拉取并解密图标', args);
  }

  if (o.noAnim) {
    console.log('\n--no-anim：跳过动效生成。');
  } else if (countSvg(ANIM_DIR) > 0 && !o.force) {
    console.log('\n动效图标已存在，跳过生成。要重新生成请加 --force。');
  } else {
    run('生成内嵌 SMIL 的动效变体', [
      ANIMATE, '--in', STATIC_DIR, '--out', ANIM_DIR, '--effects', o.effects,
    ]);
  }

  const s = countSvg(STATIC_DIR);
  const a = countSvg(ANIM_DIR);
  console.log('\n------------------------------------------------------------');
  console.log(`✓ 初始化完成：静态 ${s} 个，动效 ${a} 个`);
  console.log('------------------------------------------------------------');
  console.log('\n下一步：');
  console.log('  1) 看 SKILL.md 的「标准工作流」，把需要的 SVG 拷进鸿蒙工程的');
  console.log('     entry/src/main/resources/rawfile/iconsax/');
  console.log('  2) 拷 templates/ 下的三个 .ets 到工程的 common/ components/ model/');
  console.log('  3) 想要更多图标：node scripts/fetch-icons.mjs --search <关键词>');
}

main();
