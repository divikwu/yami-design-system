# Vercel deployment policy

The Vercel team uses the Hobby plan and will not purchase Advanced Deployment
Protection. Canvas and Storybook therefore run as public Production deployments;
Standard Protection continues to cover eligible Preview URLs but does not make
the Production aliases private. Docsite follows the same manual policy when its
separate project is created and promoted.

| Project | Root directory | Production alias | Release policy |
| --- | --- | --- | --- |
| `yami-design-system` | `apps/canvas` | `yami-design-system.vercel.app` | Public, manual deployment |
| `yami-design-system-storybook` | `apps/storybook` | `yami-design-system-storybook.vercel.app` | Public, manual deployment |
| `yami-design-system-docsite` | `apps/docsite` | Set from the authorized `SITE_URL` | Planned public, manual deployment |

Each created Vercel project is connected to `divikwu/yami-design-system`, with root
directories matching the table above. Automatic Git deployments remain disabled
in each app's `vercel.json`, so the connection records repository provenance but
a push to GitHub does not update either site. Every Preview or Production
deployment must be started manually after separate user authorization and must
identify the deployed commit.

No project receives an AI secret: Codex or Kiro creates a Direction
Manifest locally, and Canvas validates imported JSON.

The public deployments currently include assets whose migration records permit
private protected distribution only. Public deployment does not establish
redistribution rights. This remains an unresolved release risk until the assets
are replaced, split from the public repository and deployment, or separately
cleared by the rights holder. See
[`ADR 003`](../adr/003-public-production-and-manual-deployments.md).

Creating or linking projects, changing deployment policy, setting secrets and
deploying remain separate user-authorization steps.
