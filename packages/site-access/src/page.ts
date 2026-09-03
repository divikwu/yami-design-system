import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { LanguageSquareIcon, Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import type { Site } from "./index";

// This fixed, password-free script is the only script allowed by the gate's CSP.
const themeScript = `(()=>{
const root=document.documentElement;
const key=root.dataset.site==='docsite'?'yami-docsite-theme':'yami-storybook-theme';
const media=matchMedia('(prefers-color-scheme: dark)');
let stored;try{stored=localStorage.getItem(key)}catch{}
let chosen=stored==='dark'||stored==='light';
function apply(dark){
 root.classList.toggle('dark',dark);root.dataset.theme=dark?'dark':'light';root.style.colorScheme=root.dataset.theme;
 const button=document.getElementById('theme-toggle');
 if(button){const label=root.lang==='zh'?(dark?'切换到亮色模式':'切换到暗色模式'):(dark?'Switch to light mode':'Switch to dark mode');button.setAttribute('aria-label',label);button.title=label}
}
apply(chosen?stored==='dark':media.matches);
document.addEventListener('DOMContentLoaded',()=>{
 apply(root.classList.contains('dark'));
 document.getElementById('theme-toggle').addEventListener('click',()=>{
  const dark=!root.classList.contains('dark');chosen=true;apply(dark);try{localStorage.setItem(key,dark?'dark':'light')}catch{}
 });
});
media.addEventListener('change',event=>{if(!chosen)apply(event.matches)});
})();`;
export const themeScriptHash = createHash("sha256").update(themeScript).digest("base64");

// Inline only the gate's brand assets: protected app scripts and data stay private.
// Both apps and this package run two levels below the workspace root.
let branding: { tokens: string; font: string } | undefined;
function readBranding() {
  return branding ??= {
    tokens: fs.readFileSync(path.join(process.cwd(), "../../packages/design-system/generated/tokens.css"), "utf8"),
    font: fs.readFileSync(path.join(process.cwd(), "../../packages/design-system/assets/fonts/GT-Walsheim-Regular.woff2")).toString("base64"),
  };
}

const copy = {
  zh: {
    description: "此站点仅供团队成员访问", label: "访问密码", submit: "进入网站",
    invalid: "密码不正确，请重新输入。", limited: "尝试次数较多，请稍后再试。",
    unavailable: "访问暂未开放，请联系网站负责人。", unavailableTitle: "暂时无法访问",
    logout: "退出后，再次访问需要输入密码。", logoutTitle: "退出访问", back: "返回网站",
    placeholder: "请输入访问密码", switchLanguage: "English",
  },
  en: {
    description: "This site is for team members", label: "Access password", submit: "Enter site",
    invalid: "Incorrect password. Please try again.", limited: "Too many attempts. Please try again shortly.",
    unavailable: "Access is not available yet. Contact the site owner.", unavailableTitle: "Access unavailable",
    logout: "You will need the password to access this site again.", logoutTitle: "Sign out", back: "Return to site",
    placeholder: "Enter your access password", switchLanguage: "中文",
  },
};

const escape = (text: string) => text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

function icon(paths: typeof LanguageSquareIcon) {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">${paths.map(([tag, attrs]) =>
    `<${tag} ${Object.entries(attrs).filter(([key]) => key !== "key").map(([key, value]) => `${key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)}="${escape(String(value))}"`).join(" ")}/>`).join("")}</svg>`;
}

export function accessPage({ site, lang, returnTo, message }: {
  site: Site; lang: "zh" | "en"; returnTo: string; message?: "invalid" | "limited" | "unavailable" | "logout";
}) {
  const text = copy[lang];
  const assets = readBranding();
  const logout = message === "logout";
  const unavailable = message === "unavailable";
  const siteName = site === "docsite" ? (lang === "zh" ? "YAMI 设计系统" : "YAMI Design System") : "YAMI Storybook";
  const title = unavailable ? text.unavailableTitle : logout ? text.logoutTitle : siteName;
  const action = `/__access/${logout ? "logout" : "login"}?${new URLSearchParams({ next: returnTo, lang })}`;
  const languageLink = `/__access/${logout ? "logout" : "login"}?${new URLSearchParams({ next: returnTo, lang: lang === "zh" ? "en" : "zh" })}`;
  const themeLabel = lang === "zh" ? "切换到暗色模式" : "Switch to dark mode";
  return `<!doctype html><html lang="${lang}" data-site="${site}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title === siteName ? siteName : `${title} · ${siteName}`}</title><script>${themeScript}</script><style>
${assets.tokens}
@font-face{font-family:"GT Walsheim";src:url(data:font/woff2;base64,${assets.font}) format("woff2");font-weight:400;font-display:swap}
*{box-sizing:border-box}body{margin:0;background:var(--background-primary);color:var(--text-primary);font-family:var(--font-family-ios);font-size:var(--font-size-body-xl);line-height:var(--space-300)}
main{min-height:100svh;display:grid;place-items:center;padding:var(--space-600) var(--space-300)}
section{width:100%;max-width:400px;padding-block:var(--space-600) var(--space-1000)}
h1{font-family:var(--font-family-serif);font-size:var(--font-size-display-xl);line-height:var(--line-height-display-sm);font-weight:var(--font-weight-normal);margin:0 0 var(--space-150)}
p{margin:0 0 var(--space-300);color:var(--text-secondary)}h1,h1+p{text-align:center}form{display:grid;gap:var(--space-200)}
input{width:100%;height:var(--space-600);padding:var(--space-150);border:var(--stroke-default) solid var(--border-default);border-radius:var(--radius-component-default);background:var(--background-primary);color:var(--text-primary);font:inherit;font-size:var(--font-size-body-md)}
:root:not(.dark) input{--border-default:rgba(0,0,0,0.12)}
input[aria-invalid=true]{border-color:var(--border-attention)}
input:focus{outline:none;border-color:var(--border-focus);box-shadow:inset 0 0 0 calc(var(--stroke-thick) - var(--stroke-default)) var(--border-focus)}
button{height:var(--space-600);width:100%;border:0;border-radius:var(--radius-component-default);background:var(--button-primary);color:var(--text-primary-inverse);font:inherit;cursor:pointer}
button:active{background:var(--button-primary-active)}@media(hover:hover) and (pointer:fine){button:hover{background:var(--button-primary-active)}}
:is(button,a):focus-visible{outline:var(--stroke-thick) solid var(--border-focus);outline-offset:var(--space-025)}
.error{color:var(--text-emphasis);font-size:var(--font-size-body-md);margin:0}
footer{display:flex;justify-content:space-between;margin-top:var(--space-400)}footer>a:only-child{margin-inline:auto}a{display:inline-flex;align-items:center;min-height:var(--space-600);color:var(--text-primary);font-size:var(--font-size-body-md);text-underline-offset:var(--space-050)}
.tools{position:absolute;top:var(--space-100);right:var(--space-200);display:flex;align-items:center;gap:var(--space-050)}
.tools .tool{position:relative;display:inline-flex;align-items:center;justify-content:center;width:var(--space-400);height:var(--space-400);min-height:0;border:0;padding:0;border-radius:var(--radius-button-primary);background:transparent;color:var(--text-primary);text-decoration:none}
.tool::before{content:"";position:absolute;width:var(--space-500);height:var(--space-500);top:50%;left:50%;transform:translate(-50%,-50%)}
.tool svg{display:block;flex:none}.tools .tool:active{background:var(--button-secondary-active)}
@media(hover:hover) and (pointer:fine){.tools .tool:hover{background:var(--button-secondary-active)}}
.sun,.dark .moon{display:none}.dark .sun{display:inline-flex}
</style></head><body><nav class="tools" aria-label="${lang === "zh" ? "显示设置" : "Display settings"}"><a class="tool" href="${escape(languageLink)}" lang="${lang === "zh" ? "en" : "zh"}" aria-label="${text.switchLanguage}" title="${text.switchLanguage}">${icon(LanguageSquareIcon)}</a><button class="tool" id="theme-toggle" type="button" aria-label="${themeLabel}" title="${themeLabel}"><span class="moon">${icon(Moon02Icon)}</span><span class="sun">${icon(Sun03Icon)}</span></button></nav><main><section aria-labelledby="title">
<div class="intro"><h1 id="title">${title}</h1><p>${unavailable ? text.unavailable : logout ? text.logout : text.description}</p></div>
${unavailable ? "" : `<form method="post" action="${escape(action)}">
${logout ? "" : `<input id="password" name="password" type="password" aria-label="${text.label}" placeholder="${text.placeholder}" autocomplete="current-password" autofocus required maxlength="1024" ${message ? 'aria-invalid="true" aria-describedby="error"' : ''}>`}
${message && !logout ? `<p class="error" id="error" role="alert">${text[message]}</p>` : ""}
<button type="submit">${logout ? text.logoutTitle : text.submit}</button></form>`}
${logout ? `<footer><a href="${escape(returnTo)}">${text.back}</a></footer>` : ""}
</section></main></body></html>`;
}
