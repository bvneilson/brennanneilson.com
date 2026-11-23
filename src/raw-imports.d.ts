// `?raw` imports return the file's text (next.config.ts turbopack rule, and Vite natively in tests).
declare module '*.md?raw' {
  const text: string;
  export default text;
}
