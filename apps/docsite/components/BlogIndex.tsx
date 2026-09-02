"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@yami/design-system";
import { useState } from "react";

import type { BlogFrontmatter } from "../lib/content-schema";
import { BlogCard, type BlogCardData } from "./BlogCard";
import styles from "./BlogIndex.module.css";

export interface BlogListPost extends BlogCardData {
  category: BlogFrontmatter["category"];
}

type Filter = "all" | BlogFrontmatter["category"];

export function BlogIndex({
  posts,
  labels,
}: {
  posts: BlogListPost[];
  labels: { all: string; categories: Record<BlogFrontmatter["category"], string> };
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const filters: Filter[] = ["all", "update", "design", "engineering"];

  return (
    <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
      <TabsList variant="tertiary" aria-label={labels.all}>
        {filters.map((value) => (
          <TabsTrigger key={value} value={value}>
            {value === "all" ? labels.all : labels.categories[value]}
          </TabsTrigger>
        ))}
      </TabsList>
      {filters.map((value) => {
        const filtered = value === "all" ? posts : posts.filter((post) => post.category === value);
        const [feature, ...rest] = filtered;
        return (
          <TabsContent key={value} value={value} className={styles.panel}>
            {feature ? <BlogCard post={feature} feature /> : null}
            {rest.length > 0 ? (
              <div className={styles.grid}>
                {rest.map((post) => <BlogCard key={post.slug} post={post} />)}
              </div>
            ) : null}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
