import { Link } from 'react-router-dom'
import { Card } from './ui/Card.jsx'

export default function UserCard({ user }) {
  const role = user.company?.name ?? user.role ?? 'User'
  const location = user.address?.city ?? user.location ?? 'Unknown location'

  return (
    <Card className="flex h-full flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-fg">{user.name}</h3>
        <span className="rounded-full bg-surface-alt px-2 py-1 text-xs font-semibold text-primary">
          {role}
        </span>
      </div>
      <p className="text-sm text-fg">{user.email}</p>
      <p className="text-sm text-muted">{location}</p>
      <Link
        className="mt-auto text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        to={`/users/${user.id}`}
      >
        View profile
      </Link>
    </Card>
  )
}
