# ArkUI 对 SVG / 动效 的能力边界（官方文档提炼）

> 来源：OpenHarmony 官方文档仓 `openharmony/docs`（zh-cn/application-dev）
> - `reference/apis-arkui/arkui-ts/ts-basic-components-image.md`
> - `reference/apis-arkui/arkui-ts/ts-basic-svg.md`
> - `reference/apis-arkui/arkui-ts/ts-image-svg2-capabilities.md`
> - `ui/arkts-graphics-display.md`、`ui/arkts-attribute-animation-apis.md`、`ui/arkts-animator.md`
>
> HarmonyOS 与 OpenHarmony 的 ArkUI 部分一致；下面 API 版本号可直接用于 HarmonyOS。

## 1. Image 组件原生支持 SVG（API 7+，零依赖）

`Image` 直接支持 `png / jpg / jpeg / bmp / svg / webp / gif / heif / tiff`，**不需要任何三方库**。
支持范围是 **SVG 1.1 的一个子集**。

### 1.1 支持的标签与属性

| 类别 | 支持内容 |
| --- | --- |
| 基础形状 | `<rect>` `<circle>` `<ellipse>` `<line>` `<polyline>` `<polygon>` `<path>` |
| 通用属性 | `id` `fill` `fill-rule` `fill-opacity` `stroke` `stroke-dasharray` `stroke-dashoffset` `stroke-opacity` `stroke-width` `stroke-linecap` `stroke-linejoin` `stroke-miterlimit` `opacity` `transform` `clip-path` `clip-rule` |
| 结构 | `<svg>` `<g>` `<use>` `<defs>` |
| 裁剪 / 遮罩 / 图案 | `<clippath>` `<mask>` `<pattern>` |
| 渐变 | `<linearGradient>` `<radialGradient>` `<stop>` |
| 滤镜 | `<filter>` `<feOffset>` `<feGaussianBlur>` `<feBlend>` `<feComposite>` `<feColorMatrix>` `<feFlood>` |
| 位图 | `<image>`，`href` 支持 jpg/jpeg/png/bmp/webp/heic/base64，**不支持再引 SVG** |
| **动画** | **`<animate>`、`<animateTransform>`** |

支持的颜色写法：`#rgb`、`#rrggbb`、`rgb()`、`rgba()`，以及常见颜色关键字（`red`/`black`/`white`…）。

### 1.2 不支持 / 受限的地方

- ❌ `<style>` 标签、CSS class、CSS animation —— **完全不认**，样式必须内联成属性
- ❌ `<text>` / `<tspan>` —— 文字要事先转成 `<path>`
- ❌ `<set>`、`<animateMotion>`、`<mpath>`、事件触发动画
- ⚠️ 基础形状的 `transform`：**API 21 之前只支持平移**，旋转/缩放/矩阵要等 `supportSvg2`
- ❌ `Image` 不支持用 **Base64 字符串**加载 SVG（其它位图格式可以）
- ❌ 一大堆属性对 SVG 图源无效：`renderMode`、`interpolation`、`syncLoad`、`imageMatrix`、`orientation`、`enableAnalyzer`、`dynamicRangeMode`、`antialiasing` 等
- ❌ SVG 图片**不支持复制**（`copyOption` 无效）
- ⚠️ SVG 没有原始尺寸时，必须给 `Image` 设宽高，否则不显示
- ⚠️ SVG 引用的外部位图路径，必须相对于 ets 根目录、且与本 SVG 同级相对路径

### 1.3 SVG 内嵌动画（SMIL）—— 可以做动效图标

官方原文：*"当前仅支持单个元素的属性动画或者变形动画，不支持元素间动画嵌套。"*

| 标签 | 允许的 `attributeName` | 其它可用属性 |
| --- | --- | --- |
| `<animate>` | `cx` `cy` `r` `fill` `stroke` `fill-opacity` `stroke-opacity` `stroke-miterlimit` | `begin` `dur` `from` `to` `fill` `calcMode` `keyTimes` `values` `keySplines` |
| `<animateTransform>` | `transform`，`type` = `translate` \| `scale` \| `rotate` \| `skewX` \| `skewY` | 同上 |

配套能力：
- **`Image.onFinish(callback)`** —— 带动效的 SVG 播放完成时回调；无限循环的动画**不会**触发
- `onFinish` 从 API 9 起可用于 ArkTS 卡片、API 11 起可用于原子化服务

**实践约束**（本 skill 的 `make-animated-svg.mjs` 就是这么做的）：
把 `<animate>` / `<animateTransform>` 注入到**每一个可绘制元素内部**，
而不是包一层 `<g>` 再加动画 —— 因为"不支持元素间动画嵌套"，
而且 `<defs>` / `<clipPath>` / `<mask>` 里的内容绝对不能加动画（会把裁剪/遮罩本身动坏）。

### 1.4 上色：两条不同的路（最容易翻车）

| 接口 | 文档原文 | 适用 |
| --- | --- | --- |
| `fillColor(color)` | "设置填充颜色。仅对SVG图源生效，设置后会替换SVG图片中所有可绘制元素的**填充**颜色。" | 填充型图稿 |
| `colorFilter(ColorFilter)` | "API version 11及之前，SVG类型图源不支持该属性。从API version 12开始…**SVG类型的图源只有设置了 stroke 属性（无论是否有值）才会生效**。" | 描边型图稿 |

Iconsax 免费样式正好分两派：

| 样式 | 画法 | 上色方式 |
| --- | --- | --- |
| `bold` `bulk` `outline` | `<path fill="white">` | `fillColor()` |
| `linear` `twotone` `broken` | `<path stroke="white" fill=none>` | `colorFilter(乘法矩阵)` |

**乘法矩阵**（把白色图稿当亮度蒙版染成目标色）：

```ts
// 目标色 (r,g,b) 归一化到 0~1，行优先 4x5
[ r,0,0,0,0,
  0,g,0,0,0,
  0,0,b,0,0,
  0,0,0,1,0 ]
```

白色 `(1,1,1)` 会被映射成目标色；`twotone` 里 `opacity="0.4"` 的次级笔画会自动变成浅色版。

### 1.5 `supportSvg2`（API 21+，可用但要知道它会改行为）

`Image().supportSvg2(true)` 打开 SVG 1.1 标准解析增强：

- 颜色解析从 `#ARGB` 改成标准 `#RGBA`（影响 `fill` `stroke` `stopColor` `stop-color`）
- `transform` 支持 `translate` / `rotate(angle,cx,cy)` / `scale` / `skewX` / `skewY` / `matrix`
- 支持 `transform-origin`
- 支持 `clipPathUnits` / `gradientUnits` / `maskUnits` / `patternUnits` / `filterUnits` 等坐标单元
- `g` 的 `opacity` 对整组多层子元素生效
- **`fillColor` 的行为变了**：改为"依赖 SVG 图源中 fill 属性的参数配置，`fill='none'` 时不生效"
- `colorFilter` 改为对**整张** SVG 生效

> 版本对照：`supportSvg2` 是 API 21，属于 HarmonyOS 6.0.x。
> **HarmonyOS 5.0.x（API 12~15）上没有这个开关**，走的是旧解析器 —— 对 Iconsax 这版 SVG 完全够用。

## 2. ArkTS 侧的动效能力（组件属性动画）

三条路可以叠加使用：

### 2.1 `animateTo`（属性动画）

```ts
// 新版推荐用 UIContext（全局 animateTo 已标记 deprecated）
this.getUIContext().animateTo({ duration: 300, curve: Curve.Friction }, () => {
  this.scaleValue = 0.9;
});
```

`AnimateParam` 常用项：`duration` `tempo` `curve` `delay` `iterations` `playMode` `onFinish` `expectedFrameRateRange`

### 2.2 `keyframeAnimateTo`（关键帧动画，API 11+）

```ts
this.getUIContext().keyframeAnimateTo({ delay: 0, iterations: 1 }, [
  { duration: 240, curve: Curve.EaseOut, event: () => { this.offsetY = -8; } },
  { duration: 240, curve: Curve.EaseIn,  event: () => { this.offsetY = 0; } }
]);
```

### 2.3 `AnimatorResult`（`@ohos.animator`，命令式逐帧）

适合需要自己控制进度、做数值插值的场景（比如自定义绘制）。

### 2.4 曲线

`Curve`（`Linear` `Ease` `EaseIn` `EaseOut` `EaseInOut` `FastOutSlowIn` `Friction` `Sharp` `Rhythm` `Smooth`…）、
`curves.springMotion()` / `curves.responsiveSpringMotion()` / `curves.interactiveSpring()` 弹簧曲线、`cubicBezierCurve()` 自定义贝塞尔。

### 2.5 转场

`TransitionEffect`（`opacity` `translate` `rotate` `scale` `move` `asymmetric`）、
`geometryTransition()` 共享元素转场、`Navigation` / `Tabs` 的页面转场。

## 3. Lottie（Bodymovin JSON）—— 需要三方库

ArkUI **没有**内置 Lottie 支持。要用就走 ohpm：

```bash
ohpm install @ohos/lottie        # MIT，最新 2.0.33
```

```ts
import lottie, { AnimationItem } from '@ohos/lottie';

private ctx: CanvasRenderingContext2D =
  new CanvasRenderingContext2D(new RenderingContextSettings(true));
private item: AnimationItem | null = null;

Canvas(this.ctx).width(200).height(200).onReady(() => {
  this.ctx.imageSmoothingEnabled = true;          // 抗锯齿
  this.item = lottie.loadAnimation({
    container: this.ctx,
    renderer: 'canvas',
    loop: true,
    autoplay: true,
    name: 'demo',
    contentMode: 'Contain',
    path: 'lottie/demo.json'                       // 相对 resources/rawfile
  });
  // 动画是异步加载的，对 item 的操作要放进 DOMLoaded 回调
  this.item.addEventListener('DOMLoaded', () => {
    this.item?.changeColor([10, 89, 247, 1]);      // 运行时改色
  });
});

aboutToDisappear(): void {
  lottie.destroy('demo');                          // 页面销毁时释放
}
```

要点：
- 资源查找顺序 **沙箱 file 目录 > `resources/rawfile`**
- JSON 里引用的外部图片要放 `rawfile` 下；`imagePath` 同理
- `Canvas` 宽高比要和动画原始宽高比一致，且不要大于动画原始尺寸
- 混淆编译要在 `obfuscation-rules.txt` 加 `-keep ./oh_modules/@ohos/lottie`
- 作者另推荐性能更好的 **lottie-turbo**（声明式、子线程渲染、内存缓存）

## 4. 选型速查

| 需求 | 用什么 |
| --- | --- |
| TabBar / 列表 / 按钮图标 | `Image` + SVG（`fillColor` / `colorFilter`） |
| 图标自己"动"（呼吸、浮动、摇一摇） | SVG 内嵌 SMIL（`<animate>` / `<animateTransform>`） |
| 点击反馈、转场、共享元素 | `animateTo` / `keyframeAnimateTo` / `geometryTransition` |
| AE 级复杂动效（多图层、路径变形、粒子） | `@ohos/lottie` 或 `lottie-turbo` |
| 自绘图标 / 数据可视化 | `Canvas` / `Path` / `Shape` / `@ohos.graphics.drawing` |
