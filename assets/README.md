# assets/ — 图标资产（由脚本生成，不进版本库）

**这个目录里的图标文件不会被提交到 Git。**

Iconsax 的免费授权允许你把图标用在 App 里，但**不允许把图标本体（或其修改版本）再分发**。
所以公开仓库里只放工具，不放图标——clone 之后需要**先初始化**。

## 初始化

```bash
node scripts/bootstrap.mjs
```

这一步会：

1. 从 Iconsax 官方 CDN（`https://cdn.iconsax.io`）拉取 **181 个精选 UI 图标 × 6 种样式 = 1083 个 SVG**，并现场解密
2. 基于这些静态 SVG 生成 **3249 个内嵌 SMIL 的动效变体**
3. 重新生成 `templates/IconsaxCatalog.ets`，保证目录和实际文件对得上

跑完之后目录结构是：

```
assets/
├─ iconsax/<style>/<name>.svg                    # 1083 个静态图标
└─ iconsax-anim/<fx>/<style>/<name>.svg          # 3249 个动效变体
```

## 常用变体

```bash
node scripts/bootstrap.mjs --all                      # 拉全部 7,140 个免费图标（约 11 MB）
node scripts/bootstrap.mjs --no-anim                  # 只拉静态图标
node scripts/bootstrap.mjs --effects float,pulse      # 只生成指定动效
node scripts/bootstrap.mjs --names home,user,setting  # 只要这几个图标
node scripts/bootstrap.mjs --force                    # 已有资产也重新拉
```

## 为什么不用别的方式分发图标

如果你 fork 了这个仓库，**请不要把 `assets/iconsax/` 和 `assets/iconsax-anim/` 提交上去**。
让使用者自己跑 `bootstrap.mjs` 从官方源获取，既合规、又能保证拿到的是最新且未被篡改的文件。
详见仓库根目录的 [`NOTICE.md`](../NOTICE.md)。
