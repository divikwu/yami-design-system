/**
 * Ambient declaration for CSS Modules.
 *
 * Lets TypeScript typecheck `import styles from './Foo.module.css'` in
 * component sources. The actual class-name shape is opaque at TS level;
 * runtime resolution is handled by the bundler (Vite, Next.js, etc.)
 * in the consuming app.
 *
 * When the consuming app uses `typescript-plugin-css-modules` or
 * similar, it may provide stricter per-file types that supersede this.
 */

declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>
  export default classes
}
