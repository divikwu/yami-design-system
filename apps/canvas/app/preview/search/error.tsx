"use client";

export default function SearchPreviewError({ reset }: { reset: () => void }) {
  return (
    <main className="placeholder-route" data-slot="search-preview-error">
      <span>Catalog unavailable</span>
      <h1>Preview data could not be loaded.</h1>
      <p>The selected data source failed explicitly. Try again or switch to a snapshot scenario.</p>
      <button type="button" onClick={reset}>Try again</button>
    </main>
  );
}
