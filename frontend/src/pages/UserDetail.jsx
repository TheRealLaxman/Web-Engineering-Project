import { Link, useLoaderData, useParams } from 'react-router-dom'
import { Card } from '../components/ui/Card.jsx'

export default function UserDetail() {
  const user = useLoaderData()
  const { id } = useParams()

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-16">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-primary">
        User detail · ID {id}
      </p>
      <Card className="p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-surface-alt text-3xl font-bold text-primary"
            aria-hidden="true"
          >
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-fg">{user.name}</h1>
            <p className="text-lg text-muted">{user.role}</p>
          </div>
        </div>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Email</span>
            <p className="mt-1 text-fg">{user.email}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Location
            </span>
            <p className="mt-1 text-fg">{user.location}</p>
          </div>
        </div>
        <p className="text-fg">{user.bio}</p>
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
