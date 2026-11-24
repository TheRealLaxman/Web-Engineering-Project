import { Link } from 'react-router-dom'

export default function UserCard({ user }) {
  return (
    <article className="card">
      <div className="card-heading">
        <h3>{user.name}</h3>
        <span className="badge">{user.role}</span>
      </div>
      <p>{user.email}</p>
      <p className="muted">{user.location}</p>
      <Link className="text-link" to={`/users/${user.id}`}>
        View profile
      </Link>
    </article>
  )
}
