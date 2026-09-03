# Vercel deployment policy

The recorded Vercel plan is Hobby, without Advanced Deployment Protection.
Docsite and Storybook now include application-level shared-password protection;
it takes effect only after both projects receive the code and environment configuration.
Canvas remains public. Standard Protection continues to cover eligible Preview
URLs but does not itself make Production aliases private.
See [password setup and deployment verification](./site-password.md).

| Project | Root directory | Production alias | Release policy |
| --- | --- | --- | --- |
| `yds-prototype` | `apps/canvas` | `yds-prototype.vercel.app` | Public, automatic Git deployment |
| `yds-storybook` | `apps/storybook` | `yds-storybook.vercel.app` | Password gate after rollout, automatic Git deployment |
| `yds-docsite` | `apps/docsite` | `yds-docsite.vercel.app` | Password gate after rollout, automatic Git deployment |

Each Vercel project is connected to `divikwu/yami-design-system`, with root
directories matching the table above. Each application enables automatic Git
deployments in its `vercel.json`. After this configuration reaches the connected
repository, non-production branch pushes and pull requests can create Preview
deployments, while updates to production branch `main` can create Production
deployments. Vercel records the deployed commit for each release. A successful
push or merge is a trigger, not proof that deployment succeeded.

A downstream Fork needs a separately connected hosting project and a confirmed
production branch. External-fork PRs may require maintainer approval before
building. See [Vercel Git integration](https://vercel.com/docs/git).

No project receives an AI provider secret: Codex or Kiro creates a Direction
Manifest locally, and Canvas validates imported JSON. Docsite and Storybook
require server-only access-password and session-secret environment variables.

The public deployments currently include assets whose migration records permit
private protected distribution only. Public deployment does not establish
redistribution rights. This remains an unresolved release risk until the assets
are replaced, split from the public repository and deployment, or separately
cleared by the rights holder. See
[`ADR 003`](../adr/003-public-production-and-manual-deployments.md).

Creating or linking projects and setting secrets require their own authorization.
For automatic deployments, confirm the destination and release intent before the
push or merge that triggers deployment; honor existing explicit authorization.
Changing local configuration does not establish that a hosted deployment has run.
