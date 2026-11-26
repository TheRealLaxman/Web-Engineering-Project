# Assignment 1.6 performance report

## Method

- Production build only: `npm run build && npm run preview` (never the dev server).
- Lighthouse CLI 13.6.0, `--preset=perf`, mobile form factor, four categories (Performance, Accessibility, Best Practices, SEO).
- Headless Chromium from the local Playwright cache via `CHROME_PATH`.
- Three runs per stage; median values reported below.
- Baseline used `http://localhost:4173` before optimisations. Final runs used the same preview command after rebuilding.
- Cache headers were verified separately with `npm run serve` on `http://localhost:4000` and `curl.exe -I`.

Reports:

- [`lighthouse/before.html`](./lighthouse/before.html) — median baseline run (`before-run3`)
- [`lighthouse/after.html`](./lighthouse/after.html) — median final run (`after-run2`)
- [`lighthouse/before-summary.json`](./lighthouse/before-summary.json), [`lighthouse/after-summary.json`](./lighthouse/after-summary.json) — raw three-run medians

## Before / after (median of 3)

| Metric | Before | After | Δ |
| --- | ---: | ---: | ---: |
| Performance score | 62 | 85 | +23 |
| FCP | 2,215 ms | 2,558 ms | +343 ms (worse) |
| LCP | 46,007 ms | 3,738 ms | −42,269 ms (−91.9%) |
| TBT | 42 ms | 95 ms | +53 ms (worse) |
| CLS | 0.106 | 0.038 | −0.068 (now “good”) |
| JS transferred | 114.7 kB | 117.7 kB | +3.0 kB |
| Image transferred | 8,012.5 kB | 47.4 kB | −7,965.1 kB (−99.4%) |
| Total transferred | 8,132.5 kB | 171.7 kB | −7,960.8 kB (−97.9%) |

Target check: Performance is **85**, below the ≥90 target. CLS (0.038) and TBT (95 ms) are in Lighthouse’s “good” ranges; LCP improved by 92% but remains above the 2.5 s “good” threshold at 3.74 s. The gap is explained under “Remaining opportunities”.

## Baseline setup

`npm run images` generates a deliberately heavy `public/hero-heavy.png` from `backend/photo.png`:

- Upscaled to 2000 × 1333 with `sharp`, PNG compression level 0.
- Output: 8,012,254 bytes (about 8.0 MB).
- `Home.jsx` initially rendered it with no `width`/`height`, no priority hint, and no responsive source.

That produced a very large LCP payload and a small layout shift, giving Lighthouse a clear problem to fix.

## Change log

| Change | Why | Measured effect |
| --- | --- | --- |
| Replaced the 8 MB PNG with local WebP variants at 480/800/1200 px, `srcSet` + `sizes`, `width="1200" height="800"`, `fetchPriority="high"`, `decoding="async"` | Right-size the LCP image, use a modern format, reserve intrinsic space, prioritise the visible image | Image transfer 8,012.5 kB → 47.4 kB; LCP 46.0 s → 3.7 s; CLS 0.106 → 0.038 |
| Added a below-the-fold preview image with `loading="lazy"`, `decoding="async"`, and explicit dimensions | Defer non-critical image work and avoid a second layout shift | Final Network panel still shows only small WebP candidates (15.6 kB / 31.5 kB) |
| Added a high-priority image preload in `index.html` | Start the LCP request before React renders | Tested with responsive hints and with a single 480 px hint; kept the simple 480 px hint because it produced the most stable median score |
| Added `aspect-[3/2]` to the hero and reserved `min-h-64` for the route spinner | Reserve space during lazy route and image loading | CLS now 0.038 (< 0.1) |
| Replaced the pending users paragraph with six skeleton cards | Reserve list height while TanStack Query loads | No layout jump on `/users` loading state |
| Confirmed 1.5 route splitting and made React Query Devtools dev-only | Keep route chunks and avoid shipping devtools in production | Module count in `vite build` fell from 104 → 97; entry JS gzip stayed at 5.94 kB |
| Added `web-vitals` and log LCP/INP/CLS from real browsing | Bonus metric logging | Adds one small runtime dependency; final JS transfer rose by only 3.0 kB |
| Added `meta description`, `theme-color`, and `serve.js` cache headers | SEO/best-practices polish plus production-like cache simulation | See header verification below |

## Cache header implementation

`frontend/serve.js` serves `dist/` on port 4000 with Express:

```text
/assets/*  -> public, max-age=31536000, immutable
/*.html    -> no-cache
/images    -> public, max-age=86400, stale-while-revalidate=604800
SPA route  -> no-cache
```

Verified with `curl.exe -I` after `npm run serve`:

```text
GET /                                   Cache-Control: no-cache
GET /assets/react-vendor-D-YGPFPW.js    Cache-Control: public, max-age=31536000, immutable
GET /hero-800.webp                      Cache-Control: public, max-age=86400, stale-while-revalidate=604800
```

On reload with DevTools open, hashed assets should show `(disk cache)` / `0 ms`; capture that panel in `screenshots/17-cached-assets.png`.

## Deployment header notes

No CDN account was needed; these are the headers a real deployment should use.

| Resource | Browser header | CDN header | Reason |
| --- | --- | --- | --- |
| `/index.html` | `Cache-Control: no-cache` | `s-maxage=0` or `no-cache` | Must always revalidate so users get the newest hashed filenames |
| `/assets/*-<hash>.js` / `.css` / `.woff2` | `public, max-age=31536000, immutable` | `s-maxage=31536000, immutable` | Content change implies a new filename; safe to cache forever |
| `/hero-*.webp` (current names are not hashed) | `public, max-age=86400, stale-while-revalidate=604800` | `s-maxage=86400, stale-while-revalidate=604800` | Good freshness/speed balance; rename with a hash to use immutable caching |
| API JSON | `no-store` or `private, max-age=0, must-revalidate` + `ETag` | `no-store` by default | Freshness/privacy; never cache user-specific data at the edge |
| SPA fallback routes | `Cache-Control: no-cache` | `s-maxage=0` | Same as HTML; avoids stale app shells |

CDN purge on deploy:

- Publish the new `dist/` with a new release directory.
- Purge HTML and SPA routes by tag (for example `tag=html`), not the immutable hashed assets.
- If tag purging is unavailable, invalidate `/` and route URLs only; leave `/assets/*` cached.
- Cloudflare: “Purge by Tag”; CloudFront: invalidation paths such as `/index.html` and `/*` for HTML routes only.

Comparison with service-worker strategies from 4.5:

- Browser/HTTP cache is fastest (zero network) and works here because hashed files are immutable.
- A service worker could add `cache-first` for hashed assets, `stale-while-revalidate` for HTML, and `network-first` for API JSON.
- HTTP caching is the primary layer; a service worker would improve offline/repeat visits, not the first Lighthouse load.

## Screenshots

Capture manually after running the same commands:

- `screenshots/15-lighthouse-before.png` — Performance/A11y/Best Practices/SEO scores from `before.html`
- `screenshots/16-lighthouse-after.png` — same four scores from `after.html`
- `screenshots/17-cached-assets.png` — Network panel showing `(disk cache)` / `0 ms` on hashed assets

## Short answers

**What blocks rendering?** CSS is render-blocking, and classic synchronous JS is parser-blocking. `<script type="module">` and `defer` avoid parser blocking, but a React SPA still shows an empty HTML shell until the JS bundle downloads, parses, and executes. Keeping the critical path short is why the 1.5 route splitting matters.

**`no-cache` vs `no-store`?** `no-cache` allows the browser/CDN to store a copy but requires revalidation with the origin before reuse. `no-store` forbids storage entirely.

**Why do hashed filenames pair with `immutable`?** A content change produces a different filename, so an old URL can never serve stale content. The browser can skip revalidation for a year, saving requests.

**What caused CLS and how was it fixed?** The baseline hero image had no intrinsic dimensions, so the page shifted when the 2000 × 1333 image arrived. Fixed with `width`/`height`, an `aspect-[3/2]` box, and reserved spinner/skeleton heights.

## Remaining opportunities not fixed

- Lighthouse still reports about 29 KiB of unused React vendor JS. Removing it would require a much larger refactor (or SSR/islands) and is outside this lab’s scope.
- Performance is 85 rather than ≥90 mainly because of mobile CPU throttling and run-to-run TBT variance on this shared machine (42–108 ms across runs). The after state meets CLS and TBT “good” thresholds and cuts transferred bytes by 97.9%.
- FCP is slightly worse (2.2 s → 2.6 s) because the final bundle includes the optional `web-vitals` bonus and the preload/meta work; the much larger LCP and transfer wins dominate the score.
- Images are not filename-hashed, so they use a 1-day cache instead of `immutable`. A production build should fingerprint them.
- No CDN account was used; deployment headers are documented only.
