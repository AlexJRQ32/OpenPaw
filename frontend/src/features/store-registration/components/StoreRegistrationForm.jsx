import { useEffect, useRef, useState } from 'react'
import { Field } from '../../../shared/components/Field/Field'
import { Button } from '../../../shared/components/Button/Button'
import { Badge } from '../../../shared/components/Badge/Badge'
import { Icon } from '../../../shared/components/Icon/Icon'
import { useStoreRegistration } from '../hooks/useStoreRegistration'
import { RegistroMapaAlmacen } from './RegistroMapaAlmacen'
import { validateStoreRegistrationForm } from '../../../validation'
import './StoreRegistrationForm.css'

/**
 * StoreRegistrationForm — Rediseño Sprint 2 / Task #38 (wireframe Stitch
 * "registro_de_almac_n_openpaw"): del wizard de 3 pasos a PÁGINA ÚNICA con
 * secciones: Información general, Ubicación y capacidad (mapa posicional),
 * Equipo de trabajo (opcional, conservado), Documentación (dropzone
 * deshabilitado) y acciones "Guardar borrador" + "Enviar Solicitud".
 *
 * Conservado sin cambios de comportamiento:
 *  - Hook useStoreRegistration: endpoint real POST /almacenes (JSON),
 *    borrador en localStorage (_v:1, saneado), prefill de email, PUT rol
 *    almacén (rolId 3), alta opcional de funcionarios tras el éxito, toast,
 *    reset y aviso `pending-changed`.
 *  - Validaciones de src/validation.js (validateStoreRegistrationForm).
 *
 * Decisiones PO (#28/#34/#35/#37 replicadas en #38):
 *  - CrearAlmacenDto acepta TipoAlmacen/CapacidadAlmacenamiento/
 *    ControlTemperatura como strings enum y NombreResponsable (2-150): se
 *    envían SOLO con valor (una cadena vacía falla Enum.TryParse del
 *    controller con 400). El wireframe los marca obligatorios (*) y así se
 *    validan en el cliente.
 *  - Latitud/Longitud existen en el DTO pero NO se envían: el mapa es
 *    referencial/posicional (sin geocodificación); enviar las coords fijas
 *    del pin contaminaría la BD.
 *  - El POST no admite adjuntos hoy: el dropzone se replica visualmente pero
 *    queda deshabilitado con nota informativa (sin inventar endpoints).
 *  - El wireframe del almacén NO incluye gate de términos (a diferencia del
 *    de veterinaria T37), así que no se replica.
 */

/* Opciones 1:1 con los enums del backend (controller normaliza a ToString):
   TipoAlmacen, CapacidadAlmacenamiento y ControlTemperatura. */
const OPCIONES_TIPO_ALMACEN = [
  { value: 'Interno', label: 'Interno (Anexo a clínica)' },
  { value: 'Externo', label: 'Externo (Independiente)' },
  { value: 'CentroDistribucion', label: 'Centro de Distribución' },
]

const OPCIONES_CAPACIDAD = [
  { value: 'Menos50', label: 'Menos de 50 m²' },
  { value: 'De50a150', label: '50 m² - 150 m²' },
  { value: 'De150a500', label: '150 m² - 500 m²' },
  { value: 'Mas500', label: 'Más de 500 m²' },
]

const OPCIONES_TEMPERATURA = [
  { value: 'SinControl', label: 'Sin control especial' },
  { value: 'Ambiente', label: 'Control de temperatura ambiente (15-25°C)' },
  { value: 'CadenaFrio', label: 'Cadena de frío (2-8°C)' },
  { value: 'Mixto', label: 'Mixto (Ambiente + Frío)' },
]

/* Mismos requiredFields que validateStoreRegistrationForm en src/validation.js
   + los campos marcados (*) por el wireframe. Orden DOM para el foco. */
const ORDEN_FOCUS = [
  'nombreAlmacen', 'tipoAlmacen', 'nombreResponsable', 'cedulaJuridica',
  'telefono', 'email', 'descripcion', 'direccion',
  'capacidadAlmacenamiento', 'controlTemperatura',
]

export function StoreRegistrationForm() {
  const {
    form, errors, status, sent, clearSent,
    updateField, submitRequest, saveDraftNow, setErrors, setTouched,
  } = useStoreRegistration()

  /* --- Equipo de trabajo (funcionalidad conservada del paso 2) ---------- */
  const [team, setTeam] = useState([])
  /* Errores de los campos (*) del wireframe que validation.js no cubre
     (selects enum + responsable). Se limpian campo a campo al editar. */
  const [erroresWireframe, setErroresWireframe] = useState({})
  /* Feedback accesible del botón "Guardar borrador" (rol status). */
  const [feedbackBorrador, setFeedbackBorrador] = useState('')
  const [borradorError, setBorradorError] = useState(false)
  const formRef = useRef(null)

  /* Toast de éxito (conservado del wizard original). */
  useEffect(() => {
    if (!sent) return undefined
    const t = setTimeout(() => { clearSent() }, 3500)
    return () => clearTimeout(t)
  }, [sent, clearSent])

  /* El feedback del borrador se autolimpia para no quedar "congelado". */
  useEffect(() => {
    if (!feedbackBorrador) return undefined
    const t = setTimeout(() => { setFeedbackBorrador('') }, 4500)
    return () => clearTimeout(t)
  }, [feedbackBorrador])

  const addTeamMember = () => {
    setTeam((prev) => [...prev, { nombre: '', email: '', rolId: 3 }])
  }

  const removeTeamMember = (index) => {
    setTeam((prev) => prev.filter((_, i) => i !== index))
  }

  const updateTeamMember = (index, field, value) => {
    setTeam((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  /* Campos (*) del wireframe: selects enum vacíos o responsable < 2 chars
     fallarían en el controller (400) — se validan antes con mensaje claro. */
  const validarCamposWireframe = () => {
    const errs = {}
    if (!form.tipoAlmacen) errs.tipoAlmacen = 'Selecciona el tipo de almacén.'
    const responsable = String(form.nombreResponsable || '').trim()
    if (!responsable) errs.nombreResponsable = 'Este campo es obligatorio.'
    else if (responsable.length < 2) errs.nombreResponsable = 'El nombre debe tener al menos 2 caracteres.'
    if (!form.capacidadAlmacenamiento) errs.capacidadAlmacenamiento = 'Selecciona la capacidad de almacenamiento.'
    return errs
  }

  /* --- Envío único: validaciones visibles + foco al primer inválido ----- */
  const handleSubmit = (event) => {
    event.preventDefault()

    let erroresCampo
    try {
      erroresCampo = validateStoreRegistrationForm(form)
    } catch {
      /* formulario corrupto más allá del saneo del borrador: abortar en silencio */
      return
    }
    const erroresWf = validarCamposWireframe()
    const todos = { ...erroresCampo, ...erroresWf }

    if (Object.keys(todos).length > 0) {
      /* Marca los campos como tocados Y fija sus errores para que todos los
         mensajes sean visibles de una vez (a11y: errores visibles + foco). */
      setErrors(erroresCampo)
      setErroresWireframe(erroresWf)
      setTouched(ORDEN_FOCUS.reduce((acc, f) => ({ ...acc, [f]: true }), {}))

      const primero = ORDEN_FOCUS.find((f) => todos[f])
      const input = primero ? formRef.current?.querySelector(`[name="${primero}"]`) : null
      if (input) input.focus()
      return
    }

    setErroresWireframe({})
    submitRequest(team)
  }

  const handleChange = (event) => {
    updateField(event)
    const { name } = event.target
    if (erroresWireframe[name]) {
      setErroresWireframe((prev) => ({ ...prev, [name]: '' }))
    }
  }

  /* --- Guardar borrador explícito (funcionalidad del wireframe) --------- */
  const handleGuardarBorrador = () => {
    const guardado = saveDraftNow()
    setBorradorError(!guardado)
    if (guardado) {
      const hora = new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })
      setFeedbackBorrador(`Borrador guardado a las ${hora}`)
    } else {
      setFeedbackBorrador('No se pudo guardar el borrador en este navegador.')
    }
  }

  /* Select pill reutilizable para los enums del wireframe. */
  const renderSelect = (name, label, opciones, placeholder) => {
    const error = erroresWireframe[name] || errors[name]
    return (
      <label className={`field ${error ? 'field--error' : ''}`}>
        <span>{label}</span>
        <select
          name={name}
          value={form[name]}
          onChange={handleChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${name}-error` : undefined}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {opciones.map((opcion) => (
            <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
          ))}
        </select>
        {error && (
          <small id={`${name}-error`} role="alert">{error}</small>
        )}
      </label>
    )
  }

  return (
    <form className="sreg-form" noValidate onSubmit={handleSubmit} ref={formRef}>
      <div className="sreg-layout">
        {/* ========================= Columna principal ========================= */}
        <div className="sreg-main">
          {/* Sección 1: Información general */}
          <section className="sreg-card sreg-card--identidad" aria-labelledby="sreg-titulo-info">
            <header className="sreg-card__head">
              <span className="sreg-card__icon sreg-card__icon--primary"><Icon name="storefront" size={24} /></span>
              <div>
                <h2 id="sreg-titulo-info">Información general</h2>
                <p>Datos principales del establecimiento de almacenamiento.</p>
              </div>
            </header>

            <div className="sreg-fields">
              <Field
                className="sreg-field--wide"
                label="Nombre del almacén"
                name="nombreAlmacen"
                value={form.nombreAlmacen}
                error={errors.nombreAlmacen}
                onChange={handleChange}
                placeholder="Ej. Almacén Central Veterinaria Sur"
              />
              {renderSelect('tipoAlmacen', 'Tipo de almacén', OPCIONES_TIPO_ALMACEN, 'Seleccione una opción')}
              {/* Input hand-rolled: el responsable tiene StringLength(150, min 2)
                  en el DTO; Field compartido aún no soporta maxLength ni alerts. */}
              <label className={`field ${(erroresWireframe.nombreResponsable || errors.nombreResponsable) ? 'field--error' : ''}`}>
                <span>Nombre del responsable</span>
                <input
                  name="nombreResponsable"
                  value={form.nombreResponsable}
                  onChange={handleChange}
                  maxLength={150}
                  placeholder="Nombre completo"
                  aria-invalid={(erroresWireframe.nombreResponsable || errors.nombreResponsable) ? true : undefined}
                  aria-describedby={(erroresWireframe.nombreResponsable || errors.nombreResponsable) ? 'nombreResponsable-error' : undefined}
                />
                {(erroresWireframe.nombreResponsable || errors.nombreResponsable) && (
                  <small id="nombreResponsable-error" role="alert">
                    {erroresWireframe.nombreResponsable || errors.nombreResponsable}
                  </small>
                )}
              </label>
              <Field
                label="Cédula jurídica"
                name="cedulaJuridica"
                value={form.cedulaJuridica}
                error={errors.cedulaJuridica}
                onChange={handleChange}
                placeholder="Ej. 3-101-555555"
              />
              <Field
                label="Teléfono"
                name="telefono"
                type="tel"
                value={form.telefono}
                error={errors.telefono}
                onChange={handleChange}
                placeholder="+506 2222-3333"
              />
              <Field
                label="Email"
                name="email"
                type="email"
                value={form.email}
                error={errors.email}
                onChange={handleChange}
                placeholder="contacto@almacen.com"
              />
              <label className={`field sreg-field--wide ${errors.descripcion ? 'field--error' : ''}`}>
                <span>Descripción</span>
                <textarea
                  name="descripcion"
                  rows="4"
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Tipos de suministro, condiciones de almacenamiento y cobertura del almacén..."
                  aria-invalid={errors.descripcion ? true : undefined}
                />
                {errors.descripcion && <small role="alert">{errors.descripcion}</small>}
              </label>
            </div>
          </section>

          {/* Sección 2: Ubicación y capacidad + mapa posicional */}
          <section className="sreg-card sreg-card--ubicacion" aria-labelledby="sreg-titulo-ubicacion">
            <header className="sreg-card__head">
              <span className="sreg-card__icon sreg-card__icon--secondary"><Icon name="map" size={24} /></span>
              <div>
                <h2 id="sreg-titulo-ubicacion">Ubicación y capacidad</h2>
                <p>Detalles físicos de las instalaciones.</p>
              </div>
            </header>

            <div className="sreg-fields">
              <Field
                className="sreg-field--wide"
                label="Dirección completa"
                name="direccion"
                value={form.direccion}
                error={errors.direccion}
                onChange={handleChange}
                placeholder="Calle, número, ciudad, provincia"
              />
              {renderSelect('capacidadAlmacenamiento', 'Capacidad de almacenamiento', OPCIONES_CAPACIDAD, 'Seleccione rango (m²)')}
              {renderSelect('controlTemperatura', 'Control de temperatura', OPCIONES_TEMPERATURA, null)}
            </div>

            <RegistroMapaAlmacen direccion={form.direccion} />

            <p className="sreg-map-note">
              <Icon name="info" size={16} />
              Vista referencial: la solicitud guarda la dirección como texto
              libre y no incluye coordenadas del mapa.
            </p>
          </section>
        </div>

        {/* =========================== Columna lateral =========================== */}
        <div className="sreg-side">
          {/* Sección 3 (conservada): Equipo de trabajo opcional */}
          <section className="sreg-card sreg-card--equipo" aria-labelledby="sreg-titulo-equipo">
            <header className="sreg-card__head">
              <span className="sreg-card__icon sreg-card__icon--tertiary"><Icon name="groups" size={24} /></span>
              <div>
                <h2 id="sreg-titulo-equipo">
                  Equipo de trabajo
                  <Badge variant="neutral" className="sreg-optional-badge">Opcional</Badge>
                </h2>
                <p>Funcionarios vinculados a este almacén</p>
              </div>
            </header>

            <p className="sreg-team-help">
              Agrega usuarios registrados en OpenPaw que trabajarán aquí. Puedes
              omitir esta sección y agregarlos después desde el panel de funcionarios.
            </p>

            {team.length === 0 && (
              <p className="sreg-team-empty">Aún no has agregado funcionarios.</p>
            )}

            {team.map((member, i) => (
              <div key={i} className="sreg-member">
                <div className="sreg-member__head">
                  <strong>Funcionario #{i + 1}</strong>
                  <button
                    type="button"
                    className="sreg-member__remove"
                    onClick={() => removeTeamMember(i)}
                    aria-label={`Quitar funcionario ${i + 1}`}
                    title="Quitar funcionario"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
                <div className="sreg-member__grid">
                  <Field
                    label="Nombre"
                    name={`team-nombre-${i}`}
                    value={member.nombre}
                    onChange={(e) => updateTeamMember(i, 'nombre', e.target.value)}
                  />
                  <Field
                    label="Email"
                    name={`team-email-${i}`}
                    type="email"
                    value={member.email}
                    onChange={(e) => updateTeamMember(i, 'email', e.target.value)}
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              icon="person_add"
              onClick={addTeamMember}
              className="sreg-team-add"
            >
              Agregar funcionario
            </Button>
          </section>

          {/* Sección 4: Documentación (dropzone deshabilitado) */}
          <section className="sreg-card sreg-card--docs" aria-labelledby="sreg-titulo-docs">
            <header className="sreg-card__head">
              <span className="sreg-card__icon sreg-card__icon--neutral"><Icon name="folder_open" size={24} /></span>
              <div>
                <h2 id="sreg-titulo-docs">Documentación</h2>
                <p>Archivos requeridos para la validación</p>
              </div>
            </header>

            <div className="sreg-dropzone" aria-disabled="true">
              <span className="sreg-dropzone__icon"><Icon name="upload_file" size={28} /></span>
              <h3>Arrastre y suelte los documentos aquí</h3>
              <p>Permisos de sanidad, registro comercial y plano del almacén en formato PDF o JPG (máx. 10 MB).</p>
              <Badge variant="neutral" icon="lock" className="sreg-dropzone__badge">No disponible</Badge>
            </div>

            <p className="sreg-map-note" role="note">
              <Icon name="info" size={16} />
              La solicitud en línea todavía no admite adjuntos: el administrador
              solicitará la documentación durante la verificación del registro.
            </p>
          </section>

          {/* Acciones: guardar borrador + envío */}
          <aside className="sreg-actions" aria-label="Enviar solicitud de registro">
            <p
              className="sreg-draft-feedback"
              data-ok={!borradorError}
              role="status"
              aria-live="polite"
            >
              {feedbackBorrador}
            </p>

            {errors.submit && (
              <p className="sreg-error" role="alert">{errors.submit}</p>
            )}

            <div className="sreg-actions__buttons">
              <Button
                type="button"
                variant="outline"
                icon="save"
                onClick={handleGuardarBorrador}
              >
                Guardar borrador
              </Button>
              <Button
                type="submit"
                size="lg"
                icon="send"
                iconPosition="right"
                loading={status === 'submitting'}
                disabled={status === 'submitting'}
                className="sreg-submit"
              >
                {status === 'submitting' ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {sent && (
        <div className="sreg-toast" role="status" aria-live="polite">
          <Icon name="check_circle" color="var(--md-secondary)" size={20} />
          Solicitud enviada correctamente
        </div>
      )}
    </form>
  )
}

export default StoreRegistrationForm
