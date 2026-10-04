# harmonyos-ui-icons

[简体中文](README.md) | **English**

> **Icon toolkit + AI skill for HarmonyOS / ArkTS apps (Iconsax free set)**
> Everything you need for icons in a HarmonyOS UI: **assets + tinting + animation + verified pitfalls**, all validated on a real device emulator.

<p>
<img alt="HarmonyOS" src="https://img.shields.io/badge/HarmonyOS-5.0%2B-000000?logo=harmonyos&logoColor=white">
<img alt="ArkTS" src="https://img.shields.io/badge/ArkTS-ArkUI-0A59F7">
<img alt="API" src="https://img.shields.io/badge/API-12%2B-00A870">
<img alt="icons" src="https://img.shields.io/badge/icons-1083%20SVG%20%2B%203249%20animated-E84026">
<img alt="license" src="https://img.shields.io/badge/code-MIT-8E4EC6">
</p>

---

## ⚠️ Do this first: initialize (no icons without it)

**This repository ships zero SVG files.** Iconsax's Free License lets you embed the icons
in your app, but it forbids **redistributing the artwork itself** (including modified versions).
So this public repo carries the tooling only — never the icons.

The **first thing** after cloning is to run the bootstrap (let your agent do it, or run it yourself):

```bash
git clone https://github.com/Andy-scy/harmonyos-ui-icons.git
cd harmonyos-ui-icons
node scripts/bootstrap.mjs          # ★ REQUIRED: fetch + decrypt SVGs from the official Iconsax CDN
```

`bootstrap.mjs` will:

1. Pull **181 curated icons × 6 styles = 1083 SVGs** from the official CDN (`https://cdn.iconsax.io`) and decrypt them in place
2. Derive **3249 SMIL-animated variants** from those static SVGs
3. Regenerate `templates/IconsaxCatalog.ets` so the catalog always matches the files on disk

> Needs network access. Takes about a minute.

**Same deal when installed as a DSH skill** — the skill checks `assets/iconsax/` before doing anything,
and runs `bootstrap.mjs` first if it is empty.

| `assets/iconsax/` state | What to do |
| --- | --- |
| Missing / empty | **Stop and run `node scripts/bootstrap.mjs`** |
| Present but missing the icon you need | `node scripts/fetch-icons.mjs --names <name> --out assets/iconsax` |
| Ready | Go ahead and use it |

---

## What this is

Four things that remove the icon friction from HarmonyOS UI work:

| | |
| --- | --- |
| 🎨 **Icon assets** | 181 common UI icons × 6 styles = **1083 SVGs** (fetched locally and decrypted by the bootstrap), ready to drop into `rawfile/` |
| ✨ **Animated icons** | **3249 SMIL-embedded variants** (float / pulse / wiggle) that ArkUI's `Image` component **plays natively** — zero dependencies |
| 🧩 **ArkTS templates** | `IconsaxIcon` / `Tint` / `IconsaxCatalog` — **compile-verified and device-verified** |
| 📚 **Pitfall docs** | ArkUI's SVG capability boundaries, the two tinting paths, license red lines, 12 field-tested pitfalls |

Icons come from [Iconsax](https://iconsax.io)'s **free tier** (181 commonly used picks out of 7,140 free icons).
The repo also ships the **complete index of all 7,140 free icons** plus a fetch script, so you can pull any
obscure icon with a single command.

---

## How to use it, in three lines

1. **Copy icons**: `assets/iconsax/<style>/<name>.svg` → your `entry/src/main/resources/rawfile/iconsax/`
2. **You must tint them**: every Iconsax SVG is white. Fill-drawn styles (`bold`/`bulk`/`outline`) use
   `Image.fillColor()`; stroke-drawn styles (`linear`/`twotone`/`broken`) use `Image.colorFilter(matrix)`
3. **Animation without Lottie**: run `scripts/make-animated-svg.mjs` to inject SMIL into the SVGs

---

## Quick start

### 1. Install as a DeepSeek Harness skill (recommended)

The repo root *is* an installable DSH skill:

```powershell
git clone https://github.com/Andy-scy/harmonyos-ui-icons "$env:DSH_HOME\skills\harmonyos-ui-icons"

# ★ Critical: initialize after installing, otherwise the skill has no icons
node "$env:DSH_HOME\skills\harmonyos-ui-icons\scripts\bootstrap.mjs"
```

> The skill knows this too — its `SKILL.md` makes "Step 0: initialize" a hard prerequisite.
> When it finds `assets/iconsax/` empty, it runs `bootstrap.mjs` before touching any icon.

Once installed, just mention ArkTS / ArkUI / a HarmonyOS page / a component / a TabBar / "add an icon" /
"build me a HarmonyOS screen" and the skill loads automatically, bringing this icon set and docs with it.

### 2. Or use it as a plain icon pack

```bash
# ★ Initialize first (fetch + decrypt + generate animations)
node scripts/bootstrap.mjs

# Need more icons? 1101 names are available
node scripts/fetch-icons.mjs --search chat
node scripts/fetch-icons.mjs --list-categories
node scripts/fetch-icons.mjs --out .../rawfile/iconsax --names home,user,setting --styles bold,linear,twotone

# Generate other animation variants
node scripts/make-animated-svg.mjs \
  --in  assets/iconsax \
  --out assets/iconsax-anim \
  --effects float,pulse,spin,wiggle,beat
```

### 3. Use it in a page

```bash
# Copy the three templates into your project
cp templates/Tint.ets            <project>/entry/src/main/ets/common/
cp templates/IconsaxIcon.ets     <project>/entry/src/main/ets/components/
cp templates/IconsaxCatalog.ets  <project>/entry/src/main/ets/model/
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
        strokeArtwork: IconsaxCatalog.isStrokeStyle(this.style)   // ← essential, don't hardcode
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

## Screenshots

Running on a HarmonyOS 6.0.1 (API 21) emulator:

| Fill-drawn `bold` → `fillColor` | Stroke-drawn `twotone` → `colorFilter` |
| --- | --- |
| ![bold](docs/screenshots/shot-01-bold-static.jpeg) | ![twotone](docs/screenshots/shot-02-twotone-static.jpeg) |

| SMIL animation frame diff (it really moves) | Lottie playback |
| --- | --- |
| ![smil](docs/screenshots/shot-04-float-diff.png) | ![lottie](docs/screenshots/shot-06-lottie.jpeg) |

---

## Key findings (all measured, not assumed)

### 1. ArkUI supports SVG natively — **including SVG-embedded animation**

`Image` has supported `svg` since **API 7**, covering a subset of SVG 1.1.
For animation, the official docs explicitly support `<animate>` and `<animateTransform>`:

> Only a **single element's** property or transform animation is supported; animations must not be
> nested between elements.

Which means: **"icons that move" need no Lottie-style runtime at all** — just put SMIL inside the
free static SVG. One-shot animations even fire `Image.onFinish()` when they complete.

### 2. Tinting needs two different paths (this is where people get burned)

| API | Official wording | Use for |
| --- | --- | --- |
| `fillColor(color)` | "replaces the **fill** color of all drawable elements in the SVG" | fill-drawn artwork |
| `colorFilter(matrix)` | "for SVG sources, only takes effect when a **stroke** attribute is set (with or without a value)" | stroke-drawn artwork |

Iconsax's 6 styles split exactly along that line, which is why the API has
`IconsaxCatalog.isStrokeStyle()`. Details in [references/arkui-svg-capability.md](references/arkui-svg-capability.md).

### 3. About Iconsax's "animated icons"

The **983 animated icons on Iconsax's site are Pro-only** (Lottie format). They are not in the free
tier, and the license **forbids redistributing them**. Therefore:

- ❌ This repo contains **no** official Iconsax animation files
- ✅ Its 3249 animated SVGs are generated by `make-animated-svg.mjs` injecting SMIL into **free static icons**

---

## Five rules you must remember

| # | Rule |
| --- | --- |
| 1 | **The icons are white — you must tint at runtime**, or they are invisible on a light theme |
| 2 | **Fill-drawn uses `fillColor`, stroke-drawn uses `colorFilter`** — one code path cannot cover both |
| 3 | **A custom component's `@Prop` must not be named `scale`/`size`/`rotate`/`translate`** — it collides with `CustomComponent`; this library uses an `ic` prefix |
| 4 | **Project paths must not contain non-ASCII characters** — hvigor refuses to build |
| 5 | **ArkUI's SVG parser understands neither CSS (`<style>`/classes) nor `<text>`** |

All 12 pitfalls: [references/pitfalls.md](references/pitfalls.md).

---

## Layout

```
harmonyos-ui-icons/
├─ SKILL.md                          Skill definition (triggers + workflow)
├─ assets/                           ⚠️ ALL generated by bootstrap.mjs, never committed
│  ├─ README.md                      Why the icons are not in the repo
│  ├─ iconsax/<style>/<name>.svg     1083 static SVGs          ← generated
│  └─ iconsax-anim/<fx>/<style>/<name>.svg   3249 SMIL SVGs    ← generated
├─ templates/                        ArkTS templates (Tint / IconsaxIcon / IconsaxCatalog)
├─ catalog/
│  ├─ iconsax-free-index.json        Index of all 7,140 free icons (1101 names / 34 categories)
│  └─ curated-names.json             The curated 181 icon names
├─ scripts/
│  ├─ bootstrap.mjs                  ★ Run once before first use
│  ├─ fetch-icons.mjs                On-demand fetch + decrypt from the official CDN
│  └─ make-animated-svg.mjs          Batch-inject SMIL into static SVGs
├─ references/
│  ├─ arkui-svg-capability.md        ArkUI boundaries for SVG / animation / Lottie
│  ├─ license.md                     License rules and red lines
│  └─ pitfalls.md                    12 field-tested pitfalls
├─ examples/                         Verification example page + repro script
└─ docs/
   ├─ feasibility-report.md          Full feasibility investigation
   └─ screenshots/                   On-device screenshots
```

**6 styles**: `bold` `bulk` `broken` `linear` `outline` `twotone`
**5 built-in effects**: `float` `pulse` `spin` (one-shot) `wiggle` `beat`

---

## Verification log

Not just docs — the template code itself went through a real compile and a real device run:

| Check | Result |
| --- | --- |
| The three `templates/` ArkTS files compiled inside a real project | ✅ `BUILD SUCCESSFUL` |
| Fill-drawn path (`fillColor`) | ✅ solid icons rendered correctly in blue |
| Stroke-drawn path (`colorFilter`) | ✅ outlined icons rendered correctly, two-tone preserved |
| SMIL animated SVG | ✅ 4.56% inter-frame pixel delta — it genuinely animates |
| One-shot animation + `onPlayed` callback | ✅ device log shows the callback actually fired |
| `@Prop icSize: number \| string` union type | ✅ `'36vp'` renders fine |
| `@ohos/lottie` playing a Bodymovin JSON | ✅ plays at 25 fps |

Environment: DevEco Studio 26.0.0 · HarmonyOS 6.0.1 (API 21) emulator · build target `compatibleSdkVersion 5.0.0(12)`

Repro script: [examples/verify-templates.ps1](examples/verify-templates.ps1).

---

## License (skim this before shipping)

**The code in this repo** (`scripts/` `templates/` `references/` `SKILL.md` `README.md`, …): **MIT**, do whatever you like.

**The icons** come from [Iconsax](https://iconsax.io) under their **Free License**. They are fetched by
`bootstrap.mjs` from the official CDN and are **not distributed with this repo** — precisely because the
license requires it:

- ✅ Personal + commercial, unlimited, modifiable, **no attribution required**
- ✅ Explicitly allows "embedding Free icons in a mobile app or software you develop"
- ❌ **Redistributing the artwork itself (or modified versions) is forbidden** — no resale, no uploads to stock sites
- ❌ Getting icons from non-official sites is not allowed; **use iconsax.io or official channels**
- ❌ Shipping an app binary is fine, but **do not hand the icon source files to a client**
- ⚠️ The 983 **animated icons are a Pro (paid)** asset — not in the free tier, and not redistributable

> In short: **using the icons inside your own app is fully compliant**;
> **repackaging them into an "icon pack" and publishing it is not.**
> That is exactly why this repo ships no icons — let users initialize from the official source.

See [references/license.md](references/license.md) and [NOTICE.md](NOTICE.md).

### If you fork this repo

**Do not commit `assets/iconsax/` or `assets/iconsax-anim/`.**
They are already covered by [`.gitignore`](.gitignore) so normal use won't leak them.
Have your users run `node scripts/bootstrap.mjs`; it is compliant and guarantees they get the
latest official files.

---

## Credits

- Icons: [Iconsax](https://iconsax.io) by Manuel Rovira
- Lottie runtime: [OpenHarmony-TPC/lottie](https://gitcode.com/CPF-ApplicationTPC/lottieArkTS) (MIT)
- ArkUI capability notes derived from the official [openharmony/docs](https://gitee.com/openharmony/docs) repository
