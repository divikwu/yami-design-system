import { ProductMediaGallery } from "./ProductMediaGallery";

const images = [
  {
    id: "front",
    src: "https://cdn.yamibuy.net/item/22f1eabda8bc0200d050ebcb1ebdb469_757x757.webp",
    alt: "Torriden Dive In mask box, front view",
  },
  {
    id: "detail",
    src: "https://cdn.yamibuy.net/item/c635ba73e529d262e7b2e25d3a7fb89c_757x757.webp",
    alt: "Torriden Dive In mask packaging detail",
  },
] as const;

export function BasicProductMediaGallery() {
  return <ProductMediaGallery images={images} />;
}
