//  @ts-check

/** @type {import('prettier').Config} */
const config = {
  // Line length
  printWidth: 80,

  // Semicolons
  semi: true,

  // Quotes
  singleQuote: true,

  // Indentation
  tabWidth: 2,
  useTabs: false,

  // Trailing commas
  trailingComma: 'all',

  // Spacing
  bracketSpacing: true,
  arrowParens: 'always',

  // JSX
  bracketSameLine: false,
  jsxSingleQuote: false,

  // Prose
  proseWrap: 'preserve',
}

export default config
