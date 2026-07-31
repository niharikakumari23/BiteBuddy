import './Input.css'

export function Input({ label, error, icon: Icon, className = '', ...props }) {
  return (
    <div className={`bb-input-group ${error ? 'bb-input-group--error' : ''} ${className}`}>
      {label && <label className="bb-input-label">{label}</label>}
      <div className="bb-input-wrapper">
        {Icon && <Icon className="bb-input-icon" />}
        <input className={`bb-input ${Icon ? 'bb-input--with-icon' : ''}`} {...props} />
      </div>
      {error && <span className="bb-input-error">{error}</span>}
    </div>
  )
}

export function TextArea({ label, error, className = '', ...props }) {
  return (
    <div className={`bb-input-group ${error ? 'bb-input-group--error' : ''} ${className}`}>
      {label && <label className="bb-input-label">{label}</label>}
      <textarea className="bb-textarea" {...props} />
      {error && <span className="bb-input-error">{error}</span>}
    </div>
  )
}
