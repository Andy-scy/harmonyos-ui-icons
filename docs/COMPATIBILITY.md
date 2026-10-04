# Compatibility

What this bundle couples to, what was actually verified, and how to re-verify.

## Declared ranges

| Field | Value |
| --- | --- |
| `dsh.engines.dsh` | `>=0.2.0-rc.1 <0.3.0` |
| `engines.node` | `^22.19.0 \|\| >=24.0.0` |

`engines.node` matches the Node floor the DSH runtime itself ships with
(`@deepseek-ai/dsh-skill-filesystem` and the cordis loader both assume an ESM Node
runtime with `node:module` `createRequire` and `process.getBuiltinModule`).

## Per-release declarations

`dsh.compatibility.dshReleases`:

| DSH release | Declared | Basis |
| --- | --- | --- |
| `0.2.0-rc.1` | `compatible` | Same 0.2.0 minor line as the verified release. The bundle's only coupling is the config schema of `@deepseek-ai/dsh-skill-filesystem`, which is unchanged across the 0.2.0 rc series. |
| `0.2.0-rc.2` | `compatible` | **Verified on a real installation** (see below). |
| `0.2.1-alpha.1` | `unknown` | Not obtainable in the verification environment, so no claim is made. Promote to `compatible` after running the checks below against that build. |

A range alone does not satisfy the contract; each listed release carries an explicit
value. Values are `compatible`, `incompatible`, or `unknown`.

## What this bundle actually depends on

The bundle contributes **no Host service, no tools, and no Client code**. Its whole
surface is one added loader row:

```yaml
- insert:
    - id: harmonyos-ui-icons-skill-filesystem
      name: '@deepseek-ai/dsh-skill-filesystem'
      config:
        providerName: harmonyos-ui-icons
        includeDefaultRoots: false
        bundledSkillDir: !!js ...
```

So compatibility reduces to three things:

1. `@deepseek-ai/dsh-skill-filesystem` exists in the DSH runtime and accepts the three
   config keys `providerName`, `includeDefaultRoots`, `bundledSkillDir`.
2. The loader's `!!js` scalars are evaluated with the loader context as their scope, so
   `baseUrl` resolves and `process` falls through to the Node global.
3. The bundled skill satisfies the provider's discovery rules: a directory bundle
   `<name>/SKILL.md` at the top level of the scanned root, with `name` and `description`
   in its YAML frontmatter.

Nothing else in this package runs inside DSH. The `skills/harmonyos-ui-icons/scripts/*.mjs`
files are plain Node programs the agent executes on demand; they are not imported by the
harness.

## Verification performed

`examples/validate-bundle.mjs` runs the contract check without installing anything and
without touching any DSH profile. On the machine used for this release it reports
**38/38 checks passed**, covering:

- manifest fields a bundle needs, including `exports["./package.json"]` (the patch resolves
  the package through `createRequire`), `icon` within the 256 KiB limit, and the
  `dsh.compatibility.dshReleases` values
- patch shape: a single additive `insert`, no override row, plugin-owned entry id, package
  specifier (not a relative path) as `name`
- the `!!js` expression evaluated under the loader's exact scope construction
  (`new Function('ctx','expr','with (ctx) { return eval(expr) }')`) against a simulated
  profile directory, resolving to a real directory that contains the skill
- `lib/index.js` imports, `resolveSkillRoot()` finds the bundled skill, and the bundled
  `SKILL.md` frontmatter satisfies the provider

Note what this does **not** prove: it does not boot DSH, so it does not show the row
activating in a live profile. Install-time activation is verified by the DSH STORE
fixed-commit check and by a real profile install.

### Reproduce

```bash
node examples/validate-bundle.mjs
```

## Environment used

| | |
| --- | --- |
| DSH | `0.2.0-rc.2` (`@deepseek-ai/dsh-desktop-runtime` inside `app.asar`) |
| Host-provided dependency | `@deepseek-ai/dsh-skill-filesystem@0.2.0-rc.2` |
| Loader | `@deepseek-ai/cordis-plugin-loader@1.0.5` |
| Node | `v24.x` |

## Promoting `0.2.1-alpha.1` to `compatible`

1. Install that DSH build.
2. `node examples/validate-bundle.mjs` — must pass.
3. Install the bundle into a disposable profile and confirm the skill appears in the session
   catalog.
4. Update the value in `package.json` and bump `version`.

## Skill-level requirements that are *not* DSH compatibility

The skill itself needs network access the first time it is used, to fetch icons from the
official Iconsax CDN:

```bash
node skills/harmonyos-ui-icons/scripts/bootstrap.mjs
```

That is a property of the skill's contents, not of the DSH ABI, and it is documented in
`README.md`, `README.en.md`, and `skills/harmonyos-ui-icons/SKILL.md`.
