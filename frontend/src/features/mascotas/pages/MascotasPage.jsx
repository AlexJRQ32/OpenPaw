import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Button } from '../../../shared/components/Button/Button'
import { Badge } from '../../../shared/components/Badge/Badge'
import { Icon } from '../../../shared/components/Icon/Icon'
import { Modal } from '../../../shared/components/Modal/Modal'
import { Field } from '../../../shared/components/Field/Field'
import { useMascotas } from '../hooks/useMascotas'
import './MascotasPage.css'

/* Filtro ?q= : normaliza y compara contra nombre / especie / raza / dueño */
function mascotaCoincideQ(mascota, qNorm) {
  if (!qNorm) return true
  const campos = [
    mascota.nombre,
    mascota.especie,
    mascota.raza,
    mascota['DueñoNombre'],
    mascota['Due\xf1oNombre'],
    mascota.duenoNombre,
    mascota.duenioNombre,
    mascota.ownerName,
    mascota.propietario,
    mascota.veterinaria,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return campos.includes(qNorm)
}

const SEXO_MAP = { 1: 'Macho', 2: 'Hembra' }
const SEXO_ICON = { 1: 'male', 2: 'female' }
const ESTADO_SALUDABLE = 'Saludable'
const ESTADO_TRATAMIENTO = 'Tratamiento'

function valorONada(valor) {
  return valor ? valor : '—'
}

// Fecha corta estilo wireframe ("12 Oct"): es-CR da "12 oct" y se capitaliza.
const fechaCorta = new Intl.DateTimeFormat('es-CR', { day: 'numeric', month: 'short' })

function formatearFecha(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return ''
  // es-CR da "12 oct" (el día es numérico): se capitaliza la palabra del mes.
  const label = fechaCorta
    .format(d)
    .split(' ')
    .map((palabra, i) => (i === 0 ? palabra : palabra.charAt(0).toUpperCase() + palabra.slice(1)))
    .join(' ')
  return label
}

function esMismoDia(fecha, ref = new Date()) {
  if (!fecha) return false
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return false
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  )
}

// "Alerta" = vacuna o medicación con fecha de HOY o vencida: requiere atención
// ahora → ring/borde en error (spec T26).
function fechaPendiente(fecha, ref = new Date()) {
  if (!fecha) return false
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return false
  const hoy = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())
  return d.getTime() <= hoy.getTime()
}

function tieneAlerta(m) {
  return fechaPendiente(m.proximaVacunaFecha) || fechaPendiente(m.proximaMedicacionFecha)
}

function estadoDe(m) {
  return m.estadoSalud || ESTADO_SALUDABLE
}

function ringTone(m) {
  if (tieneAlerta(m)) return 'error'
  return estadoDe(m) === ESTADO_TRATAMIENTO ? 'tertiary' : 'primary'
}

function etiquetaFecha(fecha) {
  if (esMismoDia(fecha)) return 'Hoy'
  return formatearFecha(fecha) || 'Próx'
}

function MascotaCard({ mascota: m }) {
  const tono = ringTone(m)
  const estado = estadoDe(m)
  const badgeVariant = estado === ESTADO_TRATAMIENTO ? 'warning' : 'success'
  // QA M1: urgencia evaluada POR FILA — vacuna vencida no pinta la fila de
  // medicación y viceversa. El ring error global de la card se mantiene (tono).
  const urgenteVacuna = fechaPendiente(m.proximaVacunaFecha)
  const urgenteMedicacion = fechaPendiente(m.proximaMedicacionFecha)
  const sexo = SEXO_MAP[m.sexo]
  const sexoIcon = SEXO_ICON[m.sexo]
  const hayAlertas = Boolean(
    m.proximaVacuna || m.proximaVacunaFecha || m.medicacionActual || m.proximaMedicacionFecha
  )

  return (
    <article className={`mascota-card mascota-card--${tono}`}>
      <span className="mascota-card__glow" aria-hidden="true" />
      <div className="mascota-card__head">
        <div className="mascota-card__avatar">
          {m.fotoUrl ? (
            <img
              className="mascota-card__photo"
              src={m.fotoUrl}
              alt={`Foto de ${m.nombre}`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="mascota-card__fallback" aria-hidden="true">
              <Icon name="pets" size={34} filled />
            </span>
          )}
          <span className="mascota-card__minibadge" aria-hidden="true">
            <Icon name="pets" size={13} filled />
          </span>
        </div>
        <div className="mascota-card__identity">
          <h2 className="mascota-card__name">{m.nombre}</h2>
          <Badge variant={badgeVariant} dot>{estado}</Badge>
        </div>
      </div>

      <div className="mascota-card__details">
        <div className="mascota-detail">
          <p className="mascota-detail-label">Especie</p>
          <p className="mascota-detail-value">{valorONada(m.especie)}</p>
        </div>
        <div className="mascota-detail">
          <p className="mascota-detail-label">Raza</p>
          <p className="mascota-detail-value">{valorONada(m.raza)}</p>
        </div>
        <div className="mascota-detail">
          <p className="mascota-detail-label">Sexo</p>
          <p className="mascota-detail-value mascota-detail-value--sexo">
            {sexoIcon && <Icon name={sexoIcon} size={16} />}
            {sexo ?? '—'}
          </p>
        </div>
        <div className="mascota-detail">
          <p className="mascota-detail-label">Peso</p>
          <p className="mascota-detail-value">{m.peso != null ? `${m.peso} kg` : '—'}</p>
        </div>
        <div className="mascota-detail">
          <p className="mascota-detail-label">Color</p>
          <p className="mascota-detail-value">{valorONada(m.color)}</p>
        </div>
        <div className="mascota-detail">
          <p className="mascota-detail-label">Identificación</p>
          <p className="mascota-detail-value">{valorONada(m.identificacion)}</p>
        </div>
        {m.veterinaria && (
          <div className="mascota-detail mascota-detail--full">
            <p className="mascota-detail-label">Veterinaria</p>
            <p className="mascota-detail-value">{m.veterinaria}</p>
          </div>
        )}
      </div>

      {hayAlertas && (
        <footer className="mascota-card__alerts">
          {(m.proximaVacuna || m.proximaVacunaFecha) && (
            <div className={`mascota-alert${urgenteVacuna ? ' mascota-alert--urgent' : ''}`}>
              <Icon name="vaccines" size={18} />
              <span className="mascota-alert__text">Próx: {m.proximaVacuna || 'Vacuna'}</span>
              <span className="mascota-alert__date">{etiquetaFecha(m.proximaVacunaFecha)}</span>
            </div>
          )}
          {(m.medicacionActual || m.proximaMedicacionFecha) && (
            <div className={`mascota-alert${urgenteMedicacion ? ' mascota-alert--urgent' : ''}`}>
              <Icon name="medication" size={18} />
              <span className="mascota-alert__text">{m.medicacionActual || 'Medicación'}</span>
              <span className="mascota-alert__date">{etiquetaFecha(m.proximaMedicacionFecha)}</span>
            </div>
          )}
        </footer>
      )}
    </article>
  )
}

export function MascotasPage() {
  const {
    esCliente,
    mascotas,
    listStatus,
    listError,
    modalOpen,
    form,
    errors,
    submitStatus,
    submitError,
    abrir,
    cerrar,
    handleChange,
    guardar,
  } = useMascotas()

  const [searchParams, setSearchParams] = useSearchParams()
  const qParamRaw = searchParams.get('q') ?? ''
  const qNorm = qParamRaw.trim().toLowerCase()

  const [inputValue, setInputValue] = useState(qParamRaw)
  const [prevQ, setPrevQ] = useState(qParamRaw)
  // Sincroniza URL (?q=) → input sin useEffect (patrón ajuste durante render,
  // usado en Aportes/Inventario para evitar cascadas de effects). Cubre
  // navegación desde AppShell, back/forward y cambios externos de q.
  if (prevQ !== qParamRaw) {
    setPrevQ(qParamRaw)
    setInputValue(qParamRaw)
  }

  const handleInputChange = (event) => {
    const value = event.target.value
    setInputValue(value)
    const next = new URLSearchParams(searchParams)
    const trimmed = value.trim()
    if (trimmed) next.set('q', trimmed)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  const handleClear = () => {
    setInputValue('')
    const next = new URLSearchParams(searchParams)
    next.delete('q')
    setSearchParams(next, { replace: true })
  }

  const mascotasFiltradas = useMemo(() => {
    if (!qNorm) return mascotas
    return mascotas.filter((m) => mascotaCoincideQ(m, qNorm))
  }, [mascotas, qNorm])

  const hayFiltro = Boolean(qNorm)
  const total = mascotas.length
  const visibles = mascotasFiltradas.length

  return (
    <AppShell>
      <div className="mascotas-page">
        <header className="mascotas-header">
          <div>
            <h1 className="mascotas-title">
              <Icon name="pets" size={30} /> Mis Mascotas
            </h1>
            <p className="mascotas-subtitle">
              Gestiona la información y salud de tus compañeros peludos.
            </p>
          </div>
          {esCliente && (
            <Button variant="primary" size="md" icon="add" onClick={abrir}>
              Agregar mascota
            </Button>
          )}
        </header>

        {listStatus === 'loaded' && total > 0 && (
          <div className="mascotas-toolbar" role="search" aria-label="Filtrar mascotas">
            <div className="mascotas-search">
              <Icon name="search" size={18} className="mascotas-search__icon" aria-hidden="true" />
              <input
                className="mascotas-search__input"
                type="search"
                placeholder="Buscar por nombre, especie, raza o dueño…"
                aria-label="Buscar por nombre, especie, raza o dueño"
                value={inputValue}
                onChange={handleInputChange}
              />
              {inputValue && (
                <button
                  type="button"
                  className="mascotas-search__clear"
                  onClick={handleClear}
                  aria-label="Limpiar búsqueda"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
            <div className="mascotas-toolbar__meta">
              {hayFiltro ? (
                <span className="mascotas-toolbar__count">
                  <Badge variant={visibles === 0 ? 'warning' : 'neutral'}>{visibles} / {total}</Badge>
                  <span className="mascotas-toolbar__qtext">para &ldquo;{qParamRaw.trim()}&rdquo;</span>
                  <button type="button" className="mascotas-toolbar__clear" onClick={handleClear}>
                    Limpiar filtro
                  </button>
                </span>
              ) : (
                <span className="mascotas-toolbar__count">
                  <Badge variant="neutral">{total} {total === 1 ? 'mascota' : 'mascotas'}</Badge>
                </span>
              )}
            </div>
          </div>
        )}

        {listStatus === 'loading' && <div className="spinner-wrap"><span className="spinner" /></div>}

        {listStatus === 'error' && <p className="mascotas-error">{listError}</p>}

        {listStatus === 'loaded' && total === 0 && (
          <EmptyState title="Aun no tienes mascotas" description="Cuando registres una mascota aparecera aqui." />
        )}

        {listStatus === 'loaded' && total > 0 && visibles === 0 && (
          <EmptyState
            title={`Sin resultados para "${qParamRaw.trim()}"`}
            description="Prueba con otro nombre, especie, raza o dueño. El filtro no distingue mayúsculas."
            icon="search_off"
            action={
              <Button variant="secondary" size="md" icon="close" onClick={handleClear}>
                Limpiar búsqueda
              </Button>
            }
          />
        )}

        {listStatus === 'loaded' && visibles > 0 && (
          <div className="mascotas-grid">
            {mascotasFiltradas.map((m) => (
              <MascotaCard key={m.id} mascota={m} />
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={cerrar} className="mascotas-modal">
        <div className="mascotas-modal-header">
          <div className="mascotas-modal-icon" aria-hidden="true">
            <i className="fas fa-paw"></i>
          </div>
          <div className="mascotas-modal-heading">
            <h2 className="mascotas-modal-title">Agregar mascota</h2>
            <p className="mascotas-modal-subtitle">Completa los datos de tu nueva mascota.</p>
          </div>
          <button type="button" className="mascotas-modal-close" onClick={cerrar} aria-label="Cerrar">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={guardar} noValidate>
          <fieldset className="mascotas-form-section">
            <legend className="mascotas-form-section-title">
              <i className="fas fa-paw"></i>
              Informacion basica
            </legend>
            <div className="mascotas-field-grid">
              <Field
                className={`mascotas-field--required${errors.nombre ? ' mascotas-field--error' : ''}`}
                label="Nombre"
                name="nombre"
                value={form.nombre}
                error={errors.nombre}
                onChange={handleChange}
                placeholder="Ej: Luna"
              />
              <label className={`field mascotas-field--required${errors.especie ? ' mascotas-field--error' : ''}`}>
                <span>Especie</span>
                <select name="especie" value={form.especie} onChange={handleChange}>
                  <option value="">Seleccionar especie...</option>
                  <option value="Perro">Perro</option>
                  <option value="Gato">Gato</option>
                  <option value="Otro">Otro</option>
                </select>
                {errors.especie && <small>{errors.especie}</small>}
              </label>
              <label className={`field mascotas-field--required${errors.sexo ? ' mascotas-field--error' : ''}`}>
                <span>Sexo</span>
                <select name="sexo" value={form.sexo} onChange={handleChange}>
                  <option value="">Seleccionar sexo...</option>
                  <option value="1">Macho</option>
                  <option value="2">Hembra</option>
                </select>
                {errors.sexo && <small>{errors.sexo}</small>}
              </label>
              <label className="field">
                <span>Fecha de nacimiento</span>
                <input
                  type="date"
                  name="fechaNacimiento"
                  value={form.fechaNacimiento}
                  onChange={handleChange}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="mascotas-form-section">
            <legend className="mascotas-form-section-title">
              <i className="fas fa-sliders-h"></i>
              Detalles opcionales
            </legend>
            <div className="mascotas-field-grid">
              <Field
                label="Raza"
                name="raza"
                value={form.raza}
                onChange={handleChange}
                placeholder="Ej: Golden Retriever"
              />
              <Field
                className={errors.peso ? 'mascotas-field--error' : ''}
                label="Peso (kg)"
                name="peso"
                type="number"
                min="0"
                step="0.1"
                value={form.peso}
                error={errors.peso}
                onChange={handleChange}
                placeholder="0"
              />
              <Field
                label="Color"
                name="color"
                value={form.color}
                onChange={handleChange}
                placeholder="Ej: Cafe con blanco"
              />
              <Field
                label="Identificacion"
                name="identificacion"
                value={form.identificacion}
                onChange={handleChange}
                placeholder="Microchip, placa, etc."
              />
              <Field
                className="mascotas-field--full"
                label="Foto URL"
                name="fotoUrl"
                value={form.fotoUrl}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>
          </fieldset>

          <div className="mascotas-modal-footer">
            {submitError && (
              <p className="mascotas-submit-error" role="alert">
                <i className="fas fa-exclamation-circle"></i>
                {submitError}
              </p>
            )}
            <div className="mascotas-modal-actions">
              <Button variant="secondary" type="button" onClick={cerrar} disabled={submitStatus === 'submitting'}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={submitStatus === 'submitting'}>
                {submitStatus === 'submitting' ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Guardando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i> Guardar mascota
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </AppShell>
  )
}

export default MascotasPage