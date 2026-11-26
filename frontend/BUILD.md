# Assignment 1.5 build notes

## Commands

```bash
npm install -D rollup-plugin-visualizer
npm run build
npm run preview
npm run lint
```

Baseline was captured before changing `src/` or `vite.config.js`. After numbers come from the final build with lazy routes, the lazy add-user modal, Rolldown chunk splitting, and the production React Router alias.

## Before / After

| Stage | JS files | Total JS (kB) | Total JS gzip (kB) | Largest chunk |
| --- | ---: | ---: | ---: | --- |
| Before | 1 | 367.47 | 113.78 | `index-CP8Tw3_z.js` (367.47 kB / 113.78 kB gzip) |
| After | 14 | 372.36 | 120.44 | `react-vendor-D-YGPFPW.js` (218.76 kB / 68.31 kB gzip) |

Other emitted files:

- Before: `index.html` 0.40 kB / 0.27 kB gzip; `index-Da77jZ7M.css` 13.29 kB / 3.74 kB gzip.
- After: `index.html` 0.73 kB / 0.35 kB gzip; `index-BvJ6VvjD.css` 13.68 kB / 3.80 kB gzip.

The entry route now ships a small app chunk (`index-BOIAe1Nr.js`, 7.62 kB / 3.02 kB gzip) plus vendor chunks, instead of one 367 kB bundle. Total gzip rises slightly because splitting adds a runtime helper and shared chunks, but `/` no longer downloads every route.

## Warning resolved after screenshots

The captured warning was:

```text
[plugin builtin:vite-reporter]
(!) Some chunks are larger than 250 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
```

Two fixes were applied after the screenshots:

1. Split `react` / `react-dom` / `scheduler` into `react-vendor` and React Router internals into `router-vendor`.
2. Aliased `react-router` and `react-router/dom` to their `dist/production/*.mjs` files during `vite build`. React Router 7.18.6's package exports resolve to `dist/development` by default, so the first After build contained a development chunk in production.

The final build has no chunk above 250 kB.

## Chunk map

| Emitted chunk | Contents |
| --- | --- |
| `index-BOIAe1Nr.js` | Entry app shell: main, providers, App router config, Layout, ProtectedRoute |
| `rolldown-runtime-WkwZ5CU-.js` | Chunk-loading runtime helper |
| `react-vendor-D-YGPFPW.js` | React, React DOM, scheduler |
| `router-vendor-D7jcevY3.js` | React Router production build and router dependencies |
| `query-B6d2peDr.js` | TanStack Query core/devtools |
| `useUsers-B3FwTNCa.js` | Shared users hooks used by more than one route |
| `Card-BV9aLZ27.js` | Shared Card UI primitive |
| `Home-BxwV_qgq.js` | `/` route |
| `Users-CQ1uZgCh.js` | `/users` route |
| `UserDetail-Bd370MAx.js` | `/users/:id` route |
| `Login-BSfB4n9C.js` | `/login` route |
| `Profile-BRcta_Do.js` | `/profile` route |
| `NotFound-BZWm4QsZ.js` | `*` 404 route |
| `AddUserModal-DLA1Qji6.js` | Non-route modal, loaded on button click |
| `index-BvJ6VvjD.css` | Tailwind v4 CSS |

## Screenshots

| File | Evidence |
| --- | --- |
| `screenshots/13-users-route-chunk.png` | Captured before the final vendor repair; it shows `Users-B_4i2zwL.js` loading. The final build emits `Users-CQ1uZgCh.js`. |
| `screenshots/14-bundle-treemap.png` | Captured before the repair; it shows the large `react-vendor` chunk and the development React Router module. The final treemap is regenerated in ignored `dist/stats.html`. |

`dist/` and `dist/stats.html` are build output and are not committed; the two PNGs are committed in `screenshots/`.

## Top 3 offenders

Sizes are from the final visualizer treemap (`renderedLength`, before final minification) with the plugin's gzip estimate.

| Module | Rendered | Gzip | Action |
| --- | ---: | ---: | --- |
| `node_modules/react-dom/cjs/react-dom-client.production.js` | 529,536 B (517.1 KiB) | 99,095 B (96.8 KiB) | **Accept** — required for React DOM and isolated in the long-lived `react-vendor` chunk. |
| `node_modules/react-router/dist/production/chunk-HEAXLYUI.mjs` | 210,926 B (206.0 KiB) | 47,322 B (46.2 KiB) | **Accept** — the earlier development chunk was replaced by the production alias and isolated in `router-vendor`. |
| `node_modules/react/cjs/react.production.js` | 15,979 B (15.6 KiB) | 4,207 B (4.1 KiB) | **Accept** — small and required by every route. |

## Vite 8 / Rolldown note

This project uses Vite 8.3.8, whose production bundler is Rolldown. The assignment's object-form `manualChunks` config is not supported in Vite 8, and `advancedChunks` is deprecated. The config therefore uses:

```js
build: {
  rolldownOptions: {
    output: {
      codeSplitting: {
        groups: [
          { name: 'react-vendor', test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/, priority: 20 },
          { name: 'router-vendor', test: /node_modules[\\/](?:react-router|react-router-dom|@remix-run|cookie|set-cookie-parser)[\\/]/, priority: 20 },
          { name: 'query', test: /node_modules[\\/]@tanstack[\\/]/, priority: 20 },
        ],
      },
    },
  },
}
```

The production router alias is:

```js
resolve: {
  alias: command === 'build'
    ? [
        {
          find: /^react-router\/dom$/,
          replacement: fileURLToPath(
            new URL('./node_modules/react-router/dist/production/dom-export.mjs', import.meta.url),
          ),
        },
        {
          find: /^react-router$/,
          replacement: fileURLToPath(
            new URL('./node_modules/react-router/dist/production/index.mjs', import.meta.url),
          ),
        },
      ]
    : [],
},
```

`build.sourcemap` is on. The visualizer's own `sourcemap` option stays off because enabling it disables its gzip calculation.

## Webpack mapping

The same route split comes from `import()` boundaries; `splitChunks` replaces the declarative vendor groups.

```js
export default {
  entry: './src/main.jsx',
  output: { filename: '[name].[contenthash].js', clean: true },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        reactVendor: {
          test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/,
          name: 'react-vendor',
        },
        routerVendor: {
          test: /node_modules[\\/](?:react-router|@remix-run|cookie|set-cookie-parser)[\\/]/,
          name: 'router-vendor',
        },
        query: {
          test: /node_modules[\\/]@tanstack[\\/]/,
          name: 'query',
        },
      },
    },
  },
  module: {
    rules: [
      { test: /\.jsx?$/, use: 'babel-loader' },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    ],
  },
}
```

## Cache note

Hashed filenames such as `react-vendor-D-YGPFPW.js` change only when that chunk's content changes. That lets a CDN serve them with `Cache-Control: public, max-age=31536000, immutable`, so returning visitors do not re-download unchanged vendor code when only app code changes. This is the hand-off to Unit 1.6.

## Short answers

### Why does Vite dev start faster than Webpack?

Vite serves native ES modules and transforms files on demand, so it does not build the whole dependency graph before the first page load. Webpack traditionally bundles the entire app up front, which gets slower as the graph grows. Vite's production build uses Rolldown, but the dev server stays unbundled with fast HMR.

### What does tree-shaking need from your code?

Static ESM `import`/`export` statements, no `require()` or computed imports, and modules without surprising side effects. Package `sideEffects` metadata also helps the bundler drop unused files safely. Dynamic `import()` is still analyzable because the specifier is a literal.

### Why do vendor chunks help caching?

React, Router, and Query change far less often than app code. Giving them separate hashed files means an app edit changes `index-*.js` while `react-vendor-*.js`, `router-vendor-*.js`, and `query-*.js` keep the same URL and stay in the browser/CDN cache. The trade-off is one extra request per vendor group.
