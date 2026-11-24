import { Link } from 'react-router-dom'
import UserCard from '../components/UserCard.jsx'
import { users } from '../data/users.js'
import { useLocalStorage } from '../hooks/useLocalStorage.js'

export default function Users() {
  const [search, setSearch] = useLocalStorage('users-search', '')
  const query = search.trim().toLowerCase()

  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(query),
  )

  return (
    <section className="page">
      <p className="eyebrow">Directory</p>
      <h1>Users</h1>
      <p className="lead">Search is stored in localStorage through the custom hook.</p>

      <div className="search-panel">
        <label className="field-label" htmlFor="user-search">
          Search users
        </label>
        <input
          id="user-search"
          className="search-input"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Try Ada, compiler, or example.com"
        />
        <p className="muted" aria-live="polite">
          {filteredUsers.length} of {users.length} users shown
        </p>
      </div>

      {filteredUsers.length ? (
        <div className="user-grid">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No users match that search.</p>
          <button type="button" className="button" onClick={() => setSearch('')}>
            Clear search
          </button>
        </div>
      )}

      <p className="back-link">
        <Link className="text-link" to="/">
          Back to home
        </Link>
      </p>
    </section>
  )
}
