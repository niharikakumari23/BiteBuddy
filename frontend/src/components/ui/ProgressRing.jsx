import './ProgressRing.css'

export function ProgressRing({
  value = 0,
  max = 100,
  size = 80,
  strokeWidth = 6,
  color = 'var(--primary)',
  label,
  sublabel,
  className = '',
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(100, Math.round((value / max) * 100))
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className={`bb-progress-ring ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="bb-progress-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="bb-progress-ring__fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="bb-progress-ring__content">
        {label !== undefined && <span className="bb-progress-ring__label">{label}</span>}
        {sublabel && <span className="bb-progress-ring__sublabel">{sublabel}</span>}
      </div>
    </div>
  )
}
