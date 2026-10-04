# 鸿蒙图标接入避坑清单（都是实机踩出来的）

按踩坑概率排序。前 5 条是真正会让人卡住的。

---

## 1. 图标是"白色"的，不改色在浅色主题下完全看不见

Iconsax 的 SVG 把颜色**硬编码**成白色：

```xml
<path d="…" fill="white"/>                              <!-- bold/bulk/outline -->
<path d="…" stroke="white" stroke-width="1.5" fill="none"/>  <!-- linear/twotone/broken -->
```

不处理直接 `Image($rawfile('iconsax/bold/home.svg'))`，在白色背景上**什么都没有**。
必须上色（见 `references/arkui-svg-capability.md` 第 1.4 节）。

---

## 2. 填充型和描边型必须用不同的上色 API

| 样式 | 画法 | 上色 |
| --- | --- | --- |
| `bold` `bulk` `outline` | fill | `Image.fillColor(color)` |
| `linear` `twotone` `broken` | stroke | `Image.colorFilter(乘法矩阵)` |

写成一套代码，必然有一半样式失效：
- 对描边图稿用 `fillColor` → **没反应**（fill 是 `none`）
- 对填充图稿用 `colorFilter` → 文档说"只有设置了 stroke 属性才会生效"，可能没反应

`templates/IconsaxIcon.ets` 里用 `if (this.strokeArtwork)` 分成两个分支，照着抄就行。

---

## 3. 自定义组件的 `@Prop` 不能叫 `scale` / `size` / `rotate` / `translate`

会撞上 `CustomComponent` 自带的通用属性方法，编译直接失败：

```
10505001 ArkTS Compiler Error
Property 'scale' in type 'IconsaxIcon' is not assignable to the same property
in base type 'CustomComponent'.
  Type 'number' is not assignable to type
  '{ (value: ScaleOptions): CommonAttribute; ... }'
```

**修法**：加前缀。本 skill 统一用 `ic` 前缀（`icSize` / `icScale` / `icAngle` / `icOffsetY` / `icTint`）。

---

## 4. hvigor 不允许工程路径含非 ASCII 字符

工程目录名带中文（比如「鸿蒙」）时，`hvigorw assembleHap` 直接报：

```
hvigor ERROR: 00306003 Specification Limit Violation
Error Message: Invalid project path. Current path does not match: C:\...\鸿蒙\MyApp
* Try the following:
  > Please modify the project path to ensure that it only contains letters, digits,
    hyphens (-), underscores (_), periods (.), english parentheses (()), spaces, or the @ symbol
```

**修法**：把工程放到纯 ASCII 路径下构建。如果必须在中文目录里开发，就先镜像一份再编译：

```powershell
robocopy $Source $Mirror /E /XD node_modules oh_modules .hvigor build
Push-Location $Mirror; hvigorw assembleHap --mode module -p product=default -p buildMode=debug --no-daemon
```

---

## 5. 全局 `animateTo` / `keyframeAnimateTo` 已弃用 → 用 UIContext

`keyframeAnimateTo` 直接当全局函数用会报 `Cannot find name 'keyframeAnimateTo'`；
`animateTo` 能用但会有 deprecation 警告。

```ts
// ❌ 旧写法
animateTo({ duration: 300 }, () => { this.x = 1; });

// ✅ 新写法
this.getUIContext().animateTo({ duration: 300 }, () => { this.x = 1; });
this.getUIContext().keyframeAnimateTo({ delay: 0, iterations: 1 }, [ /* KeyframeState[] */ ]);
```

同理 `router.pushUrl` / `router.back()` 也建议走 `this.getUIContext().getRouter()`。

---

## 6. SVG 里的 CSS 和 `<text>` 在 ArkUI 里不存在

- `<style>` 标签、CSS class、`animation:` —— ArkUI 的 SVG 解析器**完全不认**
- `<text>` / `<tspan>` 不支持，文字必须转成 `<path>`（Figma / Illustrator 里"轮廓化"）

Iconsax 的 SVG 恰好只用 `clip-path` + `path` + `defs`，没这个坑。
但换成别的图标库（很多用 `<style>` + class）就会掉样式，**换库前一定要先检查**。

---

## 7. 给 SVG 加 SMIL 时，别动 `<defs>`

`<clipPath>` / `<mask>` / `<pattern>` 里面的元素如果被注入动画，会把**裁剪/遮罩本身**动起来，
结果就是图形被裁歪或者闪现。`make-animated-svg.mjs` 会先把 `<defs>` 整块摘出来再注入。

另外动画元素要注入到**每个可绘制元素内部**，不要包一层 `<g>` ——
官方明确"不支持元素间动画嵌套"。

---

## 8. `supportSvg2` 会改变上色行为（API 21+）

打开 `supportSvg2(true)` 之后：
- `fillColor` 改为"依赖 SVG 图源中 fill 属性的参数配置，**`fill='none'` 时不生效**"
- 颜色解析从 `#ARGB` 变成标准 `#RGBA`
- `colorFilter` 改为对整张 SVG 生效

**跨版本发版一定要在 API 12 和 API 21 上都实测一遍**，别只在一边调好就发。

---

## 9. SVG 图源有一堆属性不生效

写代码时别浪费时间在这些上面：`renderMode`、`interpolation`、`syncLoad`、`imageMatrix`、
`orientation`、`enableAnalyzer`、`dynamicRangeMode`、`antialiasing`、`copyOption`（SVG 不支持复制）。

SVG 也没有"原始尺寸"的概念，**必须给 `Image` 设宽高**，否则不显示。

---

## 10. 资源放 `rawfile` 还是 `media`？

| | `resources/base/media/`（`$r('app.media.xxx')`） | `resources/rawfile/`（`$rawfile('path/x.svg')`） |
| --- | --- | --- |
| 类型安全 | ✅ 编译期校验 | ❌ 运行时字符串 |
| 适合批量图标 | ❌ 每个都要起合法资源名 | ✅ 目录结构随意 |
| 动态路径 | ❌ | ✅ |

图标量大（几十上百个）时用 `rawfile` 更省事。**注意 `rawfile` 里的路径不要带中文**。

---

## 11. Lottie 相关

- 用的是官方 `@ohos/lottie`（**MIT**），`ohpm install @ohos/lottie`
- 必须先 `lottie.destroy(name)` 再 `loadAnimation`，否则重复加载
- `animateItem` 的操作要放在 `addEventListener('DOMLoaded', ...)` 里（异步加载）
- 页面销毁时 `aboutToDisappear()` 里 `lottie.destroy()`
- `Canvas` 宽高比要和动画原始宽高比一致，且不要大于动画原始尺寸
- 混淆编译要在 `obfuscation-rules.txt` 加 `-keep ./oh_modules/@ohos/lottie`
- 开抗锯齿：`ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'medium';`
- 首次加载空白延迟 → 加 `autoSkip: false`

---

## 12. 写完文件的编码问题（Windows 上的隐形杀手）

- **`main_pages.json` 带 UTF-8 BOM** → 构建报 `the ... main_pages.json file format is invalid`
- **`.ps1` 文件用无 BOM 的 UTF-8 存中文** → PowerShell 按 GBK 解码，直接语法错误

结论：给自己写工具脚本时**用纯 ASCII**，或者确保写 JSON 时不带 BOM。
