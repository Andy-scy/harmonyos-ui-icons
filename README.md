# harmonyos-ui-icons

**简体中文** | [English](README.en.md)

> **DeepSeek Harness 技能包（bundle）+ 鸿蒙图标工具链**
> 装上之后，DSH 里的 Agent 在做 HarmonyOS / ArkTS 界面时会自动带上这套图标能力：**图标素材 + 上色方案 + 动效方案 + 踩坑清单**，全部在真机模拟器上验证过。

<p>
<img alt="HarmonyOS" src="https://img.shields.io/badge/HarmonyOS-5.0%2B-000000?logo=harmonyos&logoColor=white">
<img alt="ArkTS" src="https://img.shields.io/badge/ArkTS-ArkUI-0A59F7">
<img alt="API" src="https://img.shields.io/badge/API-12%2B-00A870">
<img alt="icons" src="https://img.shields.io/badge/icons-1083%20SVG%20%2B%203249%20animated-E84026">
<img alt="DSH" src="https://img.shields.io/badge/DSH%20bundle-0.2.0--rc.x-8E4EC6">
<img alt="license" src="https://img.shields.io/badge/code-MIT-4C566A">
</p>

---

## ⚠️ 先做这一步：初始化（不跑就没有图标）

**本仓库不含任何 SVG 文件。** Iconsax 的免费授权允许你把图标用在 App 里，
但**不允许把图标本体（含改过的版本）再分发出去**，所以公开仓库里只放工具、不放图标。

**装好之后的第一件事**是跑初始化：

```bash
# <skill-root> = 本技能根目录，通常长这样：
#   <DSH_HOME>/profiles/<profile>/node_modules/harmonyos-ui-icons/skills/harmonyos-ui-icons
node <skill-root>/scripts/bootstrap.mjs
```

`bootstrap.mjs` 会：

1. 从官方 CDN `https://cdn.iconsax.io` 拉取 **181 个精选图标 × 6 样式 = 1083 个 SVG**，并现场解密
2. 基于这些静态 SVG 生成 **3249 个内嵌 SMIL 的动效变体**
3. 重新生成 `templates/IconsaxCatalog.ets`，保证目录和实际文件对得上

> 需要联网，大约 1 分钟。**幂等**——已经初始化过会直接跳过。

技能自己也知道这件事：它的 `SKILL.md` 把「Step 0 初始化」写成了硬性前置条件，
一旦发现 `assets/iconsax/` 为空，会先跑 `bootstrap.mjs` 再去拿图标。

| `assets/iconsax/` 状态 | 要做什么 |
| --- | --- |
| 不存在 / 空目录 | **停下，先跑 `scripts/bootstrap.mjs`** |
| 缺你需要的图标 | `node scripts/fetch-icons.mjs --names <名字> --out assets/iconsax` |
| 已就绪 | 直接开用 |

---

## 作为 DSH 技能包安装

这是一个标准的 **DSH bundle**：`package.json` 声明 `dsh.bundle.patch`，
`cordis.patch.yml` 里**只新增一行**，挂载 DSH 自带的 `@deepseek-ai/dsh-skill-filesystem`，
把本包携带的 `skills/` 目录注册成技能根。

```yaml
# cordis.patch.yml —— 纯新增，不改写/不冒用任何已有 entry id
- insert:
    - id: harmonyos-ui-icons-skill-filesystem
      name: '@deepseek-ai/dsh-skill-filesystem'
      config:
        providerName: harmonyos-ui-icons
        includeDefaultRoots: false
        bundledSkillDir: !!js ...   # 从安装后的包身份解析到本包的 skills/
```

安装方式任选：

**A. 通过 DSH 的插件管理器**（推荐，走 `plugin_manager` `install_bundle`）

**B. 手动装进某个 profile**

```bash
# 在 profile 目录里（<DSH_HOME>/profiles/<profile>）
pnpm add harmonyos-ui-icons            # 或 "harmonyos-ui-icons": "git+https://github.com/Andy-scy/harmonyos-ui-icons.git"
# 然后把 "harmonyos-ui-icons" 加进该 profile package.json 的 dsh.profile.bundles
```

**C. 只想用技能本体**（不装 bundle）

把 `skills/harmonyos-ui-icons/` 整个目录拷进技能的搜索路径即可，比如
`<DSH_HOME>/skills/harmonyos-ui-icons/` 或项目里的 `.dsh/skills/harmonyos-ui-icons/`。

> 三种方式装完之后**都要跑一次 `scripts/bootstrap.mjs`**。

装好之后，在 DSH 里只要提到 ArkTS / ArkUI / 鸿蒙页面 / 组件 / TabBar / "加个图标" / "做个鸿蒙界面"，
技能会自动加载，带着这套图标库和文档出场。

---

## 这是什么

鸿蒙 App 做界面绕不开图标。这个包解决四件事：

| | |
| --- | --- |
| 🎨 **图标素材** | 181 个常用 UI 图标 × 6 种样式 = **1083 个 SVG**（初始化后拉到本地，已解密），拷进 `rawfile/` 就能用 |
| ✨ **动效图标** | **3249 个内嵌 SMIL 的动效变体**（浮动 / 呼吸 / 摇摆），ArkUI 的 `Image` 组件**原生就播**，零依赖 |
| 🧩 **ArkTS 模板** | `IconsaxIcon` / `Tint` / `IconsaxCatalog` 三个文件，**过了真实编译 + 实机运行** |
| 📚 **避坑文档** | ArkUI 的 SVG 能力边界、上色两条路线、授权红线、12 条实机踩坑清单 |

图标来自 [Iconsax](https://iconsax.io) 的**免费授权**范围（7,140 个静态图标中的 181 个常用款）。
包里同时带**完整的 7,140 个免费图标索引**和下载脚本，需要冷门图标时一条命令就能拉。

---

## 三句话讲清怎么用

1. **拷图标**：`assets/iconsax/<style>/<name>.svg` → 你的 `entry/src/main/resources/rawfile/iconsax/`
2. **必须上色**：Iconsax 的 SVG 全是白色。填充型（`bold`/`bulk`/`outline`）用 `Image.fillColor()`，
   描边型（`linear`/`twotone`/`broken`）用 `Image.colorFilter(乘法矩阵)`
3. **要动效不用买 Lottie**：`bootstrap.mjs` 已经生成好动效变体；
   想要别的效果就跑 `scripts/make-animated-svg.mjs` 往 SVG 里注入 SMIL

---

## 快速开始

```bash
# ① 初始化（拉取 + 解密 + 生成动效）
node skills/harmonyos-ui-icons/scripts/bootstrap.mjs

# ② 想要更多图标（总共 1101 个名字可选）
cd skills/harmonyos-ui-icons
node scripts/fetch-icons.mjs --search chat
node scripts/fetch-icons.mjs --list-categories
node scripts/fetch-icons.mjs --out <工程>/entry/src/main/resources/rawfile/iconsax \
  --names home,user,setting --styles bold,linear,twotone

# ③ 生成别的动效变体
node scripts/make-animated-svg.mjs \
  --in  assets/iconsax \
  --out assets/iconsax-anim \
  --effects float,pulse,spin,wiggle,beat
```

在页面里用：

```bash
# 拷三个模板进工程
cp skills/harmonyos-ui-icons/templates/Tint.ets            <工程>/entry/src/main/ets/common/
cp skills/harmonyos-ui-icons/templates/IconsaxIcon.ets     <工程>/entry/src/main/ets/components/
cp skills/harmonyos-ui-icons/templates/IconsaxCatalog.ets  <工程>/entry/src/main/ets/model/
```

```ts
import { IconsaxIcon } from '../components/IconsaxIcon';
import { IconsaxCatalog } from '../model/IconsaxCatalog';

@Entry
@Component
struct Index {
  private style: string = 'linear';
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

---

## 效果

在 HarmonyOS 6.0.1 (API 21) 模拟器上实机运行：

| 填充型 `bold` → `fillColor` | 描边型 `twotone` → `colorFilter` |
| --- | --- |
| ![bold](docs/screenshots/shot-01-bold-static.jpeg) | ![twotone](docs/screenshots/shot-02-twotone-static.jpeg) |

| SMIL 动效帧差（确实在动） | Lottie 播放 |
| --- | --- |
| ![smil](docs/screenshots/shot-04-float-diff.png) | ![lottie](docs/screenshots/shot-06-lottie.jpeg) |

---

## 关键结论（都是实测出来的）

### 1. ArkUI 原生支持 SVG，也**原生支持 SVG 内嵌动画**

`Image` 从 **API 7** 起就支持 `svg`，支持范围是 SVG 1.1 的子集。
动画方面，官方明确支持 `<animate>` 和 `<animateTransform>`：

> 当前仅支持**单个元素的属性动画或者变形动画**，不支持元素间动画嵌套。

这就意味着：**"会动的图标"根本不需要引入 Lottie 之类的库**，
往免费静态 SVG 里塞 SMIL 就完事。单次动效播完还会触发 `Image.onFinish()`。

### 2. 上色必须分两条路（最容易翻车的地方）

| 接口 | 文档原文 | 适用 |
| --- | --- | --- |
| `fillColor(color)` | "替换SVG图片中所有可绘制元素的**填充**颜色" | 填充型图稿 |
| `colorFilter(矩阵)` | "SVG类型的图源**只有设置了 stroke 属性**（无论是否有值）才会生效" | 描边型图稿 |

而 Iconsax 的 6 种样式正好分成两派，所以要靠 `IconsaxCatalog.isStrokeStyle()` 分流。
详见 [references/arkui-svg-capability.md](skills/harmonyos-ui-icons/references/arkui-svg-capability.md)。

### 3. 关于 Iconsax 的"动效图标"

Iconsax 官网那 **983 个动效图标是 Pro 付费专属**（Lottie 格式），免费授权里没有，
而且授权也**不允许再分发**。所以：

- ❌ 本包**没有**任何 Iconsax 官方动效文件
- ✅ 本包的 3249 个动效 SVG 是用 `make-animated-svg.mjs` 给**免费静态图标**注入 SMIL 生成的

---

## 五条必须记住的规则

| # | 规则 |
| --- | --- |
| 1 | **图标是白色的，必须运行时上色**，否则浅色主题下完全看不见 |
| 2 | **填充型用 `fillColor`，描边型用 `colorFilter`**，一套代码打不了天下 |
| 3 | **自定义组件的 `@Prop` 不能叫 `scale`/`size`/`rotate`/`translate`**，会撞 `CustomComponent`；本库统一 `ic` 前缀 |
| 4 | **工程路径不能含中文**，hvigor 会直接拒绝构建 |
| 5 | **ArkUI 的 SVG 解析器不认 CSS（`<style>`/class）和 `<text>`** |

完整 12 条见 [references/pitfalls.md](skills/harmonyos-ui-icons/references/pitfalls.md)。

---

## 目录结构

```
harmonyos-ui-icons/                    ← npm 包 = DSH bundle
├─ package.json                        dsh.bundle.patch + dsh.compatibility.dshReleases
├─ cordis.patch.yml                    一行 insert，挂载 dsh-skill-filesystem
├─ lib/index.js                        resolveSkillRoot()
├─ icon.svg                            插件管理器显示的图标
├─ locale/{en,zh}.json                 插件管理器显示的标题与描述
├─ skills/
│  └─ harmonyos-ui-icons/              ← 技能本体
│     ├─ SKILL.md
│     ├─ assets/                       ⚠️ 全部由 bootstrap.mjs 生成，不进版本库
│     │  └─ README.md                  说明为什么图标不在仓库里
│     ├─ templates/                    ArkTS 模板（Tint / IconsaxIcon / IconsaxCatalog）
│     ├─ catalog/
│     │  ├─ iconsax-free-index.json    全部 7,140 个免费图标索引（1101 名字 / 34 类目）
│     │  └─ curated-names.json         精选的 181 个图标名
│     ├─ scripts/
│     │  ├─ bootstrap.mjs              ★ 首次使用必跑
│     │  ├─ fetch-icons.mjs            从官方 CDN 按需拉取 + 解密
│     │  └─ make-animated-svg.mjs      给静态 SVG 批量注入 SMIL
│     └─ references/
│        ├─ arkui-svg-capability.md    ArkUI 对 SVG / 动效 / Lottie 的能力边界
│        ├─ license.md                 授权要点与红线
│        └─ pitfalls.md                12 条实机踩坑清单
├─ examples/                           契约校验 + ArkTS 模板编译验证脚本
└─ docs/
   ├─ COMPATIBILITY.md                 兼容性声明与验证依据
   ├─ feasibility-report.md            完整可行性调查报告
   └─ screenshots/                     实机截图
```

**6 种样式**：`bold` `bulk` `broken` `linear` `outline` `twotone`
**5 种内置动效**：`float`（浮动） `pulse`（呼吸） `spin`（转一圈·单次） `wiggle`（摇摆） `beat`（心跳）

---

## 验证记录

不是只写文档 —— 契约和模板代码都过了真实校验：

**Bundle 契约**（`node examples/validate-bundle.mjs`，**38/38 通过**）：

| 验证项 | 结果 |
| --- | --- |
| manifest 字段（含 `exports["./package.json"]`、`icon` 体积、兼容性声明） | ✅ |
| patch 形状：单个 `insert`、无改写行、entry id 为插件自有 | ✅ |
| `!!js` 表达式按 loader 的真实作用域求值并解析出目录 | ✅ |
| `resolveSkillRoot()` 找到自带技能、SKILL.md frontmatter 合规 | ✅ |

**ArkTS 模板**（`examples/verify-templates.ps1`）：

| 验证项 | 结果 |
| --- | --- |
| 三个模板塞进真实工程编译 | ✅ `BUILD SUCCESSFUL` |
| 填充型分支（`fillColor`） | ✅ 蓝色实心图标正确渲染 |
| 描边型分支（`colorFilter`） | ✅ 蓝色线框图标正确渲染，双色调保留 |
| SMIL 动效 SVG | ✅ 帧间像素差 4.56%，确实在动 |
| 单次动效 + `onPlayed` 回调 | ✅ 实机日志显示回调真的触发 |
| `@Prop icSize: number \| string` 联合类型 | ✅ `'36vp'` 正常渲染 |
| `@ohos/lottie` 播放 Bodymovin JSON | ✅ 25 fps 正常播放 |

环境：DevEco Studio 26.0.0 · HarmonyOS 6.0.1 (API 21) 模拟器 · DSH `0.2.0-rc.2` · 编译目标 `compatibleSdkVersion 5.0.0(12)`

兼容性声明与依据见 [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md)。

---

## 授权（重要，用之前扫一眼）

**本包的代码**（`lib/` `scripts/` `templates/` `references/` `SKILL.md` 等）：**MIT**，随便用。

**图标**来自 [Iconsax](https://iconsax.io)，适用其 **Free License**。它们在安装后由 `bootstrap.mjs`
从官方 CDN 拉取，**不随包分发**——这正是因为授权要求：

- ✅ 个人 + 商用，不限量，可修改，**不需要署名**
- ✅ 明确允许"嵌入你开发的移动 App"
- ❌ **禁止把图标本体（或改过的版本）当素材再分发 / 转售 / 传素材站**
- ❌ 从其它非官方站点拿图标是不被允许的，**必须从 iconsax.io 或官方渠道获取**
- ❌ 交付 App 二进制没问题，**别把图标源文件打包给客户**
- ⚠️ 官网那 983 个**动效图标是 Pro 付费**资产，免费授权不含，也不允许再分发

> 也就是说：**把图标用在你自己的 App 里完全合规**；
> **把图标打包成"图标库"再公开分发是不合规的**。
> 本包刻意不带图标，就是这个原因 —— 请让使用者自己从官方源初始化。

详见 [skills/harmonyos-ui-icons/references/license.md](skills/harmonyos-ui-icons/references/license.md) 与 [NOTICE.md](NOTICE.md)。

### 如果你 fork 了这个仓库

**不要把 `assets/iconsax/` 或 `assets/iconsax-anim/` 提交上去。**
它们已经写进 [`.gitignore`](.gitignore)（用的是跨层级匹配 `**/assets/iconsax*/`），正常操作不会被误传。

---

## 致谢

- 图标：[Iconsax](https://iconsax.io) by Manuel Rovira
- Lottie 运行时：[OpenHarmony-TPC/lottie](https://gitcode.com/CPF-ApplicationTPC/lottieArkTS)（MIT）
- ArkUI 能力边界参考 OpenHarmony 官方文档仓 [openharmony/docs](https://gitee.com/openharmony/docs)
