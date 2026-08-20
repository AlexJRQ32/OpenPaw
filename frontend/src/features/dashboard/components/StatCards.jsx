import './StatCards.css'

export function StatCards({ config, data }) {
  if (!config?.length) return null

  return (
    <div className={'dashboard-stats' + ((config?.length ?? 0) >= 4 ? ' dashboard-stats--grid' : '')}>
      {config.map((card) => (
        <div key={card.key} className="stat-card">
          <div className={`stat-icon stat-icon--${card.color}`}><i className={card.icon}></i></div>
          <div>
            <div className="stat-number">{data[card.key] ?? 0}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
