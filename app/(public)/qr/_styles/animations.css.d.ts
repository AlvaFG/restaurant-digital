// TypeScript declaration for CSS module import
// This suppresses the "Cannot find module" error when importing CSS files
declare module '*.css' {
  const content: Record<string, string>
  export default content
}
