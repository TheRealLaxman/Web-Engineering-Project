import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
    <section className="page narrow-page">
      <p className="eyebrow">Auth stub</p>
      <h1>Login</h1>
      <p className="lead">No backend call yet; this stores a demo user in AuthContext.</p>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="button primary">
          Sign in
        </button>
      </form>

      {user ? (
        <p className="notice">Already signed in as {user.email}.</p>
      ) : (
        <p className="notice">Visit /profile while signed out to see the protected redirect.</p>
      )}
    </section>
  )
}
