import { Link, useLoaderData, useParams } from 'react-router-dom'

export default function UserDetail() {
  const user = useLoaderData()
  const { id } = useParams()

  return (
    <section className="page">
      <p className="eyebrow">User detail · ID {id}</p>
      <article className="detail-card">
        <div className="detail-header">
          <div className="avatar" aria-hidden="true">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1>{user.name}</h1>
            <p className="lead">{user.role}</p>
          </div>
        </div>
        <div className="detail-meta">
          <div>
            <span className="meta-label">Email</span>
            <p>{user.email}</p>
          </div>
          <div>
            <span className="meta-label">Location</span>
            <p>{user.location}</p>
          </div>
        </div>
        <p>{user.bio}</p>
        <p className="back-link">
          <Link className="text-link" to="/users">
            Back to users
          </Link>
        </p>
      </article>
    </section>
  )
}
