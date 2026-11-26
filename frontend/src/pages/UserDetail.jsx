import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { useUser } from '../hooks/useUsers.js'

export default function UserDetail() {
  const { id } = useParams()
  const { data: user, isPending, isError, error, refetch } = useUser(id)

  if (isPending) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-16">
        <p role="status" className="text-muted">Loading user…</p>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-16">
        <Card className="space-y-4">
          <p role="alert" className="text-danger">Failed: {error.message}</p>
          <div className="flex gap-3">
            <Button type="button" onClick={() => refetch()}>Retry</Button>
            <Button as={Link} variant="ghost" to="/users">Back to users</Button>
          </div>
        </Card>
      </section>
    )
  }

  const location = user.address?.city ?? user.location ?? 'Unknown location'
  const role = user.company?.name ?? user.role ?? 'User'
  const bio = user.company?.catchPhrase ?? user.bio ?? 'No bio available.'

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-16">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-primary">
        User detail - ID {id}
      </p>
      <Card className="p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-surface-alt text-3xl font-bold text-primary"
            aria-hidden="true"
          >
            {user.name?.charAt(0) ?? '?'}
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-fg">{user.name}</h1>
            <p className="text-lg text-muted">{role}</p>
          </div>
        </div>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Email</span>
            <p className="mt-1 text-fg">{user.email}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Location</span>
            <p className="mt-1 text-fg">{location}</p>
          </div>
        </div>
        <p className="text-fg">{bio}</p>
        <p className="mt-8">
          <Link
            className="text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            to="/users"
          >
            Back to users
          </Link>
        </p>
      </Card>
    </section>
  )
}
