import { BrandProductRail } from "./BrandProductRail";
import {
  brandProductRailCopy,
  createBrandProductCampaigns,
} from "./fixtures";

export function BrandProductRailExample() {
  const copy = brandProductRailCopy.zh;

  return (
    <BrandProductRail
      title={copy.title}
      mobileTitle={copy.mobileTitle}
      campaigns={createBrandProductCampaigns("zh")}
      tabs={copy.tabs.map((label, index) => ({
        value: `category-${index + 1}`,
        label,
      }))}
      viewAllHref="/collections/beauty-trends"
      viewAllLabel={copy.viewAll}
      previousLabel={copy.previousLabel}
      nextLabel={copy.nextLabel}
      /* The compact card's quick-add button only renders when a handler is
       * passed — omit this and the rail ships without it. */
      onAddToCart={() => {}}
    />
  );
}
