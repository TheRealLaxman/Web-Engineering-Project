# Assignment 1.5 build notes

## Commands

```bash
npm install -D rollup-plugin-visualizer
npm run build
npm run preview
npm run lint
```

Baseline was captured before changing `src/` or `vite.config.js`. After numbers come from the build with lazy routes, the lazy add-user modal, and Rolldown chunk splitting.

## Before / After

| Stage | JS files | Total JS (kB) | Total JS gzip (kB) | Largest chunk |
| --- | ---: | ---: | ---: | --- |
| Before | 1 | 367.47 | 113.78 | `index-CP8Tw3_z.js` (367.47 kB / 113.78 kB gzip) |
| After | 13 | 373.93 | 120.42 | `react-vendor-C8kZ2BEs.js` (310.61 kB / 98.05 kB gzip) |

Other emitted files:

- Before: `index.html` 0.40 kB / 0.27 kB gzip; `index-Da77jZ7M.css` 13.29 kB / 3.74 kB gzip.
- After: `index.html` 0.65 kB / 0.34 kB gzip; `index-BvJ6VvjD.css` 13.68 kB / 3.80 kB gzip.

The entry route now ships a much smaller app chunk (`index-Ntz09dqM.js`, 7.52 kB / 3.00 kB gzip) plus the vendor chunks, instead of one 367 kB bundle. Total gzip rises slightly because splitting adds small runtime/shared chunks and duplicate module wrappers; the win is that `/` no longer downloads every route.

## Warning left unrepaired for screenshots

```text
[plugin builtin:vite-reporter]
(!) Some chunks are larger than 250 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
```

`react-vendor-C8kZ2BEs.js` is 310.61 kB / 98.05 kB gzip. This is intentionally left as-is for screenshot capture before any repair.

## Chunk map

| Emitted chunk | Contents |
| --- | --- |
| `index-Ntz09dqM.js` | Entry app shell: main, providers, App router config, Layout, ProtectedRoute |
| `rolldown-runtime-WkwZ5CU-.js` | Chunk-loading runtime helper |
| `react-vendor-C8kZ2BEs.js` | React, React DOM, scheduler, React Router, Remix router internals |
| `query-C-X9fKev.js` | TanStack Query core/devtools |
| `useUsers-BYPsql39.js` | Shared users hooks used by more than one route |
| `Card-CQdrbsVz.js` | Shared Card UI primitive |
| `Home-DK4WIX2Q.js` | `/` route |
| `Users-B_4i2zwL.js` | `/users` route |
| `UserDetail-D032YWXx.js` | `/users/:id` route |
| `Login-Bm4hF9w3.js` | `/login` route |
| `Profile-s58zDbW4.js` | `/profile` route |
| `NotFound-BtWVCsJn.js` | `*` 404 route |
| `AddUserModal-CTB2QPjJ.js` | Non-route modal, loaded on button click |
| `index-BvJ6VvjD.css` | Tailwind v4 CSS |

## Screenshots

| File | How to capture |
| --- | --- |
| `screenshots/13-users-route-chunk.png` | `npm run preview`, DevTools → Network → Disable cache, direct-load `http://localhost:4173/users`, capture the `Users-B_4i2zwL.js` request. Direct URL avoids hover prefetch masking the request. |
| `screenshots/14-bundle-treemap.png` | Open `dist/stats.html` (or `http://localhost:4173/stats.html`) and capture the treemap. |

`dist/` and `dist/stats.html` are build output and are not committed; the two PNGs are committed in `screenshots/`.

## Top 3 offenders

Sizes are from the visualizer treemap (`renderedLength`, before final minification) with the plugin's gzip estimate.

| Module | Rendered | Gzip | Action |
| --- | ---: | ---: | --- |
| `node_modules/react-dom/cjs/react-dom-client.production.js` | 529,536 B (517.1 KiB) | 99,095 B (96.8 KiB) | **Accept** — required for React DOM and already isolated in the long-lived `react-vendor` chunk. |
| `node_modules/react-router/dist/development/chunk-YDNE64FV.mjs` | 210,919 B (206.0 KiB) | 47,323 B (46.2 KiB) | **Replace after screenshots** — investigate why a development React Router chunk is in a production build and alias/configure the production entry if possible. |
| `node_modules/react/cjs/react.production.js` | 15,979 B (15.6 KiB) | 4,207 B (4.1 KiB) | **Accept** — small and required by every route. |

## Vite 8 / Rolldown note

This project uses Vite 8.3.8, whose production bundler is Rolldown. The assignment's object-form `manualChunks` config is not supported in Vite 8, and `advancedChunks` is deprecated. The config therefore uses:

```js
build: {
  rolldownOptions: {
    output: {
      codeSplitting: {
        groups: [
          { name: 'react-vendor', test: /node_modules[\\/](?:react|react-dom|scheduler|react-router|react-router-dom|@remix-run)[\\/]/, priority: 20 },
          { name: 'query', test: /node_modules[\\/]@tanstack[\\/]/, priority: 20 },
        ],
      },
    },
  },
}
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
          test: /node_modules[\\/](?:react|react-dom|scheduler|react-router|@remix-run)[\\/]/,
          name: 'react-vendor',
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

Hashed filenames such as `react-vendor-C8kZ2BEs.js` change only when that chunk's content changes. That lets a CDN serve them with `Cache-Control: public, max-age=31536000, immutable`, so returning visitors do not re-download unchanged vendor code when only app code changes. This is the hand-off to Unit 1.6.

## Short answers

### Why does Vite dev start faster than Webpack?

Vite serves native ES modules and transforms files on demand, so it does not build the whole dependency graph before the first page load. Webpack traditionally bundles the entire app up front, which gets slower as the graph grows. Vite's production build uses Rolldown, but the dev server stays unbundled with fast HMR.

### What does tree-shaking need from your code?

Static ESM `import`/`export` statements, no `require()` or computed imports, and modules without surprising side effects. Package `sideEffects` metadata also helps the bundler drop unused files safely. Dynamic `import()` is still analyzable because the specifier is a literal.

### Why do vendor chunks help caching?

React and Query change far less often than app code. Giving them separate hashed files means an app edit changes `index-*.js` while `react-vendor-*.js` keeps the same URL and stays in the browser/CDN cache. The trade-off is one extra request per vendor group.
