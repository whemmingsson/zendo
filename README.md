# zendo

Zen Todo App built with React, TypeScript, Vite, ShadCN, and Supabase.

## Tech Stack

- **React** + **TypeScript** — UI framework with type safety
- **Vite** — fast build tool and dev server
- **ShadCN UI** — accessible component library (Radix UI + Tailwind CSS)
- **Tailwind CSS v4** — utility-first styling
- **Supabase** — backend (database, auth, realtime)

## Getting Started

1. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```sh
   cp .env.example .env
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Start the dev server:
   ```sh
   npm run dev
   ```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Adding ShadCN Components

Components can be added via the ShadCN CLI:

```sh
npx shadcn@latest add button
```

