import './StatsGrid.css'

export function StatsGrid({ items, className = '', itemClassName = '' }) {
  if (!items?.length) return null

  return (
    <div className={`stats-grid ${className}`.trim()}>
      {items.map((item) => (
        <div key={item.key || item.label} className={`stat-card ${itemClassName}`.trim()}>
          <span className="stat-card__number">{item.value}</span>
          <span className="stat-card__label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
