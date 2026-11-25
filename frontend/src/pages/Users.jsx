import { Link } from 'react-router-dom'
import UserCard from '../components/UserCard.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card } from '../components/ui/Card.jsx'
import { users } from '../data/users.js'
import { useLocalStorage } from '../hooks/useLocalStorage.js'

export default function Users() {
  const [search, setSearch] = useLocalStorage('users-search', '')
  const query = search.trim().toLowerCase()

  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(query),
  )

  const linkClass =
    'text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8 md:py-16">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-primary">Directory</p>
      <h1 className="mb-3 text-4xl font-bold tracking-tight text-fg">Users</h1>
      <p className="mb-8 text-lg text-muted">
        Search is stored in localStorage through the custom hook.
      </p>

      <Card className="mb-6">
        <label className="mb-2 block text-sm font-semibold text-muted" htmlFor="user-search">
          Search users
        </label>
        <input
          id="user-search"
          className="w-full rounded-card border border-line bg-bg px-3 py-2 text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Try Ada, compiler, or example.com"
        />
        <p className="mt-2 text-sm text-muted" aria-live="polite">
          {filteredUsers.length} of {users.length} users shown
        </p>
      </Card>

      {filteredUsers.length ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <Link className={linkClass} to="/">
          Back to home
        </Link>
      </p>
    </section>
  )
}
