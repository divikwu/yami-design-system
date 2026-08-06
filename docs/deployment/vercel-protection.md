# Vercel deployment protection gate

No font, logo, photography or AI secret may enter a deployment until both
projects are private and protected.

| Project | Root directory | Required protection |
| --- | --- | --- |
| `yami-canvas` | `apps/canvas` | All Deployments + Vercel Authentication |
| `yami-canvas-storybook` | `apps/storybook` | All Deployments + Vercel Authentication |

Before the first asset-bearing deployment, verify anonymous requests to the
Canvas, Storybook and font URLs must reject anonymous access. Neither project
receives an AI secret: Codex or Kiro creates a Direction Manifest locally, and
Canvas validates imported JSON. Preview and production use the same protection
level.

Creating/linking projects, setting secrets and deploying remain separate user
authorization steps.
