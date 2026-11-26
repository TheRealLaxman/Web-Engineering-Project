import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { useAuth } from '../hooks/useAuth.js'

export default function Home() {
  const { user } = useAuth()

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-16">
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-primary">
            Unit 1.3 Styling Systems
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-fg md:text-6xl">
            frontend-lab
          </h1>
          <p className="mb-6 text-lg text-muted">
            A Vite + React 19 SPA styled with Tailwind v4 utility classes, responsive Grid and
            Flexbox layouts, and CSS-variable design tokens.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button as={Link} to="/users">
              Browse users
            </Button>
            <Button as={Link} variant="ghost" to={user ? '/profile' : '/login'}>
              {user ? `Open ${user.name}'s profile` : 'Sign in'}
            </Button>
          </div>
        </div>
        <img
          src="/hero-800.webp"
          srcSet="/hero-480.webp 480w, /hero-800.webp 800w, /hero-1200.webp 1200w"
          sizes="(min-width: 64rem) 320px, 100vw"
          width="1200"
          height="800"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="aspect-[3/2] w-full rounded-card object-cover shadow-sm"
          alt="Developer workspace with laptop"
        />
      </div>

      <div className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4">
        <Card>
          <h2 className="mb-2 text-lg font-semibold text-fg">Routing</h2>
          <p className="text-sm text-muted">
            Nested layout, URL parameters, protected route, redirect, and a 404 page.
          </p>
        </Card>
        <Card>
          <h2 className="mb-2 text-lg font-semibold text-fg">Context</h2>
          <p className="text-sm text-muted">
            Theme and auth state are broadcast through guarded custom hooks.
          </p>
        </Card>
        <Card>
          <h2 className="mb-2 text-lg font-semibold text-fg">Tokens</h2>
          <p className="text-sm text-muted">
            CSS variables feed Tailwind utilities and recolour the whole UI.
          </p>
        </Card>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <img
          src="/hero-480.webp"
          width="64"
          height="64"
          loading="lazy"
          decoding="async"
          className="h-16 w-16 rounded-full object-cover"
          alt=""
        />
        <p className="text-sm text-muted">Below-the-fold preview uses lazy loading and async decode.</p>
      </div>
    </section>
  )
}
