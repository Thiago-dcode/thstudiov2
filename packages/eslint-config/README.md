# `@turbo/eslint-config`

Collection of internal eslint configurations.

## TypeScript version

The `typescript` devDependency here is pinned to the 6.x line on purpose. It is not
used to compile anything — it only satisfies `typescript-eslint`'s peer dependency
(`>=4.8.4 <6.1.0`), which is what the parser loads at lint time. `typescript-eslint`
refuses to run against TypeScript 7.0 ("typescript-eslint does not support TS 7.0"),
and no release supports it yet; support is tracked for TS >= 7.1 in
https://github.com/typescript-eslint/typescript-eslint/issues/10940.

Workspaces are free to build on TypeScript 7 — the version they resolve for `tsc` is
independent of the one the linter parses with. Bump this to `^7.x` only once
`typescript-eslint` ships support.
