import { Icon } from '../../../shared/components/Icon/Icon'
import './StatCards.css'

// T24: números grandes con separador de miles es-CR ("1,248" como el wireframe).
function formatValue(raw) {
  const n = Number(raw ?? 0)
  return Number.isFinite(n) ? n.toLocaleString('es-CR') : '0'
}

// T24 — Stat cards según wireframe dashboard_openpaw:
//   · icono gigante decorativo al 10% de opacidad (escala + brilla al hover)
//   · chip circular tintado del tono + label uppercase
//   · número grande formateado.
// `card.alert` marca la card de alertas (solicitudes pendientes, única fuente
// real de "alertas" que expone /usuarios/me/stats): solo entra en modo
// crítico —tinte --md-error-container, número en --md-error y badge
// "Críticas" con animación pulse— cuando el valor real es > 0; con 0 queda
// neutra y sin badge para no alarmar sin causa.
export function StatCards({ config, data }) {
  if (!config?.length) return null

  return (
    <div className={'dashboard-stats' + ((config?.length ?? 0) >= 4 ? ' dashboard-stats--grid' : '')}>
      {config.map((card) => {
        const value = Number(data?.[card.key] ?? 0)
        const critical = Boolean(card.alert) && value > 0
        const classes = [
          'stat-card',
          card.tone && `stat-card--${card.tone}`,
          critical && 'stat-card--critical',
        ].filter(Boolean).join(' ')

        return (
          <div key={card.key} className={classes}>
            <span className="stat-card__ghost" aria-hidden="true">
              <Icon name={card.icon} filled />
            </span>
            <div className="stat-card__head">
              <span className="stat-card__chip" aria-hidden="true">
                <Icon name={card.chipIcon || card.icon} size="20px" filled />
              </span>
              <div className="stat-card__label">{card.label}</div>
            </div>
            <div className="stat-card__value">
              <span className="stat-card__number">{formatValue(value)}</span>
              {critical && (
                <span className="stat-card__flag">Críticas</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
