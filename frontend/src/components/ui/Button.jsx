import './Button.css'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      className={`bb-btn bb-btn--${variant} bb-btn--${size} ${loading ? 'bb-btn--loading' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="bb-btn__spinner" />}
      {!loading && Icon && <Icon className="bb-btn__icon" />}
      {children && <span className="bb-btn__label">{children}</span>}
      {!loading && IconRight && <IconRight className="bb-btn__icon bb-btn__icon--right" />}
    </button>
  )
}
