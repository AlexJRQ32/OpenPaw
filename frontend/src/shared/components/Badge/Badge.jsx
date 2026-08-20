import './badge.css'

export function Badge({ variant = 'pending', className = '', children, ...props }) {
  return (
    <span className={`badge badge--${variant} ${className}`} {...props}>
      {children}
    </span>
  )
}
