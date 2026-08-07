import {
  Controls,
  Description,
  Markdown,
  Primary,
  Stories,
  Subtitle,
  Title,
  useOf,
} from "@storybook/addon-docs/blocks";
import { useEffect, useState } from "react";

const usageModules = import.meta.glob(
  "../../../packages/design-system/components/*/usage.md",
  {
    import: "default",
    query: "?raw",
  },
) as Record<string, () => Promise<string>>;

function normalizeComponentName(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function componentNameFromUsagePath(filePath: string) {
  return filePath.match(/\/components\/([^/]+)\/usage\.md$/)?.[1];
}

const usageByComponent = new Map(
  Object.entries(usageModules).flatMap(([filePath, loadUsage]) => {
    const componentName = componentNameFromUsagePath(filePath);
    return componentName
      ? [[normalizeComponentName(componentName), loadUsage] as const]
      : [];
  }),
);

function getUsageLoaderForTitle(title: string) {
  const componentName = title.split("/").at(-1) ?? title;
  return usageByComponent.get(normalizeComponentName(componentName));
}

export async function loadUsageForTitle(title: string) {
  return getUsageLoaderForTitle(title)?.();
}

export function formatUsageMarkdown(markdown: string) {
  return markdown.replace(/^#\s+(.+)\n+/, "## $1\n\n");
}

export function ComponentDocsPage() {
  const { csfFile, preparedMeta } = useOf("meta", ["meta"]);
  const usageLoader = getUsageLoaderForTitle(preparedMeta.title);
  const [usage, setUsage] = useState<string>();
  const isSingleStory = Object.keys(csfFile.stories).length === 1;

  useEffect(() => {
    let isCurrent = true;
    setUsage(undefined);

    void usageLoader?.().then((markdown) => {
      if (isCurrent) setUsage(markdown);
    });

    return () => {
      isCurrent = false;
    };
  }, [usageLoader]);

  return (
    <>
      <Title />
      <Subtitle />
      <Description of="meta" />
      {isSingleStory ? <Description of="story" /> : null}
      <Primary />
      <Controls />
      {usage ? (
        <section data-yami-docs="usage">
          <Markdown>{formatUsageMarkdown(usage)}</Markdown>
        </section>
      ) : usageLoader ? (
        <p aria-live="polite" data-yami-docs="loading">
          Loading usage guide…
        </p>
      ) : null}
      {isSingleStory ? null : <Stories />}
    </>
  );
}
