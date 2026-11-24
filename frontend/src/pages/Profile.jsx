import { useAuth } from '../hooks/useAuth.js'

export default function Profile() {
  const { user, logout } = useAuth()

  return (
    <section className="page narrow-page">
      <p className="eyebrow">Protected route</p>
      <h1>Profile</h1>
      <p className="lead">This page is wrapped in ProtectedRoute.</p>

      <article className="form-card">
        <div className="detail-meta">
          <div>
            <span className="meta-label">ID</span>
            <p>{user?.id}</p>
          </div>
          <div>
            <span className="meta-label">Name</span>
            <p>{user?.name}</p>
          </div>
        </div>
        <div className="field">
          <span className="meta-label">Email</span>
          <p>{user?.email}</p>
        </div>
        <button type="button" className="button" onClick={logout}>
          Logout
        </button>
      </article>
    </section>
  )
}
