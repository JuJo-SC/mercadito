# Dependency overrides

These npm overrides constrain transitive packages used by the Prisma CLI and migration image.

- `@prisma/config` uses `deepmerge-ts ^8.0.1` to receive the fix for [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx). Remove this override when Prisma's `@prisma/config` dependency requires `deepmerge-ts >=8`.
- `prisma` uses `mysql2 ^3.23.1` to receive fixes for [GHSA-3f6p-5ww8-9rcr](https://github.com/advisories/GHSA-3f6p-5ww8-9rcr) and [GHSA-rgwj-5xj2-c3m3](https://github.com/advisories/GHSA-rgwj-5xj2-c3m3). Remove this override when Prisma's CLI dependency resolves to a version at or above the patched releases.

Keep these constraints scoped to the CLI packages; the application uses PostgreSQL through Prisma's PostgreSQL adapter.
