import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import UserCard from '../components/UserCard.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { useUsers } from '../hooks/useUsers.js'
import { useUiStore } from '../store/ui.js'

const AddUserModal = lazy(() => import('../components/AddUserModal.jsx'))

function UserSkeleton() {
  return <div className="min-h-40 animate-pulse rounded-card bg-surface-alt" aria-hidden="true" />
}

export default function Users() {
  const { data: users = [], isPending, isError, error, refetch, isFetching } = useUsers()
  const view = useUiStore((s) => s.view)
  const search = useUiStore((s) => s.search)
  const setView = useUiStore((s) => s.setView)
  const setSearch = useUiStore((s) => s.setSearch)
  const [showAddUser, setShowAddUser] = useState(false)

  const query = search.trim().toLowerCase()
  const filteredUsers = users.filter((user) =>
    `${user.name ?? ''} ${user.email ?? ''} ${user.company?.name ?? user.role ?? ''}`
      .toLowerCase()
      .includes(query),
  )

  if (isPending) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-16">
        <p role="status" className="mb-6 text-muted">Loading users…</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <UserSkeleton key={index} />
          ))}
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-16">
        <Card className="space-y-4">
          <p role="alert" className="text-danger">Failed: {error.message}</p>
          <Button type="button" onClick={() => refetch()}>Retry</Button>
        </Card>
      </section>
    )
  }

  const listClass =
    view === 'grid'
      ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
      : 'flex flex-col gap-4'

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-16">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-primary">Directory</p>
      <h1 className="mb-3 text-4xl font-bold tracking-tight text-fg">Users</h1>
      <p className="mb-8 text-lg text-muted">
        Server data comes from TanStack Query; view and search are UI state in Zustand.
      </p>

      <Card className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">Create a new directory entry with a lazy-loaded form.</p>
        <Button type="button" onClick={() => setShowAddUser(true)}>Add user</Button>
      </Card>
      {showAddUser ? (
        <Suspense fallback={<p role="status" className="mb-6 text-muted">Loading add-user form…</p>}>
          <AddUserModal onClose={() => setShowAddUser(false)} />
        </Suspense>
      ) : null}

      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-semibold text-muted" htmlFor="user-search">
              Search users
            </label>
            <input
              id="user-search"
              className="w-full rounded-card border border-line bg-bg px-3 py-2 text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Try Leanne, company, or .biz"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={view === 'grid' ? 'primary' : 'ghost'}
              onClick={() => setView('grid')}
              aria-pressed={view === 'grid'}
            >
              Grid
            </Button>
            <Button
              type="button"
              variant={view === 'list' ? 'primary' : 'ghost'}
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
            >
              List
            </Button>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted" aria-live="polite">
          {filteredUsers.length} of {users.length} users shown
          {isFetching ? <span className="ml-2">Refreshing…</span> : null}
        </p>
      </Card>

      {filteredUsers.length ? (
        <ul className={listClass}>
          {filteredUsers.map((user) => (
            <li key={user.id}>
              <UserCard user={user} />
            </li>
          ))}
        </ul>
      ) : (
        <Card className="text-center">
          <p className="mb-4 text-muted">No users match that search.</p>
          <Button variant="ghost" type="button" onClick={() => setSearch('')}>
            Clear search
          </Button>
        </Card>
      )}

      <p className="mt-8">
        <Link className="text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" to="/">
          Back to home
        </Link>
      </p>
    </section>
  )
}
