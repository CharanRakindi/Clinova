// Clinova uses a single light theme — no dark mode.
// This is a passthrough provider to keep the import intact in main.jsx.
export function ThemeProvider({ children }) {
  return children;
}
