---
slug: fork-project
title: Getting Started
description: "Fork the main repository into your own downstream project, create an independent local copy, and verify that Storybook renders real UI."
group: start
order: 10
keywords: ["GitHub", "Fork", "downstream project", "origin", "upstream", "Storybook"]
updatedAt: "2026-09-02"
sourceRefs:
  - README.md
  - package.json
  - apps/storybook/package.json
  - packages/design-system/SKILL.md
---

When you first use YAMI locally, Codex or Kiro can help fork and clone the project, install dependencies, and verify Storybook. The process should use an independent directory without affecting the main project, existing files, or services owned by other tasks.

## Choose how to start

| Your goal | How to begin | Download required |
| --- | --- | --- |
| Inspect components, standards, or page examples | Open the Storybook provided by your team | No |
| Create or edit a page with AI | Complete the one-time setup below | Yes |

The following workflow is for people who need to build pages locally. You do not need to fork and install the project again for every new task.

## Prepare before you begin

Have these three details ready:

- Main YAMI project: `https://github.com/divikwu/yami-design-system`.
- The GitHub account or organization you are authorized to use.
- A full path to a new local directory, such as `/Users/<your-name>/workspace/yami-design-system`.

Do not put a GitHub password, access token, or other secret in the prompt. Sign in and authorize access through GitHub or another team-approved method. If you cannot fork the repository or select the intended owner, contact an administrator instead of creating a public copy to bypass the restriction.

## Copy the prompt

Replace `<full path to a new local directory>` with the location you intend to use, then send the prompt to Codex or Kiro:

```text
Fork the following main YAMI Design System repository into my downstream project:

https://github.com/divikwu/yami-design-system

New local directory: <full path to a new local directory>

Please complete these steps:

1. Confirm the GitHub account currently signed in, without displaying access tokens or other credentials.
2. Fork the repository into my GitHub account without changing the project name.
3. If the fork already exists, do not create another one.
4. Clone my fork into the specified new local directory without overwriting an existing directory.
5. Confirm that my fork is origin and the original main project is upstream.
6. Install project dependencies without deleting or rewriting the lockfile to bypass errors.
7. Run pnpm generate.
8. Start only Storybook. Do not start Canvas, Docsite, or other applications.
9. Open Storybook in a browser and verify that a page and real components render correctly, not only that the server returns HTTP 200.
10. Do not change unrelated files, commit, push, or publish.

When finished, report:

- Downstream GitHub repository URL
- Full local project path
- origin and upstream URLs
- Storybook URL
- Command to start Storybook later
- Story or component that was actually opened
- Page-rendering and browser-console verification results

If you encounter an existing fork, directory conflict, permission issue, dependency error, or occupied port, report it first.
Do not overwrite or delete files, and do not stop services whose owner is unknown or that belong to another task.
```

Always provide an explicit local directory. Phrases such as "download it to the project folder" or "put it on the desktop" do not give AI enough information to avoid overwriting existing work.

## Check the result

Do not accept only "the service is healthy," an HTTP 200 response, or a Storybook URL. The completion report should include:

| Check | Expected result |
| --- | --- |
| GitHub | Current account, fork URL, and confirmation that the fork comes from the correct main project |
| Local copy | Full new directory path, starting commit, and uncommitted-change status |
| Remotes | `origin` points to your fork and `upstream` points to `divikwu/yami-design-system` |
| Generation | `pnpm generate` succeeds without deleting the lockfile to bypass an error |
| Storybook | Actual listener address and the command to start it later |
| Browser | A specific YAMI Story is open, its preview content renders, and no error prevents use |

Also confirm that the Storybook listener belongs to the newly cloned directory rather than another working copy. To start it again later, run this command from the repository root:

```bash
pnpm dev:storybook
```

These results prove only that the environment is usable. They do not mean the code has been reviewed, committed, merged, or published.

## Troubleshooting and next steps

- **The fork already exists**: reuse it and verify its upstream instead of creating another one.
- **The destination directory exists**: stop and report the path; do not overwrite, empty, or silently choose another directory.
- **Permissions or dependencies fail**: preserve the original error and check the account, repository policy, and the project's Node.js, pnpm, and lockfile requirements.
- **The port is occupied**: identify which directory owns the process before acting; do not stop another task's service.
- **The page is blank or components do not render**: inspect the Storybook preview, asset requests, and browser console instead of treating HTTP 200 as completion.

Next, read [Storybook basics](/en/docs/getting-started), then [explore components and pages](/en/docs/browse-components). When you are ready to create a component or page, [start creating](/en/docs/prepare-environment) and choose the matching path.
