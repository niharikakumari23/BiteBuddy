import './ProgressBar.css'

export function ProgressBar({ value = 0, max = 100, color = 'var(--primary)', size = 'sm', label, className = '' }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className={`bb-progress ${className}`}>
      {label && (
        <div className="bb-progress__header">
          <span className="bb-progress__label">{label}</span>
          <span className="bb-progress__value">{pct}%</span>
        </div>
      )}
      <div className={`bb-progress__track bb-progress__track--${size}`}>
        <div
          className="bb-progress__fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}
