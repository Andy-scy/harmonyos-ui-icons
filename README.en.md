# harmonyos-ui-icons

[简体中文](README.md) | **English**

> **DeepSeek Harness skill bundle + HarmonyOS icon toolkit**
> Once installed, the agent in DSH automatically brings this icon capability to HarmonyOS / ArkTS UI work: **assets + tinting + animation + verified pitfalls**, all validated on a real device emulator.

<p>
<img alt="HarmonyOS" src="https://img.shields.io/badge/HarmonyOS-5.0%2B-000000?logo=harmonyos&logoColor=white">
<img alt="ArkTS" src="https://img.shields.io/badge/ArkTS-ArkUI-0A59F7">
<img alt="API" src="https://img.shields.io/badge/API-12%2B-00A870">
<img alt="icons" src="https://img.shields.io/badge/icons-1083%20SVG%20%2B%203249%20animated-E84026">
<img alt="DSH" src="https://img.shields.io/badge/DSH%20bundle-0.2.0--rc.x-8E4EC6">
<img alt="license" src="https://img.shields.io/badge/code-MIT-4C566A">
</p>

---

## ⚠️ Do this first: initialize (no icons without it)

**This package ships zero SVG files.** Iconsax's Free License lets you embed the icons in
your app, but it forbids **redistributing the artwork itself** (including modified versions).
So the public repo carries the tooling only — never the icons.

**The first thing after installing** is to run the bootstrap:

```bash
# <skill-root> is the bundled skill directory, typically:
#   <DSH_HOME>/profiles/<profile>/node_modules/harmonyos-ui-icons/skills/harmonyos-ui-icons
node <skill-root>/scripts/bootstrap.mjs
```

`bootstrap.mjs` will:

1. Pull **181 curated icons × 6 styles = 1083 SVGs** from the official CDN (`https://cdn.iconsax.io`) and decrypt them in place
2. Derive **3249 SMIL-animated variants** from those static SVGs
3. Regenerate `templates/IconsaxCatalog.ets` so the catalog always matches the files on disk

> Needs network access. Takes about a minute. **Idempotent** — an already-initialized set is skipped.

The skill knows this too: its `SKILL.md` makes "Step 0: initialize" a hard prerequisite, and
when it finds `assets/iconsax/` empty it runs `bootstrap.mjs` before touching any icon.

| `assets/iconsax/` state | What to do |
| --- | --- |
| Missing / empty | **Stop and run `scripts/bootstrap.mjs`** |
| Present but missing the icon you need | `node scripts/fetch-icons.mjs --names <name> --out assets/iconsax` |
| Ready | Go ahead and use it |

---

## Install as a DSH skill bundle

This is a standard **DSH bundle**: `package.json` declares `dsh.bundle.patch`, and
`cordis.patch.yml` **adds exactly one row** that mounts DSH's own
`@deepseek-ai/dsh-skill-filesystem`, registering the `skills/` directory this package
carries as a skill root.

```yaml
# cordis.patch.yml — purely additive; no existing entry id is renamed or replaced
- insert:
    - id: harmonyos-ui-icons-skill-filesystem
      name: '@deepseek-ai/dsh-skill-filesystem'
      config:
        providerName: harmonyos-ui-icons
        includeDefaultRoots: false
        bundledSkillDir: !!js ...   # resolved from the installed package identity, to this package's skills/
```

Pick any install path:

**A. Through the DSH plugin manager** (recommended — `plugin_manager` `install_bundle`)

**B. Manually into a profile**

```bash
# inside the profile directory (<DSH_HOME>/profiles/<profile>)
pnpm add harmonyos-ui-icons   # or "harmonyos-ui-icons": "git+https://github.com/Andy-scy/harmonyos-ui-icons.git"
# then add "harmonyos-ui-icons" to that profile package.json's dsh.profile.bundles
```

**C. Skill only** (skip the bundle)

Copy `skills/harmonyos-ui-icons/` into any skill search path, e.g.
`<DSH_HOME>/skills/harmonyos-ui-icons/` or a project's `.dsh/skills/harmonyos-ui-icons/`.

> All three paths still require running `scripts/bootstrap.mjs` once.

Once installed, just mention ArkTS / ArkUI / a HarmonyOS page / a component / a TabBar /
"add an icon" / "build me a HarmonyOS screen" and the skill loads automatically, bringing this
icon set and docs with it.

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
The package also ships the **complete index of all 7,140 free icons** plus a fetch script, so you can
pull any obscure icon with a single command.

---

## How to use it, in three lines

1. **Copy icons**: `assets/iconsax/<style>/<name>.svg` → your `entry/src/main/resources/rawfile/iconsax/`
2. **You must tint them**: every Iconsax SVG is white. Fill-drawn styles (`bold`/`bulk`/`outline`) use
   `Image.fillColor()`; stroke-drawn styles (`linear`/`twotone`/`broken`) use `Image.colorFilter(matrix)`
3. **Animation without Lottie**: `bootstrap.mjs` already generated the animated variants; for other
   effects run `scripts/make-animated-svg.mjs` to inject SMIL

---

## Quick start

```bash
# 1) initialize (fetch + decrypt + generate animations)
node skills/harmonyos-ui-icons/scripts/bootstrap.mjs

# 2) need more icons? 1101 names are available
cd skills/harmonyos-ui-icons
node scripts/fetch-icons.mjs --search chat
node scripts/fetch-icons.mjs --list-categories
node scripts/fetch-icons.mjs --out <project>/entry/src/main/resources/rawfile/iconsax \
  --names home,user,setting --styles bold,linear,twotone

# 3) generate other animation variants
node scripts/make-animated-svg.mjs \
  --in  assets/iconsax \
  --out assets/iconsax-anim \
  --effects float,pulse,spin,wiggle,beat
```

Use it in a page:

```bash
cp skills/harmonyos-ui-icons/templates/Tint.ets            <project>/entry/src/main/ets/common/
cp skills/harmonyos-ui-icons/templates/IconsaxIcon.ets     <project>/entry/src/main/ets/components/
cp skills/harmonyos-ui-icons/templates/IconsaxCatalog.ets  <project>/entry/src/main/ets/model/
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
`IconsaxCatalog.isStrokeStyle()`. Details in
[references/arkui-svg-capability.md](skills/harmonyos-ui-icons/references/arkui-svg-capability.md).

### 3. About Iconsax's "animated icons"

The **983 animated icons on Iconsax's site are Pro-only** (Lottie format). They are not in the free
tier, and the license **forbids redistributing them**. Therefore:

- ❌ This package contains **no** official Iconsax animation files
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

All 12 pitfalls: [references/pitfalls.md](skills/harmonyos-ui-icons/references/pitfalls.md).

---

## Layout

```
harmonyos-ui-icons/                    ← npm package = DSH bundle
├─ package.json                        dsh.bundle.patch + dsh.compatibility.dshReleases
├─ cordis.patch.yml                    one additive insert, mounting dsh-skill-filesystem
├─ lib/index.js                        resolveSkillRoot()
├─ icon.svg                            icon shown by the plugin manager
├─ locale/{en,zh}.json                 title and description shown by the plugin manager
├─ skills/
│  └─ harmonyos-ui-icons/              ← the skill itself
│     ├─ SKILL.md
│     ├─ assets/                       ⚠️ ALL generated by bootstrap.mjs, never committed
│     │  └─ README.md                  why the icons are not in the repo
│     ├─ templates/                    ArkTS templates (Tint / IconsaxIcon / IconsaxCatalog)
│     ├─ catalog/
│     │  ├─ iconsax-free-index.json    index of all 7,140 free icons (1101 names / 34 categories)
│     │  └─ curated-names.json         the curated 181 icon names
│     ├─ scripts/
│     │  ├─ bootstrap.mjs              ★ run once before first use
│     │  ├─ fetch-icons.mjs            on-demand fetch + decrypt from the official CDN
│     │  └─ make-animated-svg.mjs      batch-inject SMIL into static SVGs
│     └─ references/
│        ├─ arkui-svg-capability.md    ArkUI boundaries for SVG / animation / Lottie
│        ├─ license.md                 license rules and red lines
│        └─ pitfalls.md                12 field-tested pitfalls
├─ examples/                           contract check + ArkTS template compile check
└─ docs/
   ├─ COMPATIBILITY.md                 compatibility declarations and their basis
   ├─ feasibility-report.md            full feasibility investigation
   └─ screenshots/                     on-device screenshots
```

**6 styles**: `bold` `bulk` `broken` `linear` `outline` `twotone`
**5 built-in effects**: `float` `pulse` `spin` (one-shot) `wiggle` `beat`

---

## Verification log

Not just docs — both the bundle contract and the template code went through real checks:

**Bundle contract** (`node examples/validate-bundle.mjs`, **38/38 passed**):

| Check | Result |
| --- | --- |
| Manifest fields (incl. `exports["./package.json"]`, `icon` size, compatibility declarations) | ✅ |
| Patch shape: single `insert`, no override row, plugin-owned entry id | ✅ |
| The `!!js` expression evaluated under the loader's real scope, resolving to a real directory | ✅ |
| `resolveSkillRoot()` finds the bundled skill; SKILL.md frontmatter is valid | ✅ |

**ArkTS templates** (`examples/verify-templates.ps1`):

| Check | Result |
| --- | --- |
| The three templates compiled inside a real project | ✅ `BUILD SUCCESSFUL` |
| Fill-drawn path (`fillColor`) | ✅ solid icons rendered correctly in blue |
| Stroke-drawn path (`colorFilter`) | ✅ outlined icons rendered correctly, two-tone preserved |
| SMIL animated SVG | ✅ 4.56% inter-frame pixel delta — it genuinely animates |
| One-shot animation + `onPlayed` callback | ✅ device log shows the callback actually fired |
| `@Prop icSize: number \| string` union type | ✅ `'36vp'` renders fine |
| `@ohos/lottie` playing a Bodymovin JSON | ✅ plays at 25 fps |

Environment: DevEco Studio 26.0.0 · HarmonyOS 6.0.1 (API 21) emulator · DSH `0.2.0-rc.2` · build target `compatibleSdkVersion 5.0.0(12)`

Compatibility declarations and their basis: [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md).

---

## License (skim this before shipping)

**The code in this package** (`lib/` `scripts/` `templates/` `references/` `SKILL.md`, …): **MIT**, do whatever you like.

**The icons** come from [Iconsax](https://iconsax.io) under their **Free License**. They are fetched by
`bootstrap.mjs` from the official CDN after installation and are **not distributed with this package** —
precisely because the license requires it:

- ✅ Personal + commercial, unlimited, modifiable, **no attribution required**
- ✅ Explicitly allows "embedding Free icons in a mobile app or software you develop"
- ❌ **Redistributing the artwork itself (or modified versions) is forbidden** — no resale, no uploads to stock sites
- ❌ Getting icons from non-official sites is not allowed; **use iconsax.io or official channels**
- ❌ Shipping an app binary is fine, but **do not hand the icon source files to a client**
- ⚠️ The 983 **animated icons are a Pro (paid)** asset — not in the free tier, and not redistributable

> In short: **using the icons inside your own app is fully compliant**;
> **repackaging them into an "icon pack" and publishing it is not.**
> That is exactly why this package ships no icons — let users initialize from the official source.

See [skills/harmonyos-ui-icons/references/license.md](skills/harmonyos-ui-icons/references/license.md) and [NOTICE.md](NOTICE.md).

### If you fork this repo

**Do not commit `assets/iconsax/` or `assets/iconsax-anim/`.**
They are covered by [`.gitignore`](.gitignore) using the depth-agnostic pattern
`**/assets/iconsax*/`, so normal use won't leak them.

---

## Credits

- Icons: [Iconsax](https://iconsax.io) by Manuel Rovira
- Lottie runtime: [OpenHarmony-TPC/lottie](https://gitcode.com/CPF-ApplicationTPC/lottieArkTS) (MIT)
- ArkUI capability notes derived from the official [openharmony/docs](https://gitee.com/openharmony/docs) repository
