export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#ffcf00', // Neon Yellow-Gold
  TypeScript: '#00b4ff', // Cyan-Blue
  Python: '#4584b6',     // Bright Blue
  Java: '#ff9900',       // Electric Orange
  Rust: '#ff4d00',       // Blaze Orange
  Go: '#00e5ff',         // Electric Cyan
  'C++': '#ff0055',      // Neon Pink
  C: '#80d4ff',          // Light Cyber Blue
  'C#': '#00ff41',       // Matrix Green
  Swift: '#ff3d00',      // Sunset Red
  Kotlin: '#bf00ff',     // Vibrant Purple
  Ruby: '#ff003c',       // Crimson Neon
  PHP: '#777bb4',
  Scala: '#ff2d3f',
  Shell: '#00ff85',      // Mint Neon
  Bash: '#00ff85',
  HTML: '#ff5c00',       // Hot Orange
  CSS: '#bf00ff',        // Purple Neon
  SCSS: '#ff0095',       // Magenta Neon
  Vue: '#42d392',        // Emerald Neon
  Svelte: '#ff3e00',
  Dart: '#00e7ff',
  Elixir: '#a300ff',
  Haskell: '#8f47ff',
  Clojure: '#ff5c5c',
  Lua: '#0000ff',
  R: '#276dc3',
  MATLAB: '#e16737',
  Julia: '#a270ba',
  Perl: '#0298c3',
  OCaml: '#ef7a08',
  Erlang: '#b83998',
  F: '#b845fc',
  'F#': '#b845fc',
  Zig: '#ec915c',
  Nim: '#ffc200',
  Crystal: '#000100',
  Groovy: '#e09f56',
  Terraform: '#844fba',
  Dockerfile: '#00a3ff',
  Makefile: '#44cc11',
  Assembly: '#6e4c13',
  Nix: '#7e7eff',
  Racket: '#3c5caa',
  Elm: '#60b5cc',
  PureScript: '#1d222d',
  Apex: '#1797c0',
  Solidity: '#aa6746',
  Hack: '#878787',
  WebAssembly: '#654ff0',
}

export function getLanguageColor(language: string): string {
  // Use a highly saturated/vibrant HSL for unknown languages
  return LANGUAGE_COLORS[language] || `hsl(${hashCode(language) % 360}, 95%, 65%)`
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}
