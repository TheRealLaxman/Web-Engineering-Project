import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { useAuth } from '../hooks/useAuth.js'

export default function Profile() {
  const { user, logout } = useAuth()

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-10 md:px-8 md:py-16">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-primary">
        Protected route
      </p>
      <h1 className="mb-3 text-4xl font-bold tracking-tight text-fg">Profile</h1>
      <p className="mb-8 text-lg text-muted">This page is wrapped in ProtectedRoute.</p>

      <Card>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">ID</span>
            <p className="mt-1 text-fg">{user?.id}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Name</span>
            <p className="mt-1 text-fg">{user?.name}</p>
          </div>
        </div>
        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Email</span>
          <p className="mt-1 text-fg">{user?.email}</p>
        </div>
        <Button variant="ghost" type="button" onClick={logout}>
          Logout
        </Button>
      </Card>
    </section>
  )
}
