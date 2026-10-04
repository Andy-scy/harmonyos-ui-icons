#!/usr/bin/env node
/**
 * make-animated-svg.mjs — 给一批静态 SVG 批量注入 SMIL 动画，生成"会动的图标"。
 *
 * 为什么这样做：ArkUI 的 Image 组件**原生支持** SVG 里的 <animate> / <animateTransform>
 * （见 references/arkui-svg-capability.md），所以"图标动效"根本不需要引入 Lottie 之类的库，
 * 也不需要买 Iconsax 的付费动效包 —— 自己往免费静态 SVG 里塞 SMIL 就行。
 *
 * 官方限制（本脚本按这个约束来生成）：
 *   - 只支持**单个元素**的属性动画或变形动画，不支持元素间动画嵌套
 *   - <animate>        的 attributeName 只能是 cx|cy|r|fill|stroke|fill-opacity|stroke-opacity|stroke-miterlimit
 *   - <animateTransform> 的 type 只能是 translate|scale|rotate|skewX|skewY
 * 因此这里把动画元素注入到**每一个可绘制元素内部**（path/circle/rect/...），
 * 而不是包一层 <g>（避免"元素间嵌套"）。<defs>/<clipPath>/<mask> 里的内容不会被注入。
 *
 * 用法：
 *   node make-animated-svg.mjs --in <静态目录> --out <输出目录> [--effects float,pulse,spin]
 *
 * 目录约定：<in>/<style>/<name>.svg  ->  <out>/<effect>/<style>/<name>.svg
 */

import fs from 'node:fs';
import path from 'node:path';

const DRAWABLE = 'path|circle|rect|ellipse|line|polyline|polygon';

/** 效果名 -> (是否为描边图稿) => SMIL 片段 */
export const EFFECTS = {
  /** 上下轻轻浮动：纯 translate 动画，最保险 */
  float: () =>
    '<animateTransform attributeName="transform" type="translate" ' +
    'values="0 0; 0 -2; 0 0" keyTimes="0; 0.5; 1" dur="1.6s" repeatCount="indefinite"/>',
  /** 呼吸：透明度动画。填充图稿动 fill-opacity，描边图稿动 stroke-opacity */
  pulse: (isStroke) =>
    `<animate attributeName="${isStroke ? 'stroke-opacity' : 'fill-opacity'}" ` +
    'values="1; 0.3; 1" keyTimes="0; 0.5; 1" dur="1.4s" repeatCount="indefinite"/>',
  /** 转一圈（只播一次，播完 Image.onFinish 会回调） */
  spin: () =>
    '<animateTransform attributeName="transform" type="rotate" ' +
    'from="0 12 12" to="360 12 12" dur="1.2s" repeatCount="1" fill="freeze"/>',
  /** 左右摇一摇 */
  wiggle: () =>
    '<animateTransform attributeName="transform" type="rotate" ' +
    'values="-8 12 12; 8 12 12; -8 12 12" keyTimes="0; 0.5; 1" dur="0.9s" repeatCount="indefinite"/>',
  /** 心跳：放大缩小（以 12,12 为中心需要外层 transform，这里用 scale 近似） */
  beat: () =>
    '<animateTransform attributeName="transform" type="scale" ' +
    'values="1 1; 1.12 1.12; 1 1" keyTimes="0; 0.4; 1" dur="1.1s" repeatCount="indefinite" additive="sum"/>',
};

function splitSvg(svg) {
  const m = svg.match(/^([\s\S]*?<svg\b[^>]*>)([\s\S]*)(<\/svg>\s*)$/);
  if (!m) throw new Error('无法解析 <svg> 结构');
  return { head: m[1], body: m[2], tail: m[3] };
}

/** 判断这份图稿是不是"描边型"（只有 stroke、没有 fill） */
export function isStrokeArtwork(svg) {
  const hasStroke = /stroke="(?!none)/.test(svg);
  const hasFill = /fill="(?!none)[^"]*"/.test(svg);
  return hasStroke && !hasFill;
}

function inject(body, animEl) {
  let n = 0;
  let out = body.replace(new RegExp(`<(${DRAWABLE})\\b([^>]*?)/>`, 'g'), (m, tag, attrs) => {
    n++;
    return `<${tag}${attrs}>${animEl}</${tag}>`;
  });
  out = out.replace(new RegExp(`<(${DRAWABLE})\\b([^>]*?)>\\s*</\\1>`, 'g'), (m, tag, attrs) => {
    n++;
    return `<${tag}${attrs}>${animEl}</${tag}>`;
  });
  if (n === 0) throw new Error('没找到可绘制元素');
  return out;
}

export function animate(svg, effect) {
  const build = EFFECTS[effect];
  if (!build) throw new Error(`未知动效: ${effect}`);
  const { head, body, tail } = splitSvg(svg);
  // <defs>/<clipPath>/<mask> 里的东西不能动，否则会把裁剪/遮罩本身动坏
  const defsBlocks = [];
  const paintBody = body.replace(/<defs\b[\s\S]*?<\/defs>\s*/g, (d) => { defsBlocks.push(d); return ''; });
  return head + inject(paintBody, build(isStrokeArtwork(svg))) + defsBlocks.join('') + tail;
}

function parseArgs(argv) {
  const o = { in: null, out: null, effects: Object.keys(EFFECTS) };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--in') o.in = argv[++i];
    else if (a === '--out') o.out = argv[++i];
    else if (a === '--effects') o.effects = argv[++i].split(',').map(s => s.trim()).filter(Boolean);
    else if (a === '-h' || a === '--help') o.help = true;
    else { console.error(`未知参数: ${a}`); process.exit(2); }
  }
  return o;
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.help || !o.in || !o.out) {
    console.log('用法: node make-animated-svg.mjs --in <静态目录> --out <输出目录> [--effects float,pulse,spin,wiggle,beat]');
    console.log('可用动效: ' + Object.keys(EFFECTS).join(', '));
    process.exit(o.help ? 0 : 2);
  }
  const inRoot = path.resolve(o.in);
  const outRoot = path.resolve(o.out);
  let count = 0;
  const errors = [];
  for (const style of fs.readdirSync(inRoot)) {
    const styleDir = path.join(inRoot, style);
    if (!fs.statSync(styleDir).isDirectory()) continue;
    for (const file of fs.readdirSync(styleDir).filter(f => f.endsWith('.svg'))) {
      const svg = fs.readFileSync(path.join(styleDir, file), 'utf8');
      for (const fx of o.effects) {
        const dir = path.join(outRoot, fx, style);
        fs.mkdirSync(dir, { recursive: true });
        try {
          fs.writeFileSync(path.join(dir, file), animate(svg, fx), 'utf8');
          count++;
        } catch (e) { errors.push(`${fx}/${style}/${file}: ${e.message}`); }
      }
    }
  }
  console.log(`已生成 ${count} 个动效 SVG 到 ${outRoot}`);
  if (errors.length) {
    console.log(`失败 ${errors.length} 个：`);
    console.log(errors.slice(0, 10).join('\n'));
  }
}

if (process.argv[1]?.endsWith('make-animated-svg.mjs')) {
  main();
}
