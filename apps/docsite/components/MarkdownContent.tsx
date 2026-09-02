import Link from "next/link";
import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import type { ContentHeading } from "../lib/content";
import type { Locale } from "../lib/locales";
import { slugifyHeading } from "../lib/content";
import { CodeBlock } from "./CodeBlock";
import styles from "./MarkdownContent.module.css";

function textFromNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textFromNode(node.props.children);
  return "";
}

export function MarkdownContent({
  markdown,
  locale,
  headings,
}: {
  markdown: string;
  locale: Locale;
  headings: ContentHeading[];
}) {
  const copyLabel = locale === "zh" ? "复制" : "Copy";
  const copiedLabel = locale === "zh" ? "已复制" : "Copied";
  const errorLabel = locale === "zh" ? "复制失败，请重试或手动复制" : "Copy failed. Retry or copy manually.";
  const idsByHeading = new Map(headings.map((heading) => [`${heading.level}:${heading.text}`, heading.id]));

  function headingId(level: 2 | 3, children: ReactNode): string {
    const text = textFromNode(children);
    return idsByHeading.get(`${level}:${text}`) ?? slugifyHeading(text);
  }

  function heading(level: 2 | 3, children: ReactNode) {
    const id = headingId(level, children);
    const Heading = level === 2 ? "h2" : "h3";
    return (
      <Heading id={id} aria-labelledby={`${id}-text`}>
        <span id={`${id}-text`}>{children}</span>
      </Heading>
    );
  }

  const components: Components = {
    h2: ({ children }) => heading(2, children),
    h3: ({ children }) => heading(3, children),
    table: ({ children }) => <div className={styles.tableScroll} role="group" aria-label={locale === "zh" ? "表格，可横向滚动" : "Table, scroll horizontally"} tabIndex={0}><table>{children}</table></div>,
    a: ({ href = "", children }) => {
      if (href.startsWith("http")) {
        return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
      }
      return <Link href={href}>{children}</Link>;
    },
    pre: ({ children }) => {
      const child = Children.toArray(children)[0];
      if (!isValidElement<{ className?: string; children?: ReactNode }>(child)) return <pre>{children}</pre>;
      const language = child.props.className?.replace(/^language-/, "") ?? "";
      const code = textFromNode(child.props.children).replace(/\n$/, "");
      return <CodeBlock code={code} language={language} copyLabel={copyLabel} copiedLabel={copiedLabel} errorLabel={errorLabel} />;
    },
    img: ({ src = "", alt = "" }) => <img src={src} alt={alt} loading="lazy" />,
  };

  return (
    <div className={styles.prose}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} skipHtml>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
