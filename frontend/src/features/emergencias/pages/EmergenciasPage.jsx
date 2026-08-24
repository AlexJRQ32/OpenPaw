import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../shared/components/Button/Button'
import { Modal } from '../../../shared/components/Modal/Modal'
import { Badge } from '../../../shared/components/Badge/Badge'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import { EmptyState } from '../../../shared/components/EmptyState'
import { PetSelector } from '../../../shared/components/PetSelector/PetSelector'
import { Icon } from '../../../shared/components/Icon/Icon'
import { useEmergencias } from '../hooks/useEmergencias'
import './EmergenciasPage.css'

/* ---------------------------------------------------------------------------
   Severidad — NO solo color: cada nivel lleva icono + texto (wireframe:
   warning / priority_high / check_circle) ademas del contenedor M3.
   --------------------------------------------------------------------------- */
const SEVERIDAD_CONFIG = {
  Nivel1_Critico: { label: 'Nivel 1 - Crítico', variant: 'danger', icon: 'warning', filled: true },
  Nivel2_Urgente: { label: 'Nivel 2 - Urgente', variant: 'warning', icon: 'priority_high', filled: false },
  Resuelto: { label: 'Resuelto', variant: 'success', icon: 'check_circle', filled: false },
}

function severidadDe(emergencia) {
  return SEVERIDAD_CONFIG[emergencia?.nivelSeveridad] || SEVERIDAD_CONFIG.Nivel2_Urgente
}

function SeveridadBadge({ nivelSeveridad, className = '' }) {
  const cfg = SEVERIDAD_CONFIG[nivelSeveridad] || { label: nivelSeveridad || 'Sin nivel', variant: 'neutral', icon: 'help', filled: false }
  return (
    <Badge variant={cfg.variant} icon={cfg.icon} className={`emerg-badge ${className}`.trim()}>
      {cfg.label}
    </Badge>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return '—'
  return fecha.toLocaleString('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/* ---------------------------------------------------------------------------
   Signos vitales — tarjeta 2x2 del wireframe. Los valores anormales se marcan
   con icono warning (no solo color) + color error de token M3.
   --------------------------------------------------------------------------- */
const LIMITES_VITALES = {
  frecuenciaCardiaca: { min: 60, max: 140, unidad: 'bpm', etiqueta: 'Frecuencia Cardíaca' },
  saturacionO2: { min: 90, max: 100, unidad: '%', etiqueta: 'Saturación O2' },
  temperatura: { min: 37.5, max: 39.5, unidad: '°C', etiqueta: 'Temperatura' },
}

function esAnormal(em, campo) {
  const valor = em[campo]
  if (valor === null || valor === undefined || valor === '') return false
  const limite = LIMITES_VITALES[campo]
  return Number(valor) < limite.min || Number(valor) > limite.max
}

function VitalMetric({ em, campo }) {
  const limite = LIMITES_VITALES[campo]
  const valor = em[campo]
  const anormal = esAnormal(em, campo)
  if (valor === null || valor === undefined || valor === '') {
    return (
      <div className="vital-cell">
        <span className="vital-cell__label">{limite.etiqueta}</span>
        <span className="vital-cell__value vital-cell__value--empty">—</span>
      </div>
    )
  }
  return (
    <div className={`vital-cell ${anormal ? 'vital-cell--anormal' : ''}`.trim()}>
      <span className="vital-cell__label">
        {limite.etiqueta}
        {anormal && <Icon name="warning" size={14} filled className="vital-cell__warn" aria-hidden="true" />}
      </span>
      <span className="vital-cell__value">
        {valor}
        <span className="vital-cell__unit"> {limite.unidad}</span>
      </span>
    </div>
  )
}

function VitalesGrid({ emergencia }) {
  return (
    <div className="vitales-grid" role="group" aria-label="Signos vitales">
      <VitalMetric em={emergencia} campo="frecuenciaCardiaca" />
      <VitalMetric em={emergencia} campo="saturacionO2" />
      <VitalMetric em={emergencia} campo="temperatura" />
      <div className="vital-cell">
        <span className="vital-cell__label">Estado</span>
        <span className="vital-cell__value">{emergencia.estadoPaciente || '—'}</span>
      </div>
    </div>
  )
}

function TratamientoList({ emergencia }) {
  const items = useMemo(() => {
    if (!emergencia.tratamientoAplicado) return []
    return emergencia.tratamientoAplicado
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean)
  }, [emergencia.tratamientoAplicado])

  if (items.length === 0) {
    return <p className="tratamiento-empty">Sin tratamiento registrado</p>
  }
  return (
    <ul className="tratamiento-list">
      {items.map((item, idx) => (
        <li key={idx} className="tratamiento-item">
          <Icon name="vaccines" size={18} className="tratamiento-item__icon" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

/* ---------------------------------------------------------------------------
   Tarjeta critica destacada (wireframe): barra error izquierda, glow en hover,
   panel derecho con signos vitales + tratamiento administrado.
   --------------------------------------------------------------------------- */
function EmergenciaCritica({ emergencia, nombreMascota, esCliente, onVerDetalles }) {
  const cfg = severidadDe(emergencia)
  return (
    <article className="emerg-card emerg-card--critica" aria-label="Emergencia crítica destacada">
      <div className="emerg-card__glow" aria-hidden="true" />
      <div className="emerg-card__accent" aria-hidden="true" />
      <div className="emerg-card__cuerpo">
        <div className="emerg-card__top">
          <Badge variant={cfg.variant} icon={cfg.icon} filled={cfg.filled} className="emerg-badge">
            {cfg.label}
          </Badge>
          <span className="emerg-date">
            <Icon name="calendar_today" size={16} aria-hidden="true" />
            {formatDate(emergencia.fechaAtencion)}
          </span>
        </div>
        <h2 className="emerg-card__titulo">{emergencia.motivo}</h2>
        <p className="emerg-card__descripcion">
          {emergencia.sintomas ||
            `Atención de emergencia registrada para ${nombreMascota || `mascota #${emergencia.mascotaId}`}.`}
        </p>
        <div className="emerg-card__meta">
          <span className="emerg-meta-medico">
            <span className="emerg-meta-medico__avatar" aria-hidden="true">
              <Icon name="stethoscope" size={18} />
            </span>
            {emergencia.medicoACargo || 'Médico no asignado'}
          </span>
          <span className="emerg-meta-sep" aria-hidden="true" />
          <Link
            className="emerg-meta-expediente"
            to={esCliente ? '/dashboard/aportes' : '/dashboard/mascotas'}
          >
            Ver Expediente Completo
            <Icon name="arrow_forward" size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div className="emerg-card__datos">
        <VitalesGrid emergencia={emergencia} />
        <div className="tratamiento-block">
          <h4 className="tratamiento-titulo">Tratamiento Administrado</h4>
          <TratamientoList emergencia={emergencia} />
        </div>
        <div className="emerg-card__datos-footer">
          <span className="emerg-card__paciente">
            <Icon name="pets" size={16} aria-hidden="true" />
            {nombreMascota || `Mascota #${emergencia.mascotaId}`}
          </span>
          <Button variant="ghost" size="sm" icon="visibility" onClick={() => onVerDetalles(emergencia)}>
            Ver Detalles
          </Button>
        </div>
      </div>
    </article>
  )
}

/* ---------------------------------------------------------------------------
   Tarjeta secundaria (wireframe): badge severidad + fecha, motivo, descripcion
   recortada, mini-grid Procedimiento/Diagnostico y boton Ver Detalles.
   --------------------------------------------------------------------------- */
function EmergenciaCard({ emergencia, nombreMascota, onVerDetalles }) {
  return (
    <article className="emerg-card emerg-card--secundaria">
      <div className="emerg-card__top">
        <SeveridadBadge nivelSeveridad={emergencia.nivelSeveridad} />
        <span className="emerg-date">{formatDate(emergencia.fechaAtencion)}</span>
      </div>
      <h3 className="emerg-card__titulo">
        {emergencia.motivo}
        {nombreMascota && <span className="emerg-card__mascota"> · {nombreMascota}</span>}
      </h3>
      <p className="emerg-card__descripcion emerg-card__descripcion--clamp">
        {emergencia.sintomas || 'Sin síntomas registrados.'}
      </p>
      <div className="emerg-card__mini">
        <div>
          <span className="emerg-card__mini-label">Procedimiento</span>
          <span className="emerg-card__mini-valor">{emergencia.tratamientoAplicado || '—'}</span>
        </div>
        <div>
          <span className="emerg-card__mini-label">Diagnóstico</span>
          <span className="emerg-card__mini-valor">{emergencia.diagnostico || '—'}</span>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="emerg-card__accion"
        icon="visibility"
        onClick={() => onVerDetalles(emergencia)}
      >
        Ver Detalles
      </Button>
    </article>
  )
}

export function EmergenciasPage() {
  const {
    esCliente,
    emergencias,
    mascotas,
    mascotaFiltro,
    setMascotaFiltro,
    listStatus,
    listError,
    modalOpen,
    form,
    errors,
    submitStatus,
    submitError,
    updateStatus,
    updateError,
    abrirNueva,
    cerrar,
    handleChange,
    guardar,
    actualizarEstado,
  } = useEmergencias()

  const [detalle, setDetalle] = useState(null)
  const [nuevaSeveridad, setNuevaSeveridad] = useState('')

  const mascotaPorId = useMemo(() => {
    const mapa = {}
    for (const m of mascotas) mapa[m.id] = m
    return mapa
  }, [mascotas])

  const nombreMascota = (id) => mascotaPorId[id]?.nombre || null

  const ordenadas = useMemo(
    () => emergencias.slice().sort((a, b) => new Date(b.fechaAtencion) - new Date(a.fechaAtencion)),
    [emergencias]
  )

  /* La critica destacada = la mas reciente con severidad critica; el resto va a la grilla */
  const critica = ordenadas.find((em) => em.nivelSeveridad === 'Nivel1_Critico')
  const resto = ordenadas.filter((em) => em !== critica)

  const abrirDetalle = (em) => {
    setDetalle(em)
    setNuevaSeveridad(em.nivelSeveridad)
  }

  const guardarEstado = async () => {
    if (!detalle || nuevaSeveridad === detalle.nivelSeveridad) return
    const ok = await actualizarEstado(detalle.id, nuevaSeveridad)
    if (ok) setDetalle((prev) => (prev ? { ...prev, nivelSeveridad: nuevaSeveridad } : prev))
  }

  const hayMascotas = mascotas.length > 0
  const mostrarVacio = listStatus === 'loaded' && emergencias.length === 0

  return (
    <AppShell>
      <div className="emergencias-page">
        <header className="emergencias-header">
          <div>
            <h1 className="emergencias-title">Registro de Emergencias</h1>
            <p className="emergencias-subtitle">
              Historial detallado de eventos críticos y atenciones de urgencia.
            </p>
          </div>
          <div className="emergencias-header-actions">
            <div className="emergencias-paciente">
              <label className="emergencias-paciente-label" id="emergencias-pet-label">
                Paciente:
              </label>
              <PetSelector
                pets={mascotas}
                value={mascotaFiltro}
                onChange={setMascotaFiltro}
                showAllOption
              />
            </div>
            <Button
              variant="primary"
              size="md"
              icon="add"
              onClick={() => abrirNueva(mascotaFiltro !== 'all' ? mascotaFiltro : undefined)}
              disabled={!hayMascotas}
            >
              Nueva Emergencia
            </Button>
          </div>
        </header>

        {listStatus === 'loading' && (
          <div className="emergencias-loading" role="status" aria-label="Cargando emergencias">
            <span className="spinner" />
          </div>
        )}

        {listStatus === 'error' && <p className="submit-error">{listError}</p>}

        {listStatus === 'loaded' && !hayMascotas && (
          <EmptyState
            icon="pets"
            title="Sin mascotas registradas"
            description="Necesitas al menos una mascota para registrar y consultar emergencias."
          />
        )}

        {mostrarVacio && hayMascotas && (
          <EmptyState
            icon="emergency"
            title="Sin emergencias registradas"
            description={
              mascotaFiltro === 'all'
                ? 'No hay emergencias para tus pacientes. Registra la primera cuando ocurra una urgencia.'
                : 'Esta mascota no tiene emergencias registradas.'
            }
            action={
              <Button variant="primary" icon="add" onClick={() => abrirNueva(mascotaFiltro !== 'all' ? mascotaFiltro : undefined)}>
                Registrar emergencia
              </Button>
            }
          />
        )}

        {listStatus === 'loaded' && ordenadas.length > 0 && (
          <div className="emergencias-contenido">
            {critica && (
              <EmergenciaCritica
                emergencia={critica}
                nombreMascota={nombreMascota(critica.mascotaId)}
                esCliente={esCliente}
                onVerDetalles={abrirDetalle}
              />
            )}
            {resto.length > 0 && (
              <div className="emergencias-grid">
                {resto.map((em) => (
                  <EmergenciaCard
                    key={em.id}
                    emergencia={em}
                    nombreMascota={nombreMascota(em.mascotaId)}
                    onVerDetalles={abrirDetalle}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------- Modal crear */}
        <Modal open={modalOpen} onClose={cerrar} className="emergencias-modal">
          <div>
            <h2>Registrar emergencia</h2>
            <form onSubmit={guardar} noValidate>
              <div className="field-grid">
                <label className="field">
                  <span>Mascota</span>
                  <select name="mascotaId" value={form.mascotaId} onChange={handleChange} required>
                    <option value="">Seleccionar mascota...</option>
                    {mascotas.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                  {errors.mascotaId && <small>{errors.mascotaId}</small>}
                </label>

                <label className="field">
                  <span>Fecha y hora de atencion</span>
                  <input type="datetime-local" name="fechaAtencion" value={form.fechaAtencion} onChange={handleChange} required />
                  {errors.fechaAtencion && <small>{errors.fechaAtencion}</small>}
                </label>

                <label className="field">
                  <span>Nivel de severidad</span>
                  <select name="nivelSeveridad" value={form.nivelSeveridad} onChange={handleChange}>
                    <option value="Nivel1_Critico">Nivel 1 - Crítico</option>
                    <option value="Nivel2_Urgente">Nivel 2 - Urgente</option>
                    <option value="Resuelto">Resuelto</option>
                  </select>
                </label>

                {!esCliente && (
                  <label className="field">
                    <span>¿Atendida en plataforma?</span>
                    <select
                      name="esEnPlataforma"
                      value={String(form.esEnPlataforma)}
                      onChange={(e) => handleChange({ target: { name: 'esEnPlataforma', value: e.target.value === 'true', type: 'select' } })}
                    >
                      <option value="false">No — veterinaria externa</option>
                      <option value="true">Si — con veterinaria de OpenPaw</option>
                    </select>
                  </label>
                )}

                {!form.esEnPlataforma && (
                  <label className="field field-full">
                    <span>Nombre de la veterinaria externa</span>
                    <input
                      type="text"
                      name="veterinariaNombreExterna"
                      value={form.veterinariaNombreExterna}
                      onChange={handleChange}
                      placeholder="Nombre del lugar donde se atendio la emergencia"
                    />
                    {errors.veterinariaNombreExterna && <small>{errors.veterinariaNombreExterna}</small>}
                  </label>
                )}

                <label className="field field-full">
                  <span>Motivo</span>
                  <input type="text" name="motivo" value={form.motivo} onChange={handleChange} required placeholder="Motivo de la emergencia" />
                  {errors.motivo && <small>{errors.motivo}</small>}
                </label>

                <label className="field field-full">
                  <span>Sintomas (opcional)</span>
                  <textarea name="sintomas" value={form.sintomas} onChange={handleChange} rows="2" placeholder="Describe los sintomas observados" />
                </label>

                <label className="field">
                  <span>Frecuencia cardíaca (bpm)</span>
                  <input type="number" name="frecuenciaCardiaca" min="1" max="300" value={form.frecuenciaCardiaca} onChange={handleChange} placeholder="Ej: 120" />
                  {errors.frecuenciaCardiaca && <small>{errors.frecuenciaCardiaca}</small>}
                </label>

                <label className="field">
                  <span>Saturación O2 (%)</span>
                  <input type="number" name="saturacionO2" min="1" max="100" value={form.saturacionO2} onChange={handleChange} placeholder="Ej: 95" />
                  {errors.saturacionO2 && <small>{errors.saturacionO2}</small>}
                </label>

                <label className="field">
                  <span>Temperatura (°C)</span>
                  <input type="number" name="temperatura" min="30" max="46" step="0.1" value={form.temperatura} onChange={handleChange} placeholder="Ej: 38.6" />
                  {errors.temperatura && <small>{errors.temperatura}</small>}
                </label>

                <label className="field">
                  <span>Estado del paciente</span>
                  <input type="text" name="estadoPaciente" value={form.estadoPaciente} onChange={handleChange} placeholder="Ej: Estable" />
                </label>

                <label className="field field-full">
                  <span>Tratamiento aplicado (opcional)</span>
                  <textarea name="tratamientoAplicado" value={form.tratamientoAplicado} onChange={handleChange} rows="2" placeholder="Tratamiento o medicamentos administrados" />
                </label>

                <label className="field field-full">
                  <span>Diagnóstico (opcional)</span>
                  <input type="text" name="diagnostico" value={form.diagnostico} onChange={handleChange} placeholder="Diagnóstico del caso" />
                </label>

                <label className="field field-full">
                  <span>Médico a cargo (opcional)</span>
                  <input type="text" name="medicoACargo" value={form.medicoACargo} onChange={handleChange} placeholder="Nombre del médico que atendio" />
                </label>

                <label className="field field-full">
                  <span>URL de archivo adjunto (opcional)</span>
                  <input type="url" name="archivoAdjuntoUrl" value={form.archivoAdjuntoUrl} onChange={handleChange} placeholder="https://..." />
                </label>
              </div>
              {submitError && <p className="submit-error">{submitError}</p>}
              <div className="emergencias-modal-actions">
                <Button variant="secondary" type="button" onClick={cerrar}>Cancelar</Button>
                <Button variant="primary" type="submit" disabled={submitStatus === 'submitting'}>
                  {submitStatus === 'submitting' ? 'Guardando...' : 'Registrar emergencia'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        {/* ------------------------------------------------------- Modal detalle */}
        <Modal open={Boolean(detalle)} onClose={() => setDetalle(null)} className="emergencias-modal">
          {detalle && (
            <div className="emergencia-detalle" role="dialog" aria-modal="true" aria-label="Detalle de la emergencia">
              <div className="emergencia-detalle__head">
                <SeveridadBadge nivelSeveridad={detalle.nivelSeveridad} />
                <span className="emerg-date">
                  <Icon name="calendar_today" size={16} aria-hidden="true" />
                  {formatDate(detalle.fechaAtencion)}
                </span>
              </div>
              <h2 className="emergencia-detalle__titulo">{detalle.motivo}</h2>
              <p className="emergencia-detalle__paciente">
                <Icon name="pets" size={16} aria-hidden="true" />
                {nombreMascota(detalle.mascotaId) || `Mascota #${detalle.mascotaId}`}
                {detalle.esEnPlataforma
                  ? ` · Veterinaria ${detalle.veterinariaId ? 'OpenPaw' : '—'}`
                  : ` · ${detalle.veterinariaNombreExterna || 'Veterinaria externa'}`}
              </p>

              <VitalesGrid emergencia={detalle} />

              <dl className="emergencia-detalle__grid">
                <div>
                  <dt>Síntomas</dt>
                  <dd>{detalle.sintomas || '—'}</dd>
                </div>
                <div>
                  <dt>Tratamiento aplicado</dt>
                  <dd>{detalle.tratamientoAplicado || '—'}</dd>
                </div>
                <div>
                  <dt>Diagnóstico</dt>
                  <dd>{detalle.diagnostico || '—'}</dd>
                </div>
                <div>
                  <dt>Médico a cargo</dt>
                  <dd>{detalle.medicoACargo || '—'}</dd>
                </div>
              </dl>

              {detalle.archivoAdjuntoUrl && (
                <a className="emergencias-adjunto" href={detalle.archivoAdjuntoUrl} target="_blank" rel="noopener noreferrer">
                  <Icon name="attach_file" size={16} aria-hidden="true" /> Ver archivo adjunto
                </a>
              )}

              <div className="emergencia-detalle__estado">
                <label className="field field-full">
                  <span>Actualizar estado de la emergencia</span>
                  <select
                    value={nuevaSeveridad}
                    onChange={(e) => setNuevaSeveridad(e.target.value)}
                    aria-label="Nivel de severidad"
                  >
                    <option value="Nivel1_Critico">Nivel 1 - Crítico</option>
                    <option value="Nivel2_Urgente">Nivel 2 - Urgente</option>
                    <option value="Resuelto">Resuelto</option>
                  </select>
                  {updateError && <small>{updateError}</small>}
                </label>
                <Button
                  variant="primary"
                  size="md"
                  onClick={guardarEstado}
                  disabled={nuevaSeveridad === detalle.nivelSeveridad || updateStatus === 'submitting'}
                >
                  {updateStatus === 'submitting' ? 'Guardando...' : 'Guardar estado'}
                </Button>
              </div>

              <div className="emergencias-modal-actions">
                <Button variant="secondary" type="button" onClick={() => setDetalle(null)}>Cerrar</Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  )
}

export default EmergenciasPage