import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../../shared/components/AppShell/AppShell'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Button } from '../../../shared/components/Button/Button'
import { Badge } from '../../../shared/components/Badge/Badge'
import { Icon } from '../../../shared/components/Icon/Icon'
import { Timeline } from '../../../shared/components/Timeline/Timeline'
import { RingProgress } from '../../../shared/components/RingProgress/RingProgress'
import { BarChart } from '../../../shared/components/BarChart/BarChart'
import { Fab } from '../../../shared/components/Fab/Fab'
import { Modal } from '../../../shared/components/Modal/Modal'
import { useExpediente } from '../hooks/useExpediente'
import './ExpedientePage.css'

const TIPO_APORTE_OPCIONES = ['Consulta', 'Tratamiento', 'Vacuna', 'Emergencia']

function edadDe(m) {
  if (!m?.fechaNacimiento) return ''
  const nac = new Date(m.fechaNacimiento)
  if (Number.isNaN(nac.getTime())) return ''
  const diff = Date.now() - nac.getTime()
  const years = Math.floor(diff / (365.25 * 24 * 3600 * 1000))
  if (years >= 1) return `${years} año${years === 1 ? '' : 's'}`
  const months = Math.max(1, Math.floor(diff / (30.44 * 24 * 3600 * 1000)))
  return `${months} mes${months === 1 ? '' : 'es'}`
}

/* Card del bento de selección de mascota (patrón wireframe: activa con
   tinte primary + dot pulsante; inactivas atenuadas). */
function BentoCard({ mascota, activa, onSelect }) {
  return (
    <button
      type="button"
      className={`expediente-bento__card${activa ? ' expediente-bento__card--active' : ''}`}
      onClick={() => onSelect(String(mascota.id))}
      aria-pressed={activa}
      aria-label={`Seleccionar ${mascota.nombre}`}
    >
      <span className="expediente-bento__foto" aria-hidden="true">
        {mascota.fotoUrl ? (
          <img src={mascota.fotoUrl} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className="expediente-bento__fallback"><Icon name="pets" size={26} filled /></span>
        )}
      </span>
      <span className="expediente-bento__info">
        <span className="expediente-bento__nombre">
          {mascota.nombre}
          {activa && <Icon name="pets" size={16} filled className="expediente-bento__paw" />}
        </span>
        <span className="expediente-bento__meta">
          {[mascota.raza || mascota.especie, edadDe(mascota)].filter(Boolean).join(' • ') || mascota.especie}
        </span>
      </span>
      {activa && <span className="expediente-bento__dot" aria-hidden="true" />}
    </button>
  )
}

function CheckRow({ label, ok, valor }) {
  return (
    <li className="expediente-check">
      <span className="expediente-check__label">{label}</span>
      {ok ? (
        <span className="expediente-check__ok">
          <Icon name="check_circle" size={20} filled />
        </span>
      ) : (
        <span className="expediente-check__pending">
          <Icon name="schedule" size={20} />
          {valor ? <span className="expediente-check__valor">{valor}</span> : null}
        </span>
      )}
    </li>
  )
}

export function ExpedientePage() {
  const navigate = useNavigate()
  const {
    esCliente,
    mascotas,
    listStatus,
    listError,
    selectedId,
    setSelectedId,
    mascotaSeleccionada,
    timelineStatus,
    timelineError,
    activeFilter,
    setActiveFilter,
    filtradas,
    totalRegistros,
    score,
    scoreLabel,
    vacunasAlDia,
    desparasitado,
    proximaCitaTexto,
    pesoData,
    modalOpen,
    form,
    errors,
    submitStatus,
    submitError,
    abrirNueva,
    cerrar,
    handleChange,
    guardar,
    FILTROS,
  } = useExpediente()

  const fabLabel = esCliente ? 'Nuevo aporte' : 'Nueva consulta'
  const maxDatetime = new Date().toISOString().slice(0, 16)

  return (
    <AppShell>
      <div className="expediente-page">
        <div className="expediente-decor" aria-hidden="true" />

        {/* Header: eyebrow + título + contador de registros (wireframe) */}
        <header className="expediente-hero">
          <div>
            <span className="expediente-eyebrow">Expediente Médico</span>
            <h1 className="expediente-title">Historial Clínico</h1>
          </div>
          <div className="expediente-stat" aria-label={`${totalRegistros} registros totales`}>
            <span className="expediente-stat__icon" aria-hidden="true">
              <Icon name="verified" size={24} filled />
            </span>
            <div>
              <p className="expediente-stat__num">{totalRegistros}</p>
              <p className="expediente-stat__label">Registros Totales</p>
            </div>
          </div>
        </header>

        {/* Pet selector bento (wireframe: 2 pets + añadir) */}
        <section className="expediente-bento" aria-label="Seleccionar mascota">
          {mascotas.map((m) => (
            <BentoCard
              key={m.id}
              mascota={m}
              activa={String(m.id) === String(selectedId)}
              onSelect={setSelectedId}
            />
          ))}
          {esCliente && (
            <button
              type="button"
              className="expediente-bento__add"
              onClick={() => navigate('/dashboard/mascotas')}
            >
              <Icon name="add_circle" size={26} />
              <span>Añadir Mascota</span>
            </button>
          )}
        </section>

        {/* Layout principal: timeline + sidebar de resumen */}
        <div className="expediente-layout">
          <section className="expediente-main" aria-label="Historial médico">
            {/* Barra de filtros sticky (patrón wireframe) */}
            <div className="expediente-filter" role="group" aria-label="Filtrar historial">
              <div className="expediente-filter__pills">
                {FILTROS.map((filtro) => (
                  <button
                    key={filtro}
                    type="button"
                    className={`expediente-pill${activeFilter === filtro ? ' expediente-pill--active' : ''}`}
                    onClick={() => setActiveFilter(filtro)}
                    aria-pressed={activeFilter === filtro}
                  >
                    {filtro === 'todos' ? 'Todos' : filtro}
                  </button>
                ))}
              </div>
              <span className="expediente-filter__icon" aria-hidden="true">
                <Icon name="filter_list" size={20} />
              </span>
            </div>

            {timelineStatus === 'loading' && (
              <div className="spinner-wrap"><span className="spinner" /></div>
            )}

            {listStatus === 'error' && <p className="expediente-error">{listError}</p>}

            {timelineStatus === 'error' && <p className="expediente-error">{timelineError}</p>}

            {timelineStatus === 'loaded' && !mascotaSeleccionada && (
              <EmptyState
                icon="pets"
                title={mascotas.length === 0 ? 'Sin mascotas registradas' : 'Selecciona una mascota'}
                description={
                  mascotas.length === 0
                    ? 'No hay mascotas disponibles para consultar su expediente.'
                    : 'Elige una mascota del selector para ver su expediente.'
                }
              />
            )}

            {timelineStatus === 'loaded' && mascotaSeleccionada && filtradas.length === 0 && (
              <EmptyState
                icon="medical_services"
                title="Sin registros en este filtro"
                description={
                  entriesEmptyHint(totalRegistros, activeFilter)
                }
              />
            )}

            {timelineStatus === 'loaded' && mascotaSeleccionada && filtradas.length > 0 && (
              <Timeline
                items={filtradas}
                ariaLabel={`Historial médico de ${mascotaSeleccionada.nombre}`}
              />
            )}
          </section>

          {/* Sidebar: índice de salud + peso + precaución */}
          <aside className="expediente-side" aria-label="Resumen de salud">
            <section className="expediente-card expediente-health">
              <h3 className="expediente-card__title">Índice de Salud</h3>
              <div className="expediente-health__ring">
                <RingProgress
                  value={score}
                  label={`${score}%`}
                  sublabel={scoreLabel}
                  ariaLabel={`Índice de salud de ${mascotaSeleccionada?.nombre || 'la mascota'}: ${score} por ciento, ${scoreLabel}`}
                />
              </div>
              <ul className="expediente-health__checks">
                <CheckRow label="Vacunas al día" ok={vacunasAlDia} valor={vacunasAlDia ? '' : 'Sin registro'} />
                <CheckRow label="Desparasitación" ok={desparasitado} valor={desparasitado ? '' : 'Sin registro'} />
                <li className="expediente-check">
                  <span className="expediente-check__label">Próxima Cita</span>
                  <span className="expediente-check__next">{proximaCitaTexto}</span>
                </li>
              </ul>
            </section>

            <section className="expediente-card expediente-weight">
              <div className="expediente-weight__head">
                <h3 className="expediente-card__title">Historial de Peso</h3>
                <Badge variant="neutral" icon="data_usage">Datos estimados</Badge>
              </div>
              {pesoData.length > 0 ? (
                <BarChart
                  data={pesoData}
                  highlightIndex={pesoData.length - 1}
                  height={120}
                  ariaLabel={`Historial de peso estimado de ${mascotaSeleccionada?.nombre || 'la mascota'}: ${pesoData.map((p) => `${p.label}: ${p.value} kg`).join(', ')}`}
                />
              ) : (
                <p className="expediente-weight__empty">Sin peso registrado.</p>
              )}
              <p className="expediente-weight__demo">
                Serie estimada a partir del peso actual ({mascotaSeleccionada?.peso != null ? `${mascotaSeleccionada.peso} kg` : '—'}).
              </p>
            </section>

            <section className="expediente-card expediente-alert">
              <span className="expediente-alert__watermark" aria-hidden="true">ALERGIA</span>
              <div className="expediente-alert__content">
                <div className="expediente-alert__head">
                  <Icon name="warning" size={20} className="expediente-alert__icon" />
                  <h4 className="expediente-alert__title">Precaución</h4>
                </div>
                <p className="expediente-alert__text">
                  Sin alergias documentadas en el historial.
                </p>
              </div>
            </section>
          </aside>
        </div>

        {/* FAB: acción principal (nuevo aporte para cliente / nueva consulta
            para funcionario). Deshabilitado sin mascota seleccionada. */}
        <Fab label={fabLabel} icon="add" onClick={abrirNueva} disabled={!mascotaSeleccionada} />

        {/* Modal de registro (wireframe: FAB "+") */}
        <Modal open={modalOpen} onClose={cerrar} className="expediente-modal">
          <div>
            <h2 className="expediente-modal__title">
              {esCliente ? 'Nuevo aporte de expediente' : 'Nueva consulta'}
            </h2>
            <p className="expediente-modal__subtitle">
              Para {mascotaSeleccionada?.nombre || 'la mascota seleccionada'}
            </p>
            <form onSubmit={guardar} noValidate>
              <div className="expediente-modal__grid">
                {esCliente ? (
                  <>
                    <label className="expediente-field">
                      <span>Veterinaria</span>
                      <input
                        type="text"
                        name="veterinariaNombre"
                        value={form.veterinariaNombre}
                        onChange={handleChange}
                        placeholder="Nombre de la veterinaria externa"
                      />
                      {errors.veterinariaNombre && <small>{errors.veterinariaNombre}</small>}
                    </label>
                    <label className="expediente-field">
                      <span>Fecha de atención</span>
                      <input
                        type="datetime-local"
                        name="fechaAtencion"
                        value={form.fechaAtencion}
                        onChange={handleChange}
                        max={maxDatetime}
                      />
                      {errors.fechaAtencion && <small>{errors.fechaAtencion}</small>}
                    </label>
                    <label className="expediente-field">
                      <span>Tipo de atención</span>
                      <select name="tipoAtencion" value={form.tipoAtencion} onChange={handleChange}>
                        {TIPO_APORTE_OPCIONES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      {errors.tipoAtencion && <small>{errors.tipoAtencion}</small>}
                    </label>
                    <label className="expediente-field expediente-field--full">
                      <span>Descripción</span>
                      <textarea
                        name="descripcion"
                        value={form.descripcion}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Describe la atención recibida"
                      />
                      {errors.descripcion && <small>{errors.descripcion}</small>}
                    </label>
                    <label className="expediente-field expediente-field--full">
                      <span>Diagnóstico (opcional)</span>
                      <textarea
                        name="diagnostico"
                        value={form.diagnostico}
                        onChange={handleChange}
                        rows="2"
                        placeholder="Diagnóstico de la atención"
                      />
                    </label>
                    <label className="expediente-field expediente-field--full">
                      <span>Medicamentos (opcional)</span>
                      <input
                        type="text"
                        name="medicamentos"
                        value={form.medicamentos}
                        onChange={handleChange}
                        placeholder="Medicamentos indicados"
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label className="expediente-field expediente-field--full">
                      <span>Diagnóstico</span>
                      <textarea
                        name="diagnostico"
                        value={form.diagnostico}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Diagnóstico de la consulta"
                      />
                      {errors.diagnostico && <small>{errors.diagnostico}</small>}
                    </label>
                    <label className="expediente-field expediente-field--full">
                      <span>Tratamiento (opcional)</span>
                      <textarea
                        name="tratamiento"
                        value={form.tratamiento}
                        onChange={handleChange}
                        rows="2"
                        placeholder="Tratamiento indicado"
                      />
                    </label>
                    <label className="expediente-field expediente-field--full">
                      <span>Observaciones (opcional)</span>
                      <textarea
                        name="observaciones"
                        value={form.observaciones}
                        onChange={handleChange}
                        rows="2"
                        placeholder="Notas del veterinario"
                      />
                    </label>
                    <label className="expediente-field">
                      <span>URL receta (opcional)</span>
                      <input
                        type="url"
                        name="recetaUrl"
                        value={form.recetaUrl}
                        onChange={handleChange}
                        placeholder="https://..."
                      />
                    </label>
                    <label className="expediente-field">
                      <span>URL archivo (opcional)</span>
                      <input
                        type="url"
                        name="archivoUrl"
                        value={form.archivoUrl}
                        onChange={handleChange}
                        placeholder="https://..."
                      />
                    </label>
                  </>
                )}
              </div>
              {submitError && <p className="expediente-submit-error" role="alert">{submitError}</p>}
              <div className="expediente-modal__actions">
                <Button variant="secondary" type="button" onClick={cerrar}>Cancelar</Button>
                <Button variant="primary" type="submit" disabled={submitStatus === 'submitting'}>
                  {submitStatus === 'submitting'
                    ? 'Guardando...'
                    : esCliente ? 'Registrar aporte' : 'Registrar consulta'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </AppShell>
  )
}

function entriesEmptyHint(total, filtro) {
  if (total === 0) return 'Esta mascota no tiene registros en su expediente todavía.'
  return `No hay registros de tipo "${filtro}" para esta mascota.`
}

export default ExpedientePage