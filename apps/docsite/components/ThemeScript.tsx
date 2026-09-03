"use client";

import { useServerInsertedHTML } from "next/navigation";
import { useRef } from "react";

const themeScript = `(function(){try{var k="yami-docsite-theme";var s=localStorage.getItem(k);var d=s==="dark"||(s!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.dataset.theme=d?"dark":"light";r.style.colorScheme=d?"dark":"light"}catch(e){}})()`;

export function ThemeScript() {
  const inserted = useRef(false);

  // Bootstrap before body content on full loads, never during client navigation.
  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return <script id="yami-theme" dangerouslySetInnerHTML={{ __html: themeScript }} />;
  });

  return null;
}
