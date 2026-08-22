import { useId } from 'react'
import './pet-selector.css'
import { Icon } from '../Icon/Icon'

/**
 * PetSelector - selector de mascotas tipo tabs/pildoras con avatar
 * (Design System OpenPaw). Reemplaza al <select> actual del gap.
 *
 * Wireframe aportes_medicos: pildoras con avatar; la activa resaltada con
 * borde/sombra azul y foto visible, las inactivas atenuadas; "Ver Todos"
 * con icono pets.
 *
 * Accesibilidad: radios nativos -> semantica de radiogroup gratis
 * (navegacion con flechas, anuncio de seleccion por lectores de pantalla).
 *
 * Props:
 *   pets          Array de { id, nombre, fotoUrl? }.
 *   value         id seleccionado o 'all'.                    default 'all'
 *   onChange      (id) => void
 *   showAllOption Pildora extra "Ver Todos" con icono pets.   default false
 */
function getInitials(nombre = '') {
  const words = String(nombre).trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  return ((words[0][0] || '') + (words[1]?.[0] || '')).toUpperCase()
}

export function PetSelector({
  pets = [],
  value = 'all',
  onChange,
  showAllOption = false,
  className = '',
}) {
  const groupName = useId()

  const renderPill = ({ id, label, fotoUrl, isAll = false }) => {
    const selected = value === id
    const classes = ['pet-selector__pill', selected && 'is-active'].filter(Boolean).join(' ')

    return (
      <label className={classes} key={id}>
        <input
          type="radio"
          className="pet-selector__input"
          name={groupName}
          value={String(id)}
          checked={selected}
          onChange={() => onChange?.(id)}
        />
        {isAll ? (
          <span className="pet-selector__avatar" aria-hidden="true">
            <Icon name="pets" size={20} />
          </span>
        ) : fotoUrl ? (
          <img className="pet-selector__avatar" src={fotoUrl} alt="" aria-hidden="true" />
        ) : (
          <span className="pet-selector__avatar pet-selector__avatar--initials" aria-hidden="true">
            {getInitials(label)}
          </span>
        )}
        <span className="pet-selector__name">{label}</span>
      </label>
    )
  }

  return (
    <div role="radiogroup" aria-label="Seleccionar mascota" className={`pet-selector ${className}`.trim()}>
      {showAllOption && renderPill({ id: 'all', label: 'Ver Todos', isAll: true })}
      {pets.map((pet) => renderPill({ id: pet.id, label: pet.nombre, fotoUrl: pet.fotoUrl }))}
    </div>
  )
}
