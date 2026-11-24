import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useTheme } from '../hooks/useTheme.js'
import { useViewportWidth } from '../hooks/useViewportWidth.js'

export default function Layout() {
  const { theme, toggle } = useTheme()
  const { user, logout } = useAuth()
  const viewportWidth = useViewportWidth()

  const navClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <NavLink to="/" className="brand">
            frontend-lab
          </NavLink>
          <nav className="nav" aria-label="Primary">
            <NavLink to="/" end className={navClass}>
              Home
            </NavLink>
            <NavLink to="/users" className={navClass}>
              Users
            </NavLink>
            {user ? (
              <button type="button" className="nav-link button-link" onClick={logout}>
                Logout ({user.name})
              </button>
            ) : (
              <NavLink to="/login" className={navClass}>
                Login
              </NavLink>
            )}
            <button
              type="button"
              className="theme-toggle"
              onClick={toggle}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-inner">Viewport: {viewportWidth}px · React SPA lab</div>
      </footer>
    </div>
  )
}
