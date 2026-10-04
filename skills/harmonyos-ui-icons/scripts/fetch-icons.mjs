#!/usr/bin/env node
/**
 * fetch-icons.mjs — 从 Iconsax CDN 按需拉取免费 SVG 图标并解密。
 *
 * 背景：cdn.iconsax.io 上的 SVG 是 CryptoJS AES 密文（口令 "123qwe"，
 * OpenSSL Salted__ 信封：AES-256-CBC + EVP_BytesToKey(MD5, salt)）。
 * 本脚本用 node:crypto 复刻同样的派生，解密后写成明文 SVG。
 *
 * 只覆盖 Iconsax **免费授权**范围内的图标（tier=free，即 rounded 圆角风格
 * 的 6 种样式）。免费授权允许嵌入你的 App、允许修改、不需要署名，
 * 但禁止把图标本体（或改过的版本）当作素材再分发/转售。
 *
 * 用法：
 *   node fetch-icons.mjs --out <目录> --curated
 *   node fetch-icons.mjs --out <目录> --names home,user,setting --styles bold,linear,twotone
 *   node fetch-icons.mjs --out <目录> --all [--styles bold,linear]
 *   node fetch-icons.mjs --out <目录> --curated --emit-ets <工程>/entry/src/main/ets/model/IconsaxCatalog.ets
 *   node fetch-icons.mjs --search heart            # 只查索引，不下载
 *   node fetch-icons.mjs --list-categories
 *
 * 参数：
 *   --out <dir>        输出目录（默认 ./iconsax）
 *   --curated          拉取内置的常用 UI 图标清单（catalog/curated-names.json）
 *   --names a,b,c      指定图标名
 *   --styles a,b,c     指定样式，默认全部 6 种：bold,bulk,broken,linear,outline,twotone
 *   --all              拉取全部 7140 个免费图标（约 11 MB / 7140 个文件，需要几分钟）
 *   --search <kw>      在索引里搜名字/类目，只打印
 *   --list-categories  列出所有类目
 *   --emit-ets <path>  额外生成一份 ArkTS 图标目录文件
 *   --concurrency <n>  并发数，默认 8
 *   --key <passphrase> 解密口令，默认 "123qwe"（Iconsax 前端硬编码值）
 *   --dry-run          只列出将要下载的 URL
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(HERE, '..');
const INDEX_PATH = path.join(SKILL_ROOT, 'catalog', 'iconsax-free-index.json');
const CURATED_PATH = path.join(SKILL_ROOT, 'catalog', 'curated-names.json');

const CDN = 'https://cdn.iconsax.io';
const ALL_STYLES = ['bold', 'broken', 'bulk', 'linear', 'outline', 'twotone'];
/** 用 fill 画的样式；其余用 stroke 画。这决定了 HarmonyOS 侧用 fillColor 还是 colorFilter。 */
export const FILL_STYLES = ['bold', 'bulk', 'outline'];

// ---------------------------------------------------------------- 参数解析
function parseArgs(argv) {
  const o = {
    out: './iconsax', names: null, styles: null, curated: false, all: false,
    search: null, listCategories: false, emitEts: null, concurrency: 8,
    key: '123qwe', dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--out': o.out = next(); break;
      case '--names': o.names = next().split(',').map(s => s.trim()).filter(Boolean); break;
      case '--styles': o.styles = next().split(',').map(s => s.trim()).filter(Boolean); break;
      case '--curated': o.curated = true; break;
      case '--all': o.all = true; break;
      case '--search': o.search = next(); break;
      case '--list-categories': o.listCategories = true; break;
      case '--emit-ets': o.emitEts = next(); break;
      case '--concurrency': o.concurrency = Number(next()); break;
      case '--key': o.key = next(); break;
      case '--dry-run': o.dryRun = true; break;
      case '-h': case '--help': o.help = true; break;
      default: console.error(`未知参数: ${a}`); process.exit(2);
    }
  }
  return o;
}

// ---------------------------------------------------------------- 解密
function evpBytesToKey(passphrase, salt, keyLen, ivLen) {
  const pw = Buffer.from(passphrase, 'utf8');
  let derived = Buffer.alloc(0);
  let block = Buffer.alloc(0);
  while (derived.length < keyLen + ivLen) {
    block = crypto.createHash('md5').update(Buffer.concat([block, pw, salt])).digest();
    derived = Buffer.concat([derived, block]);
  }
  return { key: derived.subarray(0, keyLen), iv: derived.subarray(keyLen, keyLen + ivLen) };
}

export function decryptCryptoJS(b64, passphrase) {
  const raw = Buffer.from(b64.trim(), 'base64');
  if (raw.subarray(0, 8).toString('latin1') !== 'Salted__') {
    throw new Error('不是 CryptoJS/OpenSSL 信封（缺少 Salted__ 前缀）');
  }
  const salt = raw.subarray(8, 16);
  const ct = raw.subarray(16);
  const { key, iv } = evpBytesToKey(passphrase, salt, 32, 16);
  const d = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([d.update(ct), d.final()]).toString('utf8');
}

// ---------------------------------------------------------------- 主流程
function loadIndex() {
  return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
}

function loadCurated() {
  return JSON.parse(fs.readFileSync(CURATED_PATH, 'utf8')).names;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchOne(record, outDir, key) {
  const [name, style, , url] = record;
  const dir = path.join(outDir, style);
  const file = path.join(dir, `${name}.svg`);
  if (fs.existsSync(file)) return { file, skipped: true };
  fs.mkdirSync(dir, { recursive: true });

  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(CDN + url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const svg = decryptCryptoJS(await res.text(), key);
      if (!svg.includes('<svg')) throw new Error('解密结果里没有 <svg>');
      fs.writeFileSync(file, svg, 'utf8');
      return { file, skipped: false };
    } catch (e) {
      lastErr = e;
      await sleep(400 * (attempt + 1));
    }
  }
  return { file, error: lastErr.message };
}

async function pool(items, limit, worker) {
  let cursor = 0;
  const results = [];
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await worker(items[i]);
    }
  });
  await Promise.all(runners);
  return results;
}

/** 常用图标的中文名，生成 ArkTS 目录时用得上（没有的会退回英文名） */
const LABELS = {
  'search-normal': '搜索', 'search-status': '搜索状态', 'search-zoom-in': '放大', 'search-favorite': '收藏搜索',
  home: '首页', user: '用户', profile: '我的', setting: '设置', settings: '设置',
  heart: '喜欢', 'heart-add': '关注', 'heart-tick': '已喜欢', star: '星标', 'star-slash': '取消星标',
  bookmark: '书签', notification: '通知', 'notification-bing': '新通知', 'notification-circle': '通知点',
  calendar: '日历', 'calendar-tick': '日程完成', 'calendar-add': '新建日程', clock: '时间', clock2: '时钟',
  timer: '计时器', trash: '删除', edit: '编辑', add: '新增', 'add-circle': '新增', 'add-square': '新增',
  minus: '减少', 'minus-circle': '移除', 'close-circle': '关闭', 'close-square': '关闭', more: '更多',
  menu: '菜单', filter: '筛选', 'filter-search': '筛选', sort: '排序',
  'arrow-left': '左', 'arrow-right': '右', 'arrow-up': '上', 'arrow-down': '下',
  'arrow-circle-left': '返回', 'arrow-circle-right': '前进', 'arrow-circle-up': '向上', 'arrow-circle-down': '向下',
  'arrow-square-left': '返回', 'arrow-square-right': '进入',
  share: '分享', 'export-arrow': '导出', 'import-arrow': '导入', send: '发送', 'send-square': '发送',
  camera: '相机', gallery: '相册', image: '图片', video: '视频', play: '播放', pause: '暂停', stop: '停止',
  musicnote: '音乐', microphone: '麦克风', speaker: '扬声器', 'volume-high': '音量',
  folder: '文件夹', 'folder-open': '打开文件夹', 'folder-add': '新建文件夹',
  document: '文档', 'document-text': '文本', 'document-copy': '复制', 'document-download': '下载', 'document-upload': '上传',
  chart: '图表', 'chart-square': '报表', 'chart-success': '增长', graph: '曲线图', 'favorite-chart': '收藏图表',
  wallet: '钱包', 'wallet-money': '余额', 'wallet-add': '充值', card: '银行卡', receipt: '票据',
  'receipt-text': '账单', money: '金额', 'money-send': '转账', 'money-recive': '收款', coin: '金币',
  'dollar-circle': '美元', lock: '锁定', unlock: '解锁', eye: '显示', 'eye-slash': '隐藏',
  'shield-tick': '安全', 'shield-cross': '风险', verify: '验证', key: '密钥',
  'info-circle': '信息', warning: '警告', 'lamp-on': '提示', flash: '闪电', 'battery-charging': '充电',
  'refresh-arrow': '刷新', 'refresh-circle': '刷新',
  'message-bubble': '消息', 'message-square': '消息', 'message-text': '聊天', 'message-add': '新建会话',
  sms: '短信', call: '通话', 'call-incoming': '来电', 'call-outgoing': '去电',
  cloud: '云端', 'cloud-add': '上传云', 'cloud-sunny': '晴', sun: '太阳', moon: '夜间',
  cpu: '处理器', 'cpu-setting': '设置', data: '数据', command: '命令', code: '代码',
  location: '定位', gps: '导航', map: '地图', global: '全球', discover: '发现',
  people: '通讯录', 'profile-2user': '好友', 'profile-add': '添加好友', 'user-add': '添加用户', 'user-remove': '移除用户',
  teacher: '讲师', award: '奖章', medal: '勋章', book: '书', 'book-open': '翻开的书', note: '笔记',
  'note-text': '文本笔记', 'clipboard-text': '剪贴板', 'task-square': '任务',
  bag: '购物袋', 'shopping-cart': '购物车', shop: '商店', barcode: '条码', truck: '货车', car: '汽车',
  bus: '公交', airplane: '飞机', ship: '轮船', building: '楼宇', house: '住房', hospital: '医院', bank: '银行',
  tree: '树', gift: '礼物', cup: '杯子', cake: '蛋糕',
  android: '安卓', apple: '苹果', windows: 'Windows', google: '谷歌', 'grid-equal': '宫格', category: '分类',
  login: '登录', logout: '退出', happy: '开心', 'emoji-happy': '开心', 'emoji-sad': '难过',
  like: '赞', dislike: '踩', diamonds: '钻石', hierarchy: '层级', 'hierarchy-square': '组织架构',
  save: '保存', printer: '打印', scanner: '扫描', scan: '扫码', 'finger-scan': '指纹', star2: '星标',
  'security-user': '账号安全', 'search-status': '状态',
};

function emitEts(icons, styles, outPath) {
  const lines = [];
  lines.push(`/**`);
  lines.push(` * Iconsax 图标目录（由 skills/harmonyos-ui-icons/scripts/fetch-icons.mjs 自动生成）`);
  lines.push(` * 图标文件位于 resources/rawfile/iconsax/<style>/<name>.svg`);
  lines.push(` */`);
  lines.push(``);
  lines.push(`export interface IconMeta {`);
  lines.push(`  name: string;`);
  lines.push(`  label: string;`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`export class IconsaxCatalog {`);
  lines.push(`  static readonly STYLES: string[] = [${styles.map(s => `'${s}'`).join(', ')}];`);
  lines.push(`  /** 用 fill 画的样式；其余用 stroke 画，上色方式不同 */`);
  lines.push(`  private static readonly FILL_STYLES: string[] = [${FILL_STYLES.map(s => `'${s}'`).join(', ')}];`);
  lines.push(``);
  lines.push(`  static isStrokeStyle(style: string): boolean {`);
  lines.push(`    return !IconsaxCatalog.FILL_STYLES.includes(style);`);
  lines.push(`  }`);
  lines.push(``);
  lines.push(`  static rawfilePath(name: string, style: string): string {`);
  lines.push(`    return \`iconsax/\${style}/\${name}.svg\`;`);
  lines.push(`  }`);
  lines.push(``);
  lines.push(`  static readonly ICONS: IconMeta[] = [`);
  for (const n of icons) {
    const label = LABELS[n] || n;
    lines.push(`    { name: '${n}', label: '${label}' },`);
  }
  lines.push(`  ];`);
  lines.push(`}`);
  lines.push(``);
  fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`已生成 ArkTS 目录: ${path.resolve(outPath)}（${icons.length} 个图标）`);
}

async function main() {
  const opt = parseArgs(process.argv.slice(2));
  if (opt.help) {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8')
      .split('\n').filter(l => l.startsWith(' *') || l.startsWith('/**')).join('\n'));
    return;
  }

  const index = loadIndex();
  const records = index.records;
  const byName = new Map();
  /** `${name}/${style}` -> 第一条记录。同名同样式在 CDN 上可能有多个变体，取第一条保证结果稳定。 */
  const byKey = new Map();
  for (const r of records) {
    if (!byName.has(r[0])) byName.set(r[0], []);
    byName.get(r[0]).push(r);
    const k = `${r[0]}/${r[1]}`;
    if (!byKey.has(k)) byKey.set(k, r);
  }

  if (opt.listCategories) {
    const cats = new Map();
    for (const r of records) cats.set(r[2], (cats.get(r[2]) || 0) + 1);
    console.log(`Iconsax 免费图标：${byName.size} 个图标名 / ${records.length} 条记录 / ${cats.size} 个类目\n`);
    for (const [c, n] of [...cats].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${c.padEnd(38)} ${n}`);
    }
    return;
  }

  if (opt.search) {
    const kw = opt.search.toLowerCase();
    const hits = [...byName.keys()].filter(n => n.includes(kw));
    const catHits = [...new Set(records.filter(r => r[2].toLowerCase().includes(kw)).map(r => r[0]))];
    const all = [...new Set([...hits, ...catHits])].sort();
    console.log(`匹配 "${opt.search}" 的图标 ${all.length} 个：`);
    for (const n of all) console.log('  ' + n);
    return;
  }

  const styles = opt.styles && opt.styles.length ? opt.styles : ALL_STYLES;
  const badStyle = styles.find(s => !ALL_STYLES.includes(s));
  if (badStyle) {
    console.error(`未知样式: ${badStyle}（可选：${ALL_STYLES.join(', ')}）`);
    process.exit(2);
  }

  let names;
  if (opt.all) names = [...byName.keys()];
  else if (opt.curated) names = loadCurated();
  else if (opt.names && opt.names.length) names = opt.names;
  else {
    console.error('请指定 --curated / --names / --all 之一，或 --search / --list-categories。用 --help 看说明。');
    process.exit(2);
  }

  const unknown = names.filter(n => !byName.has(n));
  if (unknown.length) {
    console.warn(`⚠ 索引里没有这些图标名（已跳过）：${unknown.slice(0, 20).join(', ')}${unknown.length > 20 ? ` …共 ${unknown.length} 个` : ''}`);
    console.warn(`  用 --search <关键词> 找找正确的名字。`);
  }

  const todo = [];
  const haveAll6 = [];
  for (const n of names) {
    if (!byName.has(n)) continue;
    let got = 0;
    for (const s of styles) {
      const rec = byKey.get(`${n}/${s}`);
      if (rec) { todo.push(rec); got++; }
    }
    if (got === styles.length) haveAll6.push(n);
  }

  const outDir = path.resolve(opt.out);
  console.log(`将拉取 ${todo.length} 个 SVG（${haveAll6.length} 个图标在全部 ${styles.length} 种样式下都齐全）到 ${outDir}`);

  if (opt.dryRun) {
    for (const r of todo) console.log(`  ${CDN}${r[3]}`);
    return;
  }

  const t0 = Date.now();
  let done = 0;
  const results = await pool(todo, opt.concurrency, async (r) => {
    const res = await fetchOne(r, outDir, opt.key);
    done++;
    if (done % 25 === 0 || done === todo.length) {
      process.stdout.write(`\r  进度 ${done}/${todo.length}   `);
    }
    return res;
  });
  process.stdout.write('\n');

  const errors = results.filter(r => r.error);
  const skipped = results.filter(r => r.skipped).length;
  console.log(`完成：成功 ${results.length - errors.length}（其中已存在跳过 ${skipped}），失败 ${errors.length}，用时 ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  if (errors.length) {
    for (const e of errors.slice(0, 20)) console.error(`  ✗ ${e.file}: ${e.error}`);
  }

  if (opt.emitEts) {
    emitEts(haveAll6.length ? haveAll6 : names, styles, opt.emitEts);
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('fetch-icons.mjs')) {
  main().catch(e => { console.error(e); process.exit(1); });
}
