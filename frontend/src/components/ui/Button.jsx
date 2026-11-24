const variants = {
  primary: 'bg-primary text-primary-contrast hover:opacity-90',
  ghost: 'border border-line bg-surface text-fg hover:bg-surface-alt',
}

export function Button({ variant = 'primary', className = '', as: Component = 'button', ...props }) {
  return (
    <Component
      className={`inline-flex items-center justify-center gap-2 rounded-card px-4 py-2 font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
