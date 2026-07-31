import './Card.css'

export function Card({ children, className = '', padding = true, hover = false, ...props }) {
  return (
    <div
      className={`bb-card ${padding ? 'bb-card--padded' : ''} ${hover ? 'bb-card--hover' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', action }) {
  return (
    <div className={`bb-card__header ${className}`}>
      <div className="bb-card__header-content">{children}</div>
      {action && <div className="bb-card__header-action">{action}</div>}
    </div>
  )
}

export function CardTitle({ children, icon: Icon, subtitle, className = '' }) {
  return (
    <div className={`bb-card__title-group ${className}`}>
      {Icon && <div className="bb-card__title-icon"><Icon /></div>}
      <div>
        <h3 className="bb-card__title">{children}</h3>
        {subtitle && <p className="bb-card__subtitle">{subtitle}</p>}
      </div>
    </div>
  )
}
