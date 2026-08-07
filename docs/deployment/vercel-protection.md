# Vercel deployment protection gate

No font, logo, photography or AI secret may enter a deployment until both
projects are private and protected.

The Vercel team uses the Hobby plan and will not purchase Advanced Deployment
Protection. Both projects therefore use Standard Protection and a preview-only
deployment policy.

| Project | Root directory | Required protection and release policy |
| --- | --- | --- |
| `yami-design-system` | `apps/canvas` | Standard Protection; protected Preview deployments only |
| `yami-design-system-storybook` | `apps/storybook` | Standard Protection; protected Preview deployments only |

Automatic Git deployments are disabled in each app's `vercel.json`. A Preview
deployment must be started manually after separate user authorization. Do not
create or promote a Production deployment while the project remains on this
policy, because Standard Protection excludes production domains.

Before the first asset-bearing deployment, verify anonymous requests to the
Canvas, Storybook and font URLs must reject anonymous access. Neither project
receives an AI secret: Codex or Kiro creates a Direction Manifest locally, and
Canvas validates imported JSON.

Creating/linking projects, setting secrets and deploying remain separate user
authorization steps.
