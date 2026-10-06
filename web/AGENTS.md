<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Organización de Mercadito

Aplicar también las [reglas del repositorio](../AGENTS.md), la [guía de contribución](../CONTRIBUTING.md) y el [mapa de arquitectura](../docs/arquitectura.md). Las rutas permanecen en `src/app/`; componentes y lógica propios de una función van en `src/features/<modulo>/`.
