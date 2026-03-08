/**
 * tweakcc adhoc-patch script — injects jade-cofounder identity and
 * S-Team context into Claude Code system prompts.
 *
 * Uses tweakcc's `helpers.globalReplace` to patch the active Claude Code
 * installation discovered via `tryDetectInstallation`.
 */

import { tryDetectInstallation, readContent, writeContent, helpers } from "tweakcc";

const JADE_IDENTITY_MARKER = "<!-- jade-cofounder-identity -->";

const JADE_IDENTITY_INJECTION = `
${JADE_IDENTITY_MARKER}
You are the **Jade Cofounder** — an AI cofounder embedded inside this
engineering workspace. You lead the 13-seat S-Team council of specialised VP
agents (Engineering, Security, Product, Sales, Marketing, Finance, Data,
Support, Legal, Search, Research, Productivity, and yourself as CEO). You
apply Amazon-style operating principles: OP1/OP2 planning, Working Backwards,
two-pizza teams, one-way / two-way door decisions, and ROTS (Return on Token
Spend). Always act with a cofounder's ownership mindset.
<!-- /jade-cofounder-identity -->
`.trim();

const S_TEAM_CONTEXT = `
<!-- jade-s-team-context -->
Active S-Team seats: CEO (jade-cofounder), CTO (jade-vp-engineering),
CSO (jade-vp-security), CPO (jade-vp-product), CRO (jade-vp-sales),
CMO (jade-vp-marketing), CFO (jade-vp-finance), CDO (jade-vp-data),
CCO (jade-vp-support), CLO (jade-vp-legal), Chief Search Officer
(jade-vp-search), Chief Research Officer (jade-vp-research), Chief
Productivity Officer (jade-vp-productivity).
<!-- /jade-s-team-context -->
`.trim();

/**
 * Apply jade-cofounder identity patch to the detected Claude Code installation.
 */
export async function applyCofounderIdentityPatch(): Promise<void> {
  const installation = await tryDetectInstallation();
  if (!installation) {
    throw new Error(
      "No Claude Code installation detected. Install Claude Code and retry."
    );
  }

  const content = await readContent(installation);

  // Skip if already patched
  if (content.includes(JADE_IDENTITY_MARKER)) {
    return;
  }

  // Inject jade identity after the first occurrence of "You are Claude Code"
  let patched = helpers.globalReplace(
    content,
    "You are Claude Code",
    `You are Claude Code — operating as the Jade Cofounder`
  );

  // Append identity and S-Team context blocks
  patched = `${patched}\n\n${JADE_IDENTITY_INJECTION}\n\n${S_TEAM_CONTEXT}`;

  await writeContent(installation, patched);
}

/**
 * Remove jade-cofounder identity patch from the detected installation.
 */
export async function removeCofounderIdentityPatch(): Promise<void> {
  const installation = await tryDetectInstallation();
  if (!installation) {
    return;
  }

  const content = await readContent(installation);
  if (!content.includes(JADE_IDENTITY_MARKER)) {
    return;
  }

  // Revert the brand rename
  let restored = helpers.globalReplace(
    content,
    "You are Claude Code — operating as the Jade Cofounder",
    "You are Claude Code"
  );

  // Strip identity and S-Team blocks
  restored = restored
    .replace(/\n\n<!-- jade-cofounder-identity -->[\s\S]*?<!-- \/jade-cofounder-identity -->/g, "")
    .replace(/\n\n<!-- jade-s-team-context -->[\s\S]*?<!-- \/jade-s-team-context -->/g, "");

  await writeContent(installation, restored);
}
