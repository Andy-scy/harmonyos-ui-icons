---
name: harmonyos-ui-icons
version: 1.1.0
display_name: HarmonyOS 图标库（Iconsax）
display_name_en: HarmonyOS UI Icons (Iconsax)
description: >
  鸿蒙（HarmonyOS / OpenHarmony）应用做前端界面时，需要图标、icon、矢量图、界面动效时使用。
  提供 Iconsax 免费图标库的取用工具链：从官方 CDN 拉取并解密 SVG 的脚本、批量注入 SVG SMIL 动效的脚本、
  ArkTS 可直接用的 IconsaxIcon / Tint / IconsaxCatalog 代码模板、全部 7,140 个免费图标的索引、
  ArkUI 的 SVG 能力边界与上色/动效规则、授权红线说明。
  ⚠️ 本技能的图标资产不在版本库里，**首次使用必须先跑 scripts/bootstrap.mjs 从 Iconsax 官网把 SVG 拉下来**，
  否则 assets/iconsax/ 是空的，任何拷贝图标的操作都会失败。
  当任务涉及 ArkTS / ArkUI / DevEco Studio / 鸿蒙页面、组件、TabBar、底部导航、
  列表、卡片、按钮、状态栏、空状态等界面元素，或用户提到"找个图标""加个图标"
  "这个图标""画个 icon""鸿蒙 UI""HarmonyOS 界面"时必须触发。
  即使用户只是说"做个鸿蒙页面""帮我搭个 App 界面"也应该触发。
---

# HarmonyOS 图标库（Iconsax）

一站式解决"鸿蒙 App 界面要图标"这件事：**图标素材 + 上色方案 + 动效方案 + 踩坑清单**，全部实机验证过。

---

## ⚠️ 零、首次使用：必须先把 SVG 拉下来（重要，别跳过）

**本技能不含任何 SVG 文件。** Iconsax 的免费授权允许把图标用在 App 里，
但**不允许把图标本体（含改过的版本）再分发**，所以公开仓库里只放工具、不放图标。

### 你在动手前必须做的第一步

```bash
# 检查资产是否已就绪（目录不存在或为空 = 未初始化）
ls assets/iconsax/           # Windows: Get-ChildItem assets\iconsax

# 未初始化 → 跑这一条命令
node scripts/bootstrap.mjs
```

`bootstrap.mjs` 会：

1. 从官方 CDN `https://cdn.iconsax.io` 拉取 **181 个精选图标 × 6 样式 = 1083 个 SVG** 并现场解密
2. 生成 **3249 个内嵌 SMIL 的动效变体**
3. 重新生成 `templates/IconsaxCatalog.ets`，保证目录和实际文件对得上

> 需要联网。大约 1 分钟。跑完会打印统计和下一步提示。

### 判断规则（照这个来）

| `assets/iconsax/` 的状态 | 你要做的事 |
| --- | --- |
| 不存在，或是空目录 | **停下来，先跑 `node scripts/bootstrap.mjs`**，跑完再继续 |
| 有文件但缺你需要的图标 | `node scripts/fetch-icons.mjs --names <名字> --out assets/iconsax` |
| 已就绪，且有你需要的图标 | 直接进入第三节的工作流 |

**绝对不要**因为找不到图标就自己手写一个 SVG 顶上 —— 先初始化，再在里面挑。

---

## 一、先看这个：三句话讲清怎么用

1. **图标本体**：先初始化（见上），然后 `assets/iconsax/<style>/<name>.svg` 直接拷进工程的 `resources/rawfile/iconsax/`
2. **上色必须做**：Iconsax 的 SVG 全是白色，填充型（`bold`/`bulk`/`outline`）用 `Image.fillColor()`，
   描边型（`linear`/`twotone`/`broken`）用 `Image.colorFilter(乘法矩阵)`
3. **想要"会动的图标"不用买 Lottie**：`bootstrap.mjs` 已经生成好动效变体；
   想要别的效果就跑 `scripts/make-animated-svg.mjs` 注入 SMIL，ArkUI 的 `Image` 组件**原生就播**

## 二、目录结构

```
harmonyos-ui-icons/
├─ SKILL.md                          ← 本文件
├─ assets/
│  ├─ README.md                      ← 说明资产为什么不在版本库里
│  ├─ iconsax/<style>/<name>.svg     ← ⚠️ 生成的：181 图标 × 6 样式 = 1083 个
│  └─ iconsax-anim/<fx>/<style>/<name>.svg
│                                    ← ⚠️ 生成的：3249 个内嵌 SMIL 动效变体
│                                      fx ∈ { float（浮动）, pulse（呼吸）, wiggle（摇摆） }
│                                    （这两条路径已写进 .gitignore，需要 bootstrap.mjs 生成）
├─ templates/
│  ├─ IconsaxIcon.ets                ← 图标渲染组件（双上色路线 + onFinish）
│  ├─ Tint.ets                       ← 乘法着色矩阵 / 颜色工具
│  └─ IconsaxCatalog.ets             ← 181 个图标的中文目录（bootstrap 会自动重生成）
├─ catalog/
│  ├─ iconsax-free-index.json        ← 全部 7,140 个免费图标索引（1101 个名字 / 34 个类目）
│  └─ curated-names.json             ← 精选的 181 个图标名
├─ scripts/
│  ├─ bootstrap.mjs                  ← ★ 首次使用必跑：初始化全部资产
│  ├─ fetch-icons.mjs                ← 按需从官方 CDN 拉取 + 解密更多图标
│  └─ make-animated-svg.mjs          ← 给任意静态 SVG 批量注入 SMIL 动效
└─ references/
   ├─ arkui-svg-capability.md        ← ArkUI 对 SVG / 动效 / Lottie 的能力边界（官方文档提炼）
   ├─ license.md                     ← Iconsax 授权要点与红线
   └─ pitfalls.md                    ← 12 条实机踩坑清单
```

## 三、标准工作流

### Step 0 — 初始化（首次必做）

见上面「零」。一句话：`assets/iconsax/` 不存在或为空 → 先跑 `node scripts/bootstrap.mjs`。

### Step 1 — 确定要哪些图标

**优先查离线清单**（初始化后这 181 个就在 `assets/iconsax/` 里，零等待）：

```
add add-circle add-square airplane android apple arrow-circle-down arrow-circle-left
arrow-circle-right arrow-circle-up arrow-down arrow-left arrow-right arrow-square-left
arrow-square-right arrow-up award bag bank barcode battery-charging book book-open
bookmark building bus cake calendar calendar-add calendar-tick call call-incoming
call-outgoing camera car card category chart chart-square chart-success clipboard-text
clock clock2 close-circle close-square cloud cloud-add cloud-sunny code coin command cpu
cpu-setting cup data diamonds discover dislike document document-copy document-download
document-text document-upload dollar-circle edit emoji-happy emoji-sad export-arrow eye
eye-slash favorite-chart filter filter-search finger-scan flash folder folder-add
folder-open gallery gift global google gps graph grid-equal happy heart heart-add
heart-tick hierarchy hierarchy-square home hospital house image import-arrow info-circle
key lamp-on like location lock login logout map medal menu message-add message-bubble
message-square message-text microphone minus minus-circle money money-recive money-send
moon more musicnote note note-text notification notification-bing notification-circle
pause people play printer profile profile-2user profile-add receipt receipt-text
refresh-arrow refresh-circle save scan scanner search-favorite search-normal search-status
search-zoom-in security-safe security-user send send-square setting settings share
shield-cross shield-tick ship shop shopping-cart sms sort speaker star star-slash star2
stop sun task-square teacher timer trash tree truck unlock user user-add user-remove
verify video volume-high wallet wallet-add wallet-money warning windows
```

**需要更多**（总共 1,101 个名字可选）就搜索引：

```bash
node scripts/fetch-icons.mjs --search 关键词        # 例：--search chat / --search heart
node scripts/fetch-icons.mjs --list-categories      # 看 34 个类目
```

### Step 2 — 把 SVG 拷进工程

> 前提：Step 0 已完成，`assets/iconsax/` 里有文件。**没有就先回去跑 `bootstrap.mjs`。**

```bash
# 单个样式、本地拷贝
mkdir -p <工程>/entry/src/main/resources/rawfile/iconsax/bold
cp assets/iconsax/bold/{home,user,setting,search-normal}.svg \
   <工程>/entry/src/main/resources/rawfile/iconsax/bold/

# 或者直接按需从官方 CDN 拉（会自动解密；工程里不需要保留解密逻辑）
node scripts/fetch-icons.mjs \
  --out <工程>/entry/src/main/resources/rawfile/iconsax \
  --names home,user,setting,search-normal \
  --styles bold,linear,twotone
```

> ⚠️ `rawfile` 下的路径**不要带中文**。另外 `--emit-ets <路径>` 可以顺手生成一份 ArkTS 目录文件。

### Step 3 — 拷代码模板

```bash
mkdir -p <工程>/entry/src/main/ets/{common,components,model}
cp templates/Tint.ets            <工程>/entry/src/main/ets/common/
cp templates/IconsaxIcon.ets     <工程>/entry/src/main/ets/components/
cp templates/IconsaxCatalog.ets  <工程>/entry/src/main/ets/model/
```

### Step 4 — 在页面里用

```ts
import { IconsaxIcon } from '../components/IconsaxIcon';
import { IconsaxCatalog } from '../model/IconsaxCatalog';

@Entry
@Component
struct Index {
  private style: string = 'linear';        // 描边风格更常见
  @State tint: string = '#182431';

  build() {
    Row({ space: 16 }) {
      IconsaxIcon({
        rawfile: IconsaxCatalog.rawfilePath('home', this.style),
        icSize: 24,
        icTint: this.tint,
        strokeArtwork: IconsaxCatalog.isStrokeStyle(this.style)   // ← 关键，别写死
      })
      IconsaxIcon({
        rawfile: IconsaxCatalog.rawfilePath('user', this.style),
        icSize: 24,
        icTint: this.tint,
        strokeArtwork: IconsaxCatalog.isStrokeStyle(this.style)
      })
    }
  }
}
```

## 四、动效：三层，都不需要三方库

### 4.1 图标自己会动（SVG 内嵌 SMIL）—— 推荐

```bash
# bootstrap.mjs 已经生成了 float / pulse / wiggle 三套，直接拷
cp assets/iconsax-anim/float/linear/heart.svg \
   <工程>/entry/src/main/resources/rawfile/iconsax-anim/float/linear/

# 想要别的效果，或想要一次性只处理选中的图标
node scripts/make-animated-svg.mjs \
  --in  <工程>/entry/src/main/resources/rawfile/iconsax \
  --out <工程>/entry/src/main/resources/rawfile/iconsax-anim \
  --effects float,pulse,spin,wiggle,beat
```

可用效果：`float`（上下浮动）、`pulse`（呼吸）、`spin`（转一圈，单次）、`wiggle`（摇摆）、`beat`（心跳）。

**官方限制（脚本已按此生成）**：只支持单元素的属性/变形动画，不支持元素间嵌套。
`<animate>` 只能动 `cx|cy|r|fill|stroke|fill-opacity|stroke-opacity|stroke-miterlimit`；
`<animateTransform>` 只能 `translate|scale|rotate|skewX|skewY`。
`<defs>` / `<clipPath>` / `<mask>` 里**不能**加动画（会把裁剪本身动坏）。

单次动效播完会触发 `Image.onFinish()`，可以拿来做"播完停在终点"或切图。

### 4.2 组件属性动画（`animateTo` / `keyframeAnimateTo`）

```ts
// 用 UIContext，全局 animateTo 已 deprecated
this.getUIContext().animateTo({ duration: 900, curve: Curve.FastOutSlowIn }, () => {
  this.angle = 360;
});

this.getUIContext().keyframeAnimateTo({ delay: 0, iterations: 1 }, [
  { duration: 240, curve: Curve.EaseOut, event: () => { this.offsetY = -8; } },
  { duration: 240, curve: Curve.EaseIn,  event: () => { this.offsetY = 0; } }
]);
```

### 4.3 Lottie（只在真需要 AE 级复杂动效时用）

ArkUI **没有**内置 Lottie。需要就 `ohpm install @ohos/lottie`（MIT），
用法和注意事项见 `references/arkui-svg-capability.md` 第 3 节。

> ⚠️ **Iconsax 的 983 个官方动效图标是 Pro 付费资产，免费授权不含、也不允许再分发。**
> 本 skill 里一个都没有。想要动效请用 4.1 的 SMIL 方案，或自己买 Pro。

## 五、五条必须记住的规则

| # | 规则 |
| --- | --- |
| 1 | **图标是白色的，必须运行时上色**，否则浅色主题下完全看不见 |
| 2 | **填充型用 `fillColor`，描边型用 `colorFilter`**，不能一套代码打天下 |
| 3 | **自定义组件的 `@Prop` 不能叫 `scale`/`size`/`rotate`/`translate`**，会撞 `CustomComponent`；本 skill 统一 `ic` 前缀 |
| 4 | **工程路径不能含中文**，hvigor 会直接拒绝构建；含中文目录时先镜像到 ASCII 路径 |
| 5 | **ArkUI 的 SVG 解析器不认 CSS（`<style>`/class）和 `<text>`**；换别家图标库前先检查 |

更多见 `references/pitfalls.md`（12 条）。

## 六、授权（用之前扫一眼，别踩线）

- 免费那 7,140 个静态图标：**商用 OK、免署名、可修改、可嵌进 App** ✅
- 禁止：**把图标本体（或改过的版本）当素材再分发 / 转售 / 传素材站** ❌
- 交付 App 二进制没问题，**别把图标源文件打包给客户** ❌
- 动效图标 = Pro 专属

详见 `references/license.md`。

## 七、按需加载参考文件

| 什么时候读 | 读哪个 |
| --- | --- |
| 要确认某个 SVG 特性 / 动画能力 / Lottie 用法 | `references/arkui-svg-capability.md` |
| 上色不生效、构建报错、属性不响应 | `references/pitfalls.md` |
| 要确认能不能商用、能不能再分发 | `references/license.md` |
| 要更多图标、想搜名字 | `scripts/fetch-icons.mjs --search <kw>` |
| 要生成动效图标 | `scripts/make-animated-svg.mjs` |

## 八、可复现的验证记录

本 skill 的每一个结论都在真实环境验证过：

- DevEco Studio 26.0.0 + HarmonyOS 6.0.1(API 21) 模拟器
- 编译签名 HAP（2.93 MB，含 843 个 SVG）→ `hdc install` → `aa start` → 截图
- 验证项：`bold` 经 `fillColor` 正常着色、`twotone`/`linear` 经 `colorFilter` 正常着色且双色调保留、
  SMIL 动效帧间像素差 4.56%（确实在动）、`@ohos/lottie` 成功加载并 25fps 播放
- 完整工程与截图留档在用户工作区 `C:\VibeCoding\DeepSeek\鸿蒙\IconsaxHarmonyDemo\`
