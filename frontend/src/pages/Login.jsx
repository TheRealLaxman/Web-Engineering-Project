import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { useAuth } from '../hooks/useAuth.js'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('demo@example.com')
  const [error, setError] = useState('')

  const redirectTo = location.state?.from?.pathname ?? '/profile'

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!email.includes('@')) {
      setError('Enter a valid email address.')
      return
    }
    setError('')
    await login(email)
    navigate(redirectTo, { replace: true })
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-10 md:px-8 md:py-16">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-primary">Auth stub</p>
      <h1 className="mb-3 text-4xl font-bold tracking-tight text-fg">Login</h1>
      <p className="mb-8 text-lg text-muted">
        No backend call yet; this stores a demo user in AuthContext.
      </p>

      <Card>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-muted" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="w-full rounded-card border border-line bg-bg px-3 py-2 text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>
          {error ? (
            <p className="rounded-card bg-surface-alt px-3 py-2 text-sm text-danger">{error}</p>
          ) : null}
          <Button type="submit">Sign in</Button>
        </form>
      </Card>

      <p className="mt-4 rounded-card border border-line bg-surface-alt px-3 py-2 text-sm text-muted">
        {user
          ? `Already signed in as ${user.email}.`
          : 'Visit /profile while signed out to see the protected redirect.'}
      </p>
    </section>
  )
}
