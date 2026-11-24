import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export default function Home() {
  const { user } = useAuth()

  return (
    <section className="page hero-page">
      <p className="eyebrow">Unit 1.2 React SPA</p>
      <h1>frontend-lab</h1>
      <p className="lead">
        A Vite + React 19 single-page app with nested routing, Context providers, persistent
        hooks, and a data-router loader.
      </p>
      <div className="button-row">
        <Link className="button primary" to="/users">
          Browse users
        </Link>
        <Link className="button" to={user ? '/profile' : '/login'}>
          {user ? `Open ${user.name}'s profile` : 'Sign in'}
        </Link>
      </div>

      <div className="feature-grid">
        <article className="feature-card">
          <h2>Routing</h2>
          <p>Nested layout, URL parameters, protected route, redirect, and a 404 page.</p>
        </article>
        <article className="feature-card">
          <h2>Context</h2>
          <p>Theme and auth state are broadcast through guarded custom hooks.</p>
        </article>
        <article className="feature-card">
          <h2>Hooks</h2>
          <p>Local storage persistence and an effect with a resize-listener cleanup.</p>
        </article>
      </div>
    </section>
  )
}
