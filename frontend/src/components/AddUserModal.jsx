import { useState } from 'react'
import { Button } from './ui/Button.jsx'
import { Card } from './ui/Card.jsx'
import { useCreateUser } from '../hooks/useCreateUser.js'

export default function AddUserModal({ onClose }) {
  const createUser = useCreateUser()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState('')

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
      onClose()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create user.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-20 grid place-items-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-lg space-y-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="add-user-title" className="text-xl font-bold text-fg">Add user</h2>
          <Button type="button" variant="ghost" onClick={onClose} aria-label="Close add user dialog">
            Close
          </Button>
        </div>
        <form className="grid gap-4" onSubmit={handleCreate}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-muted" htmlFor="new-name">Name</label>
            <input
              id="new-name"
              className="w-full rounded-card border border-line bg-bg px-3 py-2 text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              value={name}
              onChange={(event) => setName(event.target.value)}
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
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <Button type="submit" disabled={createUser.isPending}>
            {createUser.isPending ? 'Adding…' : 'Add user'}
          </Button>
        </form>
        {formError || createUser.isError ? (
          <p role="alert" className="text-sm text-danger">
            {formError || createUser.error?.message}
          </p>
        ) : null}
      </Card>
    </div>
  )
}
