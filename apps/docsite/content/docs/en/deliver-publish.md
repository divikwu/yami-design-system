---
slug: deliver-publish
title: Deploy and hand off
description: "Use AI for Vercel setup, preview updates, production releases, and handing off your work."
group: collaboration
order: 110
keywords: ["Vercel", "deployment", "preview", "release", "handoff", "Storybook"]
updatedAt: "2026-09-03"
sourceRefs:
  - apps/storybook/package.json
  - apps/storybook/vercel.json
  - docs/deployment/vercel-protection.md
---

After checking your page locally, use this guide to deploy and hand off your work. It uses Storybook in your own YAMI fork; choose the prompt for what you need now.

## Choose what to do

| What you need | Continue here |
| --- | --- |
| Get your first hosted URL | [First deployment to Vercel](#first-deployment) |
| Show team members an updated version | [Update previews automatically](#update-previews-automatically) |
| Update the live URL after review | [Publish the approved version](#publish-the-approved-version) |
| Let a team member continue editing | [Hand off to a team member](#hand-off-to-a-team-member) |

## What to prepare

- **Your GitHub repository:** the fork created during [Getting Started](/en/docs/fork-project).
- **Vercel account or team:** where the deployment belongs; provide the project name or link if one exists.
- **Content to share:** your local project directory and specific page or Story name.
- **Audience:** team members only or public access.

You sign in and complete account authorization; AI handles project configuration and builds. Do not paste passwords or tokens into the prompt. A `localhost` address belongs to your computer; deployment provides a URL team members can access.

## First deployment

Ask AI to guide you through these steps:

1. Create or select your own Vercel project and connect the specified GitHub fork.
2. Select Storybook. Its directory in this repository is `apps/storybook`; AI should check the build command, output directory, and shared package dependencies so it deploys the intended application.
3. Confirm the content, branch, and audience, then start the build. An initial import may create a Production deployment for that project; AI should explain which URL it will update.
4. Wait until deployment is ready, open the specific Story, check images and main interactions, and return the sharing link.

Replace the details below and send this to Codex or Kiro:

```text
Deploy my YAMI Storybook to Vercel and connect GitHub automatic deployments.
Local project: <directory>
GitHub repository: <my fork URL>
Vercel: <existing project URL, or account / team for a new project>
Page to share: <Story name or local page URL>
Audience: <team members only / public access allowed>

- Check existing connections and configure apps/storybook, handling only this task and preserving other changes.
- Once ready, explain the content, destination, audience, and whether this is a Production deployment; get my confirmation before committing, pushing, and deploying.
- Give me specific steps when sign-in or authorization is needed; report unsupported access requirements rather than making the site public.
- After deployment, open the page and check its display and main interactions. Return project and page links with check results.
```

Your fork needs its own Vercel connection; upstream configuration does not create a hosting project for you. A private repository does not automatically make its deployed website private. Check the actual [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection) settings.

## Update previews automatically

Once Git deployments are connected, ask AI to push changes to the specified task branch. Vercel creates a Preview according to project settings. Production-branch updates trigger Production deployments, so use a non-production task branch for reviews. See [Vercel Git deployments](https://vercel.com/docs/git).

```text
Update the page preview for this Vercel project.
Local project: <directory>
Vercel project: <project URL>
Changes and page: <requirements and Story name or URL>

- Complete the changes and local checks, preserving accepted content and other tasks' work.
- Verify the connected repository and find or create a non-production task branch; once checks pass, you are authorized to push only these changes for a preview deployment.
- Do not update the live site.
- After deployment, open the page and check its content and main interactions.
- Return the page link for this deployment, its version, changes, and unresolved issues.
```

A branch preview link updates with deployments. To review a fixed version, share that deployment's URL with the specific Story entry point.

## Publish the approved version

After review, use this prompt to update the live URL. Ask AI to verify the project’s production branch; do not assume the fork main branch used for upstream updates is the business release target. This prompt authorizes publication to the specified destination:

```text
Publish the approved version to the live site.
Approved version or review record: <link or location>
Target project and live URL: <specify both>
Release scope: <pages or changes>

- Verify the version, production branch, and deployment settings. Include only this release and preserve other work.
- Once checks pass, follow the repository process to commit, push, and merge into the target production branch for automatic deployment; report unclear targets, failed checks, or conflicts with uncertain impact before proceeding.
- After deployment, verify the live version and open the page to check main interactions.
- Return the live URL, release version, check results, and unresolved issues.
```

If production deployment fails, ask AI to retain the error and previous working URL, explain a recovery plan, and follow the owner's authorization. Do not silently replace snapshots with live requests or include other tasks in the release.

## Hand off to a team member

You can hand off a task before it is finished. Ask AI to commit this task's code, assets, and handoff notes on a separate handoff branch and push it to the specified GitHub repository. Your team member gives their AI the repository, branch, and commit links to fetch that version and continue. Review approval is not required for this work-in-progress handoff.

**Share your current progress:**

```text
Push this unfinished task to GitHub so a team member can take over.
Local project: <directory>
Target GitHub repository: <repository URL>
Task goal: <intended final result>
Remaining requirements: <what still needs to be done>

- Prepare only this task's code and required assets, preserving other work; write handoff notes covering progress, remaining work, startup steps, and the page entry point.
- Record check results and known issues accurately, and label this as unfinished work.
- Create a separate non-production handoff branch, then commit and push the code, assets, and notes.
- Do not merge into main or update the live site.
- Report any triggered preview's actual status without requiring it to succeed for handoff.
- Verify GitHub contains this commit and return handoff branch, commit, and handoff notes links.
```

A local commit alone is not available to team members on GitHub. Confirm the push completed and the recipient can read the repository. Send them the links AI returned; they can use the following prompt.

**Take over and continue:**

```text
Take over this unfinished task and continue building it.
Handoff version: <GitHub commit URL>
Handoff notes: <file path or link>
Requirements: <what to complete next>

- Fetch and verify the specified version in a separate directory, read the handoff notes, and preserve existing local work.
- Create a continuation branch, install dependencies, and start the page; report and address any blocker that prevents it from running.
- Make the requested changes, preserve accepted content, check the result, and update the handoff notes.
- Return changes, the page entry point, and check results; push to a specified destination when another handoff is requested.
```

## Check deployment and handoff

- **Deployment or release:** AI has confirmed deployment succeeded, opened the specific Story to check its content, and verified recipients can access it as agreed.
- **Work-in-progress handoff:** the specified GitHub branch contains the handoff version; the team member can fetch the same code and understand completed work, remaining tasks, and its current running state.

Send the link with the questions you want team members to answer. For a failed build, ask AI to inspect deployment logs. For an inaccessible URL, check access settings. For outdated content, verify the deployment version and Story entry point.

## Next step

Use [Review a page](/en/docs/review-checklist) for local checks and [Update components and pages](/en/docs/sync-upstream) for shared updates. Shared capability improvements follow [Share components and pages](/en/docs/contribute-upstream).
