# shadcn/ui Components

This directory contains shadcn/ui components for the fun-quiz project.

## Adding New Components

To add a new component from shadcn/ui, run:

```bash
npm run ui:add
```

Or directly:

```bash
npx shadcn@latest add [component-name]
```

For example:
- `npx shadcn@latest add button`
- `npx shadcn@latest add card`
- `npx shadcn@latest add dialog`

## Available Components

Visit https://ui.shadcn.com/docs/components to see all available components.

## Usage

Import components from `@/components/ui/[component-name]`:

```tsx
import { Button } from "@/components/ui/button"

export default function MyComponent() {
  return <Button>Click me</Button>
}
```
