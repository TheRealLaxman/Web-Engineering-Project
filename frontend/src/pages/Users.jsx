import { useState } from 'react'
import { Link } from 'react-router-dom'
import UserCard from '../components/UserCard.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { useCreateUser } from '../hooks/useCreateUser.js'
import { useUsers } from '../hooks/useUsers.js'
import { useUiStore } from '../store/ui.js'

export default function Users() {
  const { data: users = [], isPending, isError, error, refetch, isFetching } = useUsers()
  const createUser = useCreateUser()
  const view = useUiStore((s) => s.view)
  const search = useUiStore((s) => s.search)
  const setView = useUiStore((s) => s.setView)
  const setSearch = useUiStore((s) => s.setSearch)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState('')

  const query = search.trim().toLowerCase()
  const filteredUsers = users.filter((user) =>
    `${user.name ?? ''} ${user.email ?? ''} ${user.company?.name ?? user.role ?? ''}`
      .toLowerCase()
      .includes(query),
  )

  const handleCreate = async (event) => {
    event.preventDefault()
    if (!name.trim() || !email.includes('@')) {
      setFormError('Enter a name and a valid email.')
      return
    }
    setFormError('')
    try {
      await createUser.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        company: { name: 'Lab Member' },
      })
      setName('')
      setEmail('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create user.')
    }
  }

  if (isPending) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-16">
        <p role="status" className="text-muted">Loading users…</p>
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

      <Card className="mb-6">
        <form className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]" onSubmit={handleCreate}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-muted" htmlFor="new-name">Name</label>
            <input
              id="new-name"
              className="w-full rounded-card border border-line bg-bg px-3 py-2 text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New user name"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-muted" htmlFor="new-email">Email</label>
            <input
              id="new-email"
              className="w-full rounded-card border border-line bg-bg px-3 py-2 text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={createUser.isPending} className="w-full sm:w-auto">
              {createUser.isPending ? 'Adding…' : 'Add user'}
            </Button>
          </div>
        </form>
        {formError || createUser.isError ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {formError || createUser.error?.message}
          </p>
        ) : null}
      </Card>

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
