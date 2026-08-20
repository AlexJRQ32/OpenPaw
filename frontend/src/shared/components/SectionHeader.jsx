import './SectionHeader.css'

export function SectionHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`section-header ${className}`.trim()}>
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action ? <div className="section-header__action">{action}</div> : null}
    </div>
  )
}
