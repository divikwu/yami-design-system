import { HorizontalScrollList } from "./HorizontalScrollList";

const itemStyle = {
  flex: "0 0 152px",
  scrollSnapAlign: "start",
} as const;

export function BasicHorizontalScrollList() {
  return (
    <HorizontalScrollList
      as="ul"
      aria-label="Featured items"
      style={{ display: "flex", gap: 8, margin: 0, padding: 0 }}
    >
      {["One", "Two", "Three", "Four"].map((label) => (
        <li key={label} style={itemStyle}>
          {label}
        </li>
      ))}
    </HorizontalScrollList>
  );
}

export function WithBackgroundHorizontalScrollList() {
  return (
    <HorizontalScrollList
      as="ul"
      surface="card"
      aria-label="Featured items"
      style={{ display: "flex", gap: 8, margin: 0, padding: 12 }}
    >
      {["One", "Two", "Three", "Four"].map((label) => (
        <li key={label} style={itemStyle}>
          {label}
        </li>
      ))}
    </HorizontalScrollList>
  );
}
