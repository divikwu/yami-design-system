import { ThemeProductList } from "./ThemeProductList";
import { createThemeProductListProps } from "./fixtures";

export const ThemeProductListExample = () => (
  <ThemeProductList {...createThemeProductListProps()} />
);
