import './Badge.css'

export function Badge({ children, variant = 'default', size = 'sm', dot = false, className = '' }) {
  return (
    <span className={`bb-badge bb-badge--${variant} bb-badge--${size} ${className}`}>
      {dot && <span className="bb-badge__dot" />}
      {children}
    </span>
  )
}
