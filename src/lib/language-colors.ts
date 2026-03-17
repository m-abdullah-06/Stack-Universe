export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3572a5',
  Java: '#b07219',
  Rust: '#dea584',
  Go: '#00add8',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  Ruby: '#701516',
  PHP: '#4f5d95',
  Scala: '#c22d40',
  Shell: '#89e051',
  Bash: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Dart: '#00b4ab',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Clojure: '#db5855',
  Lua: '#000080',
  R: '#198ce7',
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
  Groovy: '#e69f56',
  Terraform: '#7b42bc',
  Dockerfile: '#384d54',
  Makefile: '#427819',
  Assembly: '#6e4c13',
  Nix: '#7e7eff',
  Racket: '#3c5caa',
  Elm: '#60b5cc',
  PureScript: '#1d222d',
  Apex: '#1797c0',
  Solidity: '#aa6746',
  Hack: '#878787',
  WebAssembly: '#04133b',
}

export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] || `hsl(${hashCode(language) % 360}, 70%, 60%)`
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash)
}
