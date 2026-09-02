---
slug: fork-project
title: Create your own fork
description: "Create an authorized team fork, connect an independent local working copy, and verify the upstream source."
group: collaboration
order: 90
keywords: ["fork", "permissions", "working copy", "origin", "upstream"]
updatedAt: "2026-08-31"
sourceRefs:
  - README.md
  - packages/design-system/package.json
  - docs/adr/003-public-production-and-manual-deployments.md
  - docs/deployment/vercel-protection.md
---

A fork is a separate repository connected to an upstream project you are authorized to access. A local working copy is a folder on your computer; creating a fork does not create that folder.

This guide assumes the team has approved a private upstream with authorized forks. It does not mean administrators have finished configuration. Start from the owner's link, not another project with a similar name.

## Before you start

Ask the administrator for:

- The confirmed upstream URL and the GitHub account you should use.
- The personal account or organization that should own your fork; do not choose an unapproved location.
- The team allowed to access the code and assets, and a contact for permission issues.

Private fork availability and access depend on upstream and organization settings and the account plan. A private fork is not a personal vault visible only to its creator. Have an administrator check inherited access. See [GitHub's fork permission reference](https://docs.github.com/en/pull-requests/reference/forks).

If the Fork button or approved organization is unavailable, check policy first. Do not bypass the restriction by making a public copy.

## Create the team fork

1. Open the upstream URL with the approved account and check its owner and name.
2. Confirm that its visibility matches the administrator-approved private arrangement.
3. Select **Fork** and choose the approved **Owner**.
4. Follow the team's naming agreement; the default branch `main` is usually enough to start.
5. Confirm that the new repository identifies the correct upstream project.
6. Record the fork URL in your task notes; it is not a page preview URL.

For current interface details, use [GitHub's fork creation guide](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/fork-a-repo). Do not upload business assets if visibility differs from the team's agreement.

## Connect a local working copy

You can ask Codex or an engineering partner to handle this step:

```text
Help me connect a team-authorized fork.
Upstream URL: <address provided by the administrator>
My fork: <address of the fork I created>
Local location: <a new working directory reserved for me>
Check for existing files or Git changes first; do not overwrite them.
Confirm that origin points to my fork and upstream to the upstream project.
Only prepare the connection. Do not change business files, commit, push, or deploy.
```

Replace placeholders with actual addresses and a directory. Never paste access tokens or passwords into the prompt. Authenticate through the team's approved method.

If a directory already exists, check which project owns it. Do not treat a colleague's folder as your fork or erase existing files to start again.

`origin` names your remote fork; `upstream` names the source of shared updates. A remote name does not prove that its URL is correct: check the actual owner and repository.

## Verify the setup

Ask your collaborator to summarize these read-only checks. Do not post terminal records containing credentials in team conversations:

```bash
git status --short --branch
git remote -v
git rev-parse HEAD
```

You should have the correct folder, no unexplained changes, the correct remote addresses, and a recorded starting commit SHA.

If existing work appears, confirm who owns it and how it will be preserved. Do not switch or overwrite branches before resolving that question.

Completing this page does not mean the app runs or that shared previews are available. Follow [Prepare your environment](/en/docs/prepare-environment) for installation and startup.

## When something goes wrong

- **You can read upstream but cannot fork it**: ask the administrator to check policy and the target owner; do not change access settings yourself.
- **The fork exists but no files are on your computer**: clone it into an independent folder.
- **origin points upstream**: pause pushes and have your collaborator verify and correct the remote configuration.
- **A colleague cannot access the fork**: ask the administrator to check authorization; preview access is a separate check.
- **You need to change accounts or leave the team**: arrange handoff and local data handling with the owner; remote access changes do not automatically clean your computer.

## Next step

Continue to [Prepare your environment](/en/docs/prepare-environment), or [Start and manage a task](/en/docs/manage-tasks) if your environment is ready.
