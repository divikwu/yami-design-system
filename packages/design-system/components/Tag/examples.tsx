import { Tag } from "./Tag";

export function DarkTagExample() {
  return (
    <section data-example="DarkTagExample">
      <Tag tone="dark">Heartleaf Botanical</Tag>
    </section>
  );
}

export function LightTagExample() {
  return (
    <section
      data-example="LightTagExample"
      style={{
        padding: "var(--space-300)",
        background: "var(--color-black-900)",
      }}
    >
      <Tag tone="light">Targeted Active Care</Tag>
    </section>
  );
}

export function DarkOutlineTagExample() {
  return (
    <section data-example="DarkOutlineTagExample">
      <Tag tone="dark-outline">Gentle Daily Formulas</Tag>
    </section>
  );
}

export function LightOutlineTagExample() {
  return (
    <section
      data-example="LightOutlineTagExample"
      style={{
        padding: "var(--space-300)",
        background: "var(--color-black-900)",
      }}
    >
      <Tag tone="light-outline">Barrier Support</Tag>
    </section>
  );
}
