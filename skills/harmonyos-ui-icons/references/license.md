# Iconsax 授权要点（用之前先看这一页）

> 原文：https://docs.iconsax.io/license-and-terms/license
> 抓取留档：`iconsax-research/license-clean.txt`（在用户工作区）

## 一句话

**免费那批（7,140 个静态图标）可以随便用在你的 App 里，商用、免署名、可修改。
但禁止把图标本身当成素材再分发；而"动效图标"根本不在免费范围内。**

## 1. 免费授权（ICONSAX FREE LICENSE）

| 维度 | 规定 |
| --- | --- |
| 费用 | 免费 |
| 使用者 | **1 人（个人）** |
| 有效期 | 永久 |
| 用途 | **个人 + 商用，不限量**，可集成进最终产品 |
| 修改 / 组合 | **允许**，随便改 |
| 署名 | **不需要**（例外见下） |
| 数字商品（UI Kit / 模板 / 主题 / 框架） | 允许，但必须是"功能性资源"而非产品主体，且**强制署名** |
| 转售 / 再授权 | **禁止** |
| 再分发图标本体（散图或打包） | **禁止** |

**官方明确列为"可以做"的**（Cheat Sheet 原文）：
- "Using Free icons on your commercial website or personal blog **without adding attribution**"
- "Creating a logo for your brand or a client's brand using Free icons (modifying or combining them)"
- "**Embedding Free icons in a mobile app or software you develop** for a client (that isn't a redistributable digital product)"
- 在源码里集成免费图标并按规则分发

**官方明确列为"不可以"的**：
- 把图标（免费或付费）声明为自己的作品，或原样上传到素材站
- 把免费图标改一改就当单个素材卖
- 把图标（散图或包）上传到 Envato Elements / Iconfinder / NounProject 等
- 用在不正当内容里

> 对鸿蒙开发的实际含义：**把免费 SVG 放进你的 App 是合规的**。
> 不合规的是：把图标打包成"鸿蒙图标库"再发布出去。

## 2. 动效图标是 Pro 专属

定价页与前端代码双重确认：

| | 免费 | Pro（$9.99/月） |
| --- | --- | --- |
| 图标数量 | 7,000（只有 rounded 一种外形 × 6 种样式） | 44,250（+ 直角外形） |
| 格式 | SVG / PNG / WebP | + 字体 |
| **动效图标（Lottie）** | ❌ | ✅ 1,000 个 |
| 保存项目 | ❌ | ✅ |

前端判定逻辑（从 app.iconsax.io 的 bundle 里读到）：

```js
const isAnimated = props.item.url.includes("/jsons/");   // 动效是 Lottie JSON
if (props.item.tier !== "free" || isAnimated) {          // 动效一律进这个分支
  if (!access.loggedIn) { startAuth(); return; }         // 先登录
  if (!access.isPro)     { NOTI("Solo para usuarios Pro"); return; }   // 再要 Pro
}
```

**所以要动效有两条正路**：
1. 买 Pro（拿到官方那 983 个 Lottie 文件）
2. 自己给免费静态 SVG 加 SMIL（本 skill 的 `make-animated-svg.mjs` 就是干这个的，完全原创、零授权风险）

## 3. 其它注意事项

- **只从官方渠道拿图标**。授权文档里特意写了："Always downloading icons from iconsax.io or our official plugins to ensure the correct license"，
  以及"Assuming you can use the icons in the same way if you find them on an unofficial site"属于 ❌。
  本 skill 的 `fetch-icons.mjs` 直接打的是官方 CDN `cdn.iconsax.io`，与官网下载的是同一份文件。
- **不要附带源文件给客户**。授权 Cheat Sheet 明确把"Give Client Premium SVG Folder 'Just in Case'"列为 ❌。
  交付 App 二进制没问题，交付图标源文件包不行（免费图标虽然宽松，但也建议按同样尺度的习惯来）。
- 免费授权限"1 名使用者"。团队多人协作要买 Team Plan。
