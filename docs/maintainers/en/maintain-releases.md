# Maintain upstream versions

For upstream maintainers and release owners. Start with a focused, verified PR. Deliver a traceable shared revision, change notes, and update instructions that Fork owners can follow.

## Separate three activities

| Activity | What changes | What it does not prove |
| --- | --- | --- |
| Merge upstream source | The upstream branch contains the capability | Hosted Storybook has been updated. |
| Deploy a preview or site | A target environment runs an agreed commit | Every Fork has synchronized. |
| Adopt an update in a Fork | One project has integrated and verified upstream changes | Other projects are automatically compatible. |

The component library currently uses private workspace source packages. Changesets and registry metadata are not a completed remote npm publishing or automatic-update platform. Identify the actual code baseline by commit, not only a displayed version number.

## Review shared changes

1. Confirm the contribution matches an accepted capability scope without business content or unrelated work.
2. Compare implementation, Usage, metadata, and Story for consistent defaults, states, and public exports.
3. Assess effects on existing consumers from prop, token, interaction, and visual changes.
4. Check evidence, generated files, accessibility, both languages, and target viewport coverage.
5. Confirm asset permissions for the target environment and remove unapproved business information from previews.

Review the latest PR diff and its CI results. Screenshots or test results from an earlier revision are not evidence for the current one.

## Record versions and compatibility

Use the repository's existing Changesets tooling for shared-package changes. Run from the repository root:

```bash
pnpm changeset
pnpm changeset:status
```

The first command interactively creates a change record; the second reports pending change status. Select the affected packages and agree on the change level with the maintainer. Neither command automatically deploys a site.

The current configuration disables automatic changelogs and commits, and ignores the Canvas and Storybook application packages. Owners must still record application deployment status and complete migration instructions rather than assuming tooling handles them.

At minimum, describe:

- What was fixed or added, and the affected components and consumers.
- Whether existing props and defaults are preserved or business pages need changes.
- Visual, interaction, or data-shape differences, even when types still pass.
- The recommended upstream commit, migration steps, known limits, and rollback baseline.

For breaking effects, agree on migration and verification scope before merging. Alpha status is not a reason to omit impact information.

## Verify and merge

Run `pnpm validate` on the final changes, adding Storybook browser tests, builds, documentation-index checks, and relevant visual or end-to-end checks for the scope. Required project CI checks must also pass.

Automated checks do not replace a real preview. Use fixed data for key scenarios and record the tested languages, themes, viewports, and results. Do not report untested states as passing.

An authorized maintainer merges after review, diff confirmation, and merge approval, then records the final upstream commit. Do not let AI interpret green checks as permission to merge or deploy.

## Arrange deployment separately

Storybook, Canvas, and Docsite all configure automatic Git deployments. Once the configuration takes effect in the connected repository, non-production pushes or PRs can trigger Preview, and updates to production branch main can trigger Production. Approve the release before the triggering push or merge; AI must still wait for deployment and verify the live page. A fork needs its own hosting connection rather than automatically receiving a preview environment.

Before deployment, confirm the project, environment, source commit, owner, access scope, asset permissions, and rollback version. Afterwards, open the real page, verify rendering and key interactions, and record the URL and running revision.

This guide uses a private collaboration model, but a private code repository does not make a deployed site private. If existing deployment policy does not match the required access scope, have the owner resolve access before publishing confidential content to a public preview.

## Notify Fork owners

Use the following information in a team update. Each project owner chooses an adoption time appropriate to current work.

```text
Upstream update: [scope and problem solved]
Recommended baseline: [commit]
Affected components: [list]
Compatibility: [no call changes / migration required, with steps]
Verification entry: [approved preview and fixed-data details]
Project checks: [key pages and interactions]
Known limits: [details]
Owner and feedback channel: [details]
Rollback baseline: [previously verified commit]
```

Every Fork must check its own pages after adoption. Maintaining a shared upstream does not make its owner responsible for deploying every project.

## Recover from a problem

First stop further adoption of the affected revision and record the impact and current deployments without overwriting others' work.

Maintainers address source problems through a reviewed fix or revert PR. A deployed site requires separate authorization to restore a previously verified revision. Forks retain their own verified baseline and recheck their pages after recovery.

Do not default to force synchronization or rewriting shared history. Record the restored commit, environment, verification results, and follow-up owner.

## Common questions

**Does passing CI mean the change is live?** No. Review and a merge decision are still required, and deployment is a separately authorized operation.

**Does a Changeset mean an npm package was published?** No. The current workflow shares workspace source; it does not promise remote installation or automatic upgrades.

**Do documentation-only changes need deployment?** Local files, GitHub source, and hosted sites are separate states. Updating a hosted page still follows the deployment workflow.

## Next step

Give project owners the update notes so they can [sync upstream and resolve conflicts](../../../apps/docsite/content/docs/en/sync-upstream.md). For project-page deployment, continue to [Deploy and hand off](../../../apps/docsite/content/docs/en/deliver-publish.md).
