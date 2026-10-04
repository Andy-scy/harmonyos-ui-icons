/**
 * Host half of the harmonyos-ui-icons skill bundle.
 *
 * The bundle contributes no Host service and no tools: `cordis.patch.yml`
 * mounts the host-provided filesystem skill provider pointed at this package's
 * `skills/` directory, and everything else in the skill is plain files the
 * agent reads (SKILL.md, scripts, templates, references) plus the icons it
 * fetches with those scripts.
 *
 * `apply` therefore intentionally does nothing. It exists so the package has a
 * valid plugin export form and so `resolveSkillRoot` has a home for callers
 * that need the packaged skill directory (tests, tooling, diagnostics).
 */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

export const name = 'harmonyos-ui-icons';
export const PACKAGE_NAME = 'harmonyos-ui-icons';

/**
 * Resolve the bundled skill root of this package.
 *
 * Anchors on the installed npm identity resolved from the given DSH profile
 * base URL, so it works from a profile install, a git install, and a linked
 * workspace alike. Never build this path by concatenating onto `baseUrl`.
 *
 * @param {string} profileBaseUrl Loader `baseUrl`, i.e. the DSH profile directory
 * @returns {string} absolute path to the packaged `skills/` directory
 */
export function resolveSkillRoot(profileBaseUrl) {
  if (!profileBaseUrl) {
    throw new Error('harmonyos-ui-icons: missing DSH profile baseUrl for package resolution');
  }
  let manifestPath;
  try {
    manifestPath = createRequire(profileBaseUrl).resolve(`${PACKAGE_NAME}/package.json`);
  } catch (error) {
    throw new Error(
      `harmonyos-ui-icons: cannot resolve ${PACKAGE_NAME}/package.json from the DSH profile`,
      { cause: error },
    );
  }
  return join(dirname(manifestPath), 'skills');
}

export function apply() {}
