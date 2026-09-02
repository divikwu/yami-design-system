import { Tag } from "./Tag";

const matchaImage = new URL(
  "../Header/assets/search-suggestions/matcha.png",
  import.meta.url,
).href;

export function ContentFilledTagExample() {
  return (
    <section data-example="ContentFilledTagExample">
      <Tag context="content" mode="light" variant="filled">
        Heartleaf Botanical
      </Tag>
    </section>
  );
}

export function ContentOutlineTagExample() {
  return (
    <section data-example="ContentOutlineTagExample">
      <Tag context="content" mode="light" variant="outline">
        Gentle Daily Formulas
      </Tag>
    </section>
  );
}

export function ImageTagExample() {
  return (
    <section data-example="ImageTagExample">
      <Tag
        context="content"
        image={{ src: matchaImage, alt: "" }}
        mode="light"
        size="l"
        variant="filled"
      >
        Matcha
      </Tag>
    </section>
  );
}

export function OverlayFilledTagExample() {
  return (
    <section
      data-example="OverlayFilledTagExample"
      style={{
        padding: "var(--space-300)",
        background: "var(--color-black-900)",
      }}
    >
      <Tag context="overlay" mode="dark" variant="filled">
        Targeted Active Care
      </Tag>
    </section>
  );
}

export function OverlayOutlineTagExample() {
  return (
    <section
      data-example="OverlayOutlineTagExample"
      style={{
        padding: "var(--space-300)",
        background: "var(--color-black-900)",
      }}
    >
      <Tag context="overlay" mode="dark" variant="outline">
        Barrier Support
      </Tag>
    </section>
  );
}
