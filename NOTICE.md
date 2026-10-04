# NOTICE — 第三方内容与授权

## 0. 一句话说清：本仓库为什么不带图标

Iconsax 的免费授权允许你把图标用在 App 里，但**不允许把图标本体（含修改过的版本）再分发**。
所以本公开仓库**只放工具、不放图标**：

| 内容 | 在仓库里？ | 怎么获得 |
| --- | --- | --- |
| `scripts/` `templates/` `references/` `SKILL.md` `README.md` | ✅ 在 | — |
| `catalog/iconsax-free-index.json`（只是 URL 索引，不是图形） | ✅ 在 | — |
| `assets/iconsax/**` `assets/iconsax-anim/**`（图形本身） | ❌ **不在** | clone 后跑 `node scripts/bootstrap.mjs` 从官方 CDN 拉取 |

如果你 fork 了这个仓库，**请不要把 `assets/iconsax/` 提交上去**。它们已在 `.gitignore` 里。

---

## 1. 图标

`assets/` 下的图形素材（由 `bootstrap.mjs` 生成）来自 **Iconsax**。

- 官网：https://iconsax.io
- 应用：https://app.iconsax.io
- 作者：Manuel Rovira
- 授权：**Iconsax Free License**
- 授权原文：https://docs.iconsax.io/license-and-terms/license

### 你被允许做的

- 用于**个人和商业**项目，不限量
- **修改、组合**图标
- **嵌入你开发的移动 App / 软件**
- **不需要署名**（例外：把图标作为"数字商品"的一部分分发时要署名）

### 你不被允许做的

- **再分发图标本体**（散图或打包都不行）
- 转售、再授权
- 把图标（或修改后的版本）当素材上传到素材站、或作为"改进版图标集"公开发布
- **从非官方站点获取图标**（授权明确要求从 iconsax.io 或其官方插件下载）
- 把图标源文件打包交给客户（App 二进制不受此限）

### 关于动效图标

Iconsax 官网的 **983 个动效图标是 Pro 付费资产**（Lottie / Bodymovin JSON 格式），
**不在免费授权范围内**，因此本仓库**不包含任何 Iconsax 官方动效文件**。

`bootstrap.mjs` 生成的动效 SVG（默认 3249 个），是用本仓库的
[`scripts/make-animated-svg.mjs`](scripts/make-animated-svg.mjs)
给**免费静态图标**注入 SVG SMIL 动画生成的。按上面"修改与组合"的条款属于衍生作品，
同样适用于"不可再分发"的限制。

---

## 2. 代码（`scripts/` `templates/` `references/` `SKILL.md` `README.md`）

原创，**MIT License**，见 [LICENSE](LICENSE)。

---

## 3. 参考的第三方项目

| 项目 | 用途 | 授权 |
| --- | --- | --- |
| [Iconsax](https://iconsax.io) | 图标素材（运行时拉取，不随仓库分发） | Iconsax Free License |
| [OpenHarmony-TPC/lottie](https://gitcode.com/CPF-ApplicationTPC/lottieArkTS) | Lottie 运行时（文档中提及，未随仓库分发） | MIT |
| [openharmony/docs](https://gitee.com/openharmony/docs) | ArkUI 能力边界的事实来源 | Apache-2.0 |
