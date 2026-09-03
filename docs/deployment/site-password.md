# Docsite 与 Storybook 密码保护

Docsite 和 Storybook 保持独立部署，共用访问密码，各自保存登录状态。
两站复用 `packages/site-access` 的服务端校验，使用 `iron-session` 加密会话，
无需建立用户数据库。登录有效期为 7 天；更换访问密码或会话密钥后，旧会话失效。

## 配置并部署

在两个 Vercel 项目的 **Settings → Environment Variables** 中分别配置：

| 变量 | 内容 |
| --- | --- |
| `YAMI_SITE_PASSWORD` | 两个项目填写相同的随机访问密码，至少 8 个字符 |
| `YAMI_SESSION_SECRET` | 每个项目独立生成的随机会话密钥，至少 32 个字符 |

为 **Production 和 Preview** 都设置变量；不要使用 `NEXT_PUBLIC_` 或 `VITE_` 前缀，
不要将真实密码写入 Git、构建命令、文档或日志。使用密码管理器生成并保存随机值。

目标项目和根目录：

- Docsite：`yami-design-system-docsite`，`apps/docsite`。
- Storybook：`yami-design-system-storybook`，`apps/storybook`。

变量配置完成后，将本次改动部署到两个项目。Docsite 使用 Next.js Proxy；
Storybook 的 `vercel.json` 注册 Node.js Routing Middleware。
Node.js 使用仓库要求的 24.x。保留 Vercel 对根目录外共享文件的构建支持。
部署环境缺失密码或密钥、长度不合要求时，服务返回 503，不会开放内容。
构建成功不代表已经配置密码，也不代表线上保护已经生效。

### 连续尝试限制

代码包含每个运行实例、每个来源 IP 每分钟最多 8 次的登录尝试限制。
这是额外防护，**不能作为跨实例的全局限流**：无服务器实例扩容或重启会重置计数。

上线时还应在两个项目的 Vercel Firewall 中，为 `POST /__access/login` 配置
按来源 IP 限制的速率规则：Fixed Window，60 秒，8 次，超限返回 429。
官方目前为 Hobby 每个项目提供 1 条速率规则；先确认该额度是否已经被其他规则使用。
平台计数按区域进行，并非所有区域共用一个计数器，但不依赖应用实例的生命周期。
配置后应验证实际拦截效果。不要把进程内计数描述为已经实现了分布式防暴力破解。

## 本地预览

复制各应用的 `.env.example` 为 `.env.local`，填写仅供本地测试的密码和密钥。
不要覆盖已有环境变量文件；已有文件只补充这两个变量。

- Docsite：`pnpm dev:docsite`，配置变量后重启开发服务。
- Storybook：先 `pnpm --filter @yami/storybook build`，再
  `pnpm --filter @yami/storybook preview:protected`，打开 `http://127.0.0.1:6007`。

Docsite 未配置两个变量时，仅本地 development 模式开放访问。
Storybook 原来的 `pnpm dev:storybook` 是本地组件开发服务，不执行 Vercel 的密码入口；
不能把该开发端口作为对外受保护站点。`preview:protected` 仅监听本机，
执行和线上相同的 Storybook Proxy，并从构建目录提供内容。

## 验收

- 在无痕窗口访问两个正式域名、部署域名和需要共享的 Preview 地址，均先要求密码。
- 未登录直接请求 Docsite 文档、搜索、RSC 响应、Skill 原文以及静态文件，无法取得内容。
- 未登录直接请求 Storybook `iframe.html`、`index.json`、Story JS、图片及页面直达地址，无法取得内容。
- 密码错误不会设置登录 Cookie；连续尝试能触发 429，线上还需验证 Firewall 的速率规则。
- 正确登录后回到原页面，Docsite 导航、搜索、语言切换以及 Storybook 预览与 Controls 均正常。
- 密码页右上角可切换语言与亮暗模式；首次跟随系统，手动选择后在当前站点保留。Docsite 与正文共用主题偏好。
- HTTPS 会话使用 `Secure`、`HttpOnly`、`SameSite=Lax` 和不带 Domain 的 `__Host-` Cookie。
- Docsite 与 Storybook 的页面工具栏均不显示退出入口。
- 修改密码并重新部署后，旧 Cookie 不能继续访问。两站密码要同步修改。
- 检查受保护响应的浏览器和 CDN 缓存策略为 `no-store`；发布后用新窗口复查旧的公共缓存入口。

保护在接入本次代码的部署上生效。历史公共部署不会被代码更新追溯保护；
上线前需要删除或通过平台关闭仍可访问的旧部署链接。
已经被访问者下载的文件无法通过退出或更改密码收回。
Docsite 的保护不涵盖其他部署项目或 GitHub 仓库。

## Implementation reference

- `packages/site-access`: shared Web Request/Response gate, localized standalone form, encrypted sessions.
- `apps/docsite/proxy.ts`: every request, including framework and content routes.
- `apps/storybook/proxy.ts`: all static Storybook requests via Vercel Routing Middleware. The Storybook build bundles this source to `dist/proxy.js`, loaded by the checked-in `vercel-proxy.js` entrypoint, so Vercel does not resolve workspace TypeScript exports at runtime. A standalone Node smoke test verifies the bundle before the static site builds.
- `apps/storybook/scripts/preview-protected.ts`: loopback-only production-preview adapter.
- `pnpm --filter @yami/site-access test`: access boundary, cookie rotation/expiry, CSRF, redirects and attempt limits.
- After building both apps, `pnpm --filter @yami/docsite test:access` starts isolated local
  production previews and checks real browser login, protected content, interaction, logout and mobile forms.
  Its public test credentials are local fixtures only; never copy them into Vercel.
- Existing Docsite production E2E and Lighthouse checks sign in using local test fixtures.
  Lighthouse requires `noindex` for protected pages; the public-site SEO score is advisory.

The password form contains no protected application scripts or data. A fixed, CSP-hashed
inline script controls appearance; it never reads the password or session. Its tokens
and font are read from the canonical design-system assets and embedded in the response.
These two files must be present in the deployed server bundle; check the deployment trace.
This is application-level protection, not Vercel's paid Password Protection feature.

References: [Vercel Routing Middleware](https://vercel.com/docs/routing-middleware),
[Vercel Firewall rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting),
[iron-session](https://github.com/vvo/iron-session).
