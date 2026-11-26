# Assignment 1.2 notes

## Routes

- `/` Home
- `/users` Users list with persisted search
- `/users/:id` User detail loader
- `/login` Auth stub login
- `/profile` Protected route
- Any unknown URL 404 page

The app uses `createBrowserRouter` with `RouterProvider` to enable the bonus loader on the user detail route while keeping nested layout routes, `NavLink`, `Outlet`, route parameters, and `Navigate`.

## Screenshots

Capture these manually after running `npm run dev` and save them in `screenshots/`:

1. `01-home-light.png` - `/` with light theme.
2. `02-users-dark.png` - `/users` after toggling to dark theme.
3. `03-user-detail-dark.png` - `/users/1` in dark theme.
4. `04-protected-redirect.png` - sign out, visit `/profile`, and capture the redirect to `/login`.
5. `05-profile-signed-in.png` - optional: sign in with `demo@example.com`, revisit `/profile`.

## Short answers

### CSR vs SSR vs SSG

- **CSR**: The server sends an empty HTML shell and JavaScript renders the UI. A good use case is a logged-in dashboard such as `/profile` in this lab.
- **SSR**: The server renders HTML for each request. A good use case is a personalised page that also needs good SEO, such as a product detail page.
- **SSG**: HTML is generated once at build time. A good use case is documentation, a blog, or marketing content that rarely changes.

### What is hydration?

Hydration is the process where client-side JavaScript attaches event listeners and takes control of HTML that was already rendered by the server during SSR or SSG. If the first client render differs from the server HTML, such as by using `Date.now()`, a hydration mismatch warning occurs and React may re-render. This lab is CSR only, so it uses `createRoot` and does not hydrate.

### When is Context the wrong tool?

Context is for low-frequency global values such as theme or current user. It is the wrong tool for frequently changing state, complex state transitions, or fetched server data that needs caching, revalidation, and loading/error handling. In those cases prefer local state, a dedicated state library, or a data-fetching library; putting fast-changing values in Context can cause wide re-renders.

### What did StrictMode's double-invoke teach?

In development, StrictMode mounts, unmounts, and remounts components to expose unsafe effects. The resize effect in `useViewportWidth` adds a listener and its cleanup removes the same listener, so the double-invoke leaves exactly one active listener instead of duplicating it. The cleanup also prevents updates after unmount.

## Assignment 1.3 notes

### Implementation

- Tailwind v4 is installed with `@tailwindcss/vite`; no v3 fallback is used.
- Design tokens are CSS variables exposed through `@theme inline` and documented in `docs/tokens.md`.
- Dark mode is driven by the `data-theme` attribute; with no saved preference, `ThemeContext` now follows `prefers-color-scheme`.
- The navbar and button rows use Flexbox. The users list uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, and the Home feature grid uses `grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]`.
- `Button` and `Card` primitives in `src/components/ui/` are used across the pages.

### Screenshots

Capture these manually after running `npm run dev` and save them in `screenshots/`:

1. `06-home-mobile-light.png` - `/` at 360px in light theme.
2. `07-users-desktop-light.png` - `/users` at 1280px in light theme.
3. `08-home-mobile-dark.png` - `/` at 360px in dark theme.
4. `09-users-desktop-dark.png` - `/users` at 1280px in dark theme.

### Short answers

#### When to use Grid vs Flexbox

Use Flexbox for one-dimensional layout such as navbars, toolbars, and button rows, where content decides the size and `flex-wrap` handles overflow. Use Grid for two-dimensional layout such as card galleries and dashboards, where the layout decides the size via `grid-template-columns` and `gap`. They compose well: a page can use Grid for its overall structure and Flexbox inside each card.

#### Two pros and two cons of utility-first CSS

Pros: it removes the need to invent BEM names and avoids dead CSS because only used classes are generated; it also gives a consistent spacing/colour scale and speeds up styling in markup. Cons: class lists make markup noisy; there is a vocabulary to learn, and repeated combinations should be extracted into components rather than duplicated CSS classes.

#### Why tokens beat hard-coded colours

Tokens give one named source of truth, so changing `--primary` updates every consumer. They also make dark mode a matter of swapping variable values, improve consistency across components, and avoid scattered hex values that drift apart.

## Assignment 1.4 notes

### Implementation

- TanStack Query v5 is installed with React Query Devtools; QueryClientProvider wraps the app in src/main.jsx with staleTime: 30_000 and etry: 1.
- src/api/users.js is the only module that knows the API base URL (VITE_API_URL, defaulting to JSONPlaceholder). Hooks in src/hooks/useUsers.js expose useUsers/useUser; useCreateUser performs a mutation.
- The users list and detail pages use Query loading/error/success states. The detail route no longer depends on the old router loader.
- The "Add user" form uses useMutation; submit is disabled while pending and errors are shown inline. For JSONPlaceholder the created user is patched into cache with setQueryData because the fake API does not persist writes. With a real source-of-truth API, invalidateQueries({ queryKey: ['users'] }) is preferred so the cache refetches authoritative server data.
- Zustand (src/store/ui.js) stores UI state only: grid/list view and search text. View is persisted via partialize; query results are never copied into the store.

### Screenshots

Capture these manually after running 
pm run dev and save them in screenshots/:

1. 10-query-devtools-users.png - React Query Devtools showing cached ['users'].
2. 11-users-loading.png - loading state (throttle network in DevTools).
3. 12-users-error.png - error state (break VITE_API_URL or block request) with Retry.

### Short answers

#### Server state vs client state

Server state lives on a server and the UI keeps a cached copy; it needs fetching, caching, deduplication, invalidation, retries, and background refresh. Client state lives only in the browser, such as modal open state, selected tab, or grid/list view, and is owned by UI components or a client store.

#### One reason to choose Redux Toolkit over Zustand

Redux Toolkit is a better fit when a large team needs strict conventions and predictable cross-cutting client-state flows, especially with devtools/time-travel style debugging, middleware, or RTK Query integration. Zustand is lighter for small/medium UI state with minimal boilerplate.

#### What does staleTime do?

staleTime controls how long fetched data is considered fresh. While fresh, TanStack Query can serve cached data without refetching on mount/focus; after it becomes stale, Query is allowed to refetch in the background to keep data up to date.