# Narrow provenance review

October 19, 2026. Scope: dlv, eastasianwidth, react-remove-scroll-bar, copied UI components/hooks, and the unused ICO. Only public upstream sources and local repository/package files were inspected. No production service or data access, dependency installation, asset deletion, or history rewrite occurred.

## Package evidence

All three locked npm tarballs were inspected in memory and their bytes verified against package-lock.json integrity hashes. None contains a license/notice file. Their metadata declares MIT. This is stronger than simply failing to find a file in node_modules, but does not reconstruct missing historical notice text.

| Package | Identifiable evidence and action | Remaining limit |
| --- | --- | --- |
| dlv 1.1.3 | Exact package identifies Jason Miller as author and declares MIT. README at npm gitHead `e636db817a96e4ca4710b407163fb992748b3b80` links an MIT notice for developit at oss.ninja. Attribution and the source link are preserved in THIRD_PARTY_NOTICES.md. | The license link redirects to unrelated content. [The author's oss.ninja source](https://github.com/developit/oss.ninja/blob/master/src/lib/ossninja-worker.js) confirms template generation/GitHub profile lookup, but no original rendered copyright header or year was recovered. No header was invented. |
| eastasianwidth 0.2.0 | Exact package identifies Masaki Komagata and declares MIT. [Upstream added MIT-LICENSE.txt in 2024](https://github.com/komagata/eastasianwidth/commit/1d41951a59d63fb2d77cda021050fc070cae424a); its complete notice is retained verbatim, with `Copyright komagata`. The README's takenspc attribution is also retained. | The later notice was not shipped in the older tarball. Source at the license-introduction commit is not byte-identical to the installed version. The original article's complete licensing terms have not been verified. |
| react-remove-scroll-bar 2.3.8 | Exact package identifies Anton Korzunov and declares MIT. [Upstream added LICENSE on May 21, 2025](https://github.com/theKashey/react-remove-scroll-bar/commit/7301c160fda44cb8cf2b9fdfde61efad35736196); its complete notice is retained verbatim. | Upstream package.json at that commit says 2.3.7. Published gitHead `b3b1287aad81def2e2ae707274b74531b61ddbaf` and the attempted v2.3.8 tag were unavailable. The notice is supplemental upstream evidence, not claimed to be recovered from the 2.3.8 tarball. |

MIT metadata is not evidence of an incompatible license. Conversely, this review is not an exhaustive legal clearance or a claim that missing historic copyright text has been reconstructed. For complete historical provenance, obtain authoritative clarification for the specific gaps above; changing dependencies is outside this narrow pass.

## Copied components and hooks

`components.json` identifies shadcn/ui's default style. Local initial-commit versions of 48 UI TSX files, two hooks, and `src/lib/utils.ts` were compared against the default registry at official shadcn/ui commit [1081536246b44b6664f4c99bc3f1b3614e632841](https://github.com/shadcn-ui/ui/tree/1081536246b44b6664f4c99bc3f1b3614e632841/apps/www/registry/default), a snapshot before the local project's creation.

Nine of 51 compared files matched after whitespace/semicolon/quote/client-directive normalization; the remaining files had substantial structural similarity. This supports the identified shadcn derivation but is not proof of the exact original import revision or a line-by-line authorship certification. Current local modifications are preserved. The full shadcn MIT notice remains in THIRD_PARTY_NOTICES.md.

The official `hooks/use-toast.ts` credits react-hot-toast as inspiration; the local copy omitted that comment. A source attribution comment was restored, and a pinned upstream react-hot-toast MIT notice was retained conservatively. This does not claim that every hook line was copied directly from react-hot-toast. No runtime behavior changed.

## public/favicon.ico

- Present in initial commit `9060711`; unchanged in the local Git history and current working tree.
- Size: 20,373 bytes.
- SHA-256: `dd821076a9b03adc2173c93956226aea3d92482d7578fc4339c5d3a2e9c24586`.
- Current index.html declares an inline SVG favicon rather than referencing this ICO. The ICO still lives in Vite's public directory and remains distributable with ordinary builds.
- No source credit, creator, license, or authoritative upstream byte match was established. Inclusion in the initial Lovable-generated project does not by itself establish asset permission. No claim is made about the depicted artwork or its creator.

**Proposed decision, not applied:** establish permission/source for the ICO, or approve removing the unreferenced ICO from the current tree to avoid including it in future builds. The HTML favicon would remain the existing inline SVG. No asset was removed or replaced. Removal would not erase Git history or establish permission for past copies; no history rewrite is proposed. Original Lovable generation/session records may help resolve this.

## Publication assessment

No new technical blocker was found. The prior build, typechecks, lint, and 35 tests passed; this pass changes documentation and an attribution comment only, so those commands were not rerun. Documentation consistency and Git diff checks were run instead.

The repository is already public, but the local prepared changes have not been published. Do not equate that existing visibility with complete rights clearance. I cannot mark provenance fully cleared: the ICO's rights are unknown, and the historical notice/source limits above remain. Resolve the ICO decision and review outstanding rights/resource declarations before representing the repository as fully cleared for publication/submission. Exact import revision uncertainty alone does not establish that shadcn's preserved MIT notice is insufficient.

## Owner statements versus inspection

The owner confirms the selected 22 estimated hours are genuinely intended work and that invitations and stored content contain only their own information or fictional data. These confirmations are recorded in ROADMAP.md, README.md, and the Labelbox draft as owner statements, not independently audited facts. They do not establish facts about unseen service logs/backups or whether any excluded regulated data is processed.
