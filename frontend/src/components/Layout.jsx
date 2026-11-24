import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useTheme } from '../hooks/useTheme.js'
import { useViewportWidth } from '../hooks/useViewportWidth.js'
import { Button } from './ui/Button.jsx'

export default function Layout() {
  const { theme, toggle } = useTheme()
  const { user, logout } = useAuth()
  const viewportWidth = useViewportWidth()

  const navClass = ({ isActive }) =>
    `rounded-card px-3 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
      isActive ? 'bg-surface-alt text-fg' : 'text-muted hover:text-fg'
    }`

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 p-4">
          <NavLink
            to="/"
            className="mr-auto text-lg font-semibold text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            frontend-lab
          </NavLink>
          <nav className="flex flex-wrap items-center gap-2" aria-label="Primary">
            <NavLink to="/" end className={navClass}>
              Home
            </NavLink>
            <NavLink to="/users" className={navClass}>
              Users
            </NavLink>
            {user ? (
              <Button variant="ghost" className="text-sm" type="button" onClick={logout}>
                Logout ({user.name})
              </Button>
            ) : (
              <NavLink to="/login" className={navClass}>
                Login
              </NavLink>
            )}
            <Button
              variant="ghost"
              className="text-sm"
              type="button"
              onClick={toggle}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
        <Outlet />
      </main>

      <footer className="border-t border-line text-sm text-muted">
        <div className="mx-auto max-w-6xl p-4">Viewport: {viewportWidth}px · React SPA lab</div>
      </footer>
    </div>
  )
}
