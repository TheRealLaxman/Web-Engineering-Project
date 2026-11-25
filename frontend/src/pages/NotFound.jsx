import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button.jsx'

export default function NotFound() {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-10 md:px-8 md:py-16">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-primary">404</p>
      <h1 className="mb-3 text-4xl font-bold tracking-tight text-fg">Page not found</h1>
      <p className="mb-8 text-lg text-muted">
        That route does not exist, or the requested user was not found.
      </p>
      <Button as={Link} to="/">
        Back to home
      </Button>
    </section>
  )
}
