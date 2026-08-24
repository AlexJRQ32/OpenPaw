import { useEffect, useRef, useState } from 'react'
import { Field } from '../../../shared/components/Field/Field'
import { Button } from '../../../shared/components/Button/Button'
import { Badge } from '../../../shared/components/Badge/Badge'
import { Icon } from '../../../shared/components/Icon/Icon'
import { useVeterinaryRegistration } from '../hooks/useVeterinaryRegistration'
import { RegistroMapaUbicacion } from './RegistroMapaUbicacion'
import { validateForm } from '../../../validation'
import './RegistrationForm.css'

/**
 * RegistrationForm — Rediseño Sprint 2 / Task #37 (wireframe Stitch
 * "registro_de_veterinaria_openpaw"): del wizard de 3 pasos a PÁGINA ÚNICA
 * con secciones: Identidad comercial, Ubicación física (mapa posicional),
 * Equipo de trabajo (opcional, conservado), Documentación (dropzone
 * deshabilitado) y Términos + envío.
 *
 * Conservado sin cambios de comportamiento:
 *  - Hook useVeterinaryRegistration: endpoint real POST /veterinarias (JSON),
 *    borrador en localStorage, prefill de email, PUT rol veterinaria, alta
 *    opcional de funcionarios tras el éxito, toast y reset.
 *  - Validaciones de src/validation.js (validateForm).
 *
 * Decisiones PO (#28/#34/#35): aunque CrearVeterinariaDto acepta
 * lat/lng opcionales, el frontend no geocodifica direcciones y enviar las
 * coords fijas del pin contaminaría los datos — el mapa es referencial y no
 * se envían coordenadas. El POST tampoco recibe adjuntos hoy, así que el
 * dropzone se replica visualmente pero queda deshabilitado con nota
 * informativa (sin inventar endpoints ni campos).
 */

const FUNCIONARIO_ROLES = [
  { id: 2, nombre: 'Veterinaria' },
]

/* Mismos requiredFields que validateForm en src/validation.js */
const CAMPOS_OBLIGATORIOS = [
  'nombreComercio', 'cedulaJuridica', 'direccion', 'telefono', 'email', 'descripcion',
]

const MENSAJE_TERMINOS = 'Debes aceptar los Términos y Condiciones para enviar la solicitud.'

export function RegistrationForm() {
  const {
    form, errors, status, sent, clearSent,
    updateField, submitRequest, setErrors, setTouched,
  } = useVeterinaryRegistration()

  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [errorTerminos, setErrorTerminos] = useState('')
  const [team, setTeam] = useState([])
  const formRef = useRef(null)
  const terminosRef = useRef(null)

  /* Toast de éxito (conservado del wizard original): la visibilidad se DERIVA
     del flag `sent` del hook; el efecto solo agenda su cierre a los 3.5s
     (sin setState síncrono en el cuerpo del efecto). */
  useEffect(() => {
    if (!sent) return undefined
    const t = setTimeout(() => { clearSent() }, 3500)
    return () => clearTimeout(t)
  }, [sent, clearSent])

  /* --- Equipo de trabajo (funcionalidad conservada del paso 2) ---------- */
  const addTeamMember = () => {
    setTeam((prev) => [...prev, { nombre: '', email: '', rolId: 2 }])
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

  /* --- Envío único: validaciones visibles + gate de términos ------------ */
  const handleSubmit = (event) => {
    event.preventDefault()

    const erroresCampo = validateForm(form)
    if (Object.keys(erroresCampo).length > 0) {
      /* Marca los campos como tocados Y fija sus errores para que todos los
         mensajes sean visibles de una vez (a11y: errores visibles + foco). */
      setErrors(erroresCampo)
      setTouched(CAMPOS_OBLIGATORIOS.reduce((acc, f) => ({ ...acc, [f]: true }), {}))
      if (!aceptaTerminos) setErrorTerminos(MENSAJE_TERMINOS)

      const primero = CAMPOS_OBLIGATORIOS.find((f) => erroresCampo[f])
      const input = primero ? formRef.current?.querySelector(`[name="${primero}"]`) : null
      if (input) input.focus()
      return
    }

    if (!aceptaTerminos) {
      setErrorTerminos(MENSAJE_TERMINOS)
      terminosRef.current?.focus()
      return
    }

    setErrorTerminos('')
    submitRequest(team)
  }

  const handleChangeTerminos = (event) => {
    setAceptaTerminos(event.target.checked)
    if (event.target.checked) setErrorTerminos('')
  }

  return (
    <form className="vreg-form" noValidate onSubmit={handleSubmit} ref={formRef}>
      <div className="vreg-layout">
        {/* ========================= Columna principal ========================= */}
        <div className="vreg-main">
          {/* Sección 1: Identidad */}
          <section className="vreg-card vreg-card--identidad" aria-labelledby="vreg-titulo-identidad">
            <header className="vreg-card__head">
              <span className="vreg-card__icon vreg-card__icon--primary"><Icon name="storefront" size={24} /></span>
              <div>
                <h2 id="vreg-titulo-identidad">Identidad comercial</h2>
                <p>Datos legales y de contacto de la clínica</p>
              </div>
            </header>

            <div className="vreg-fields">
              <Field
                className="vreg-field--wide"
                label="Nombre comercial"
                name="nombreComercio"
                value={form.nombreComercio}
                error={errors.nombreComercio}
                onChange={updateField}
                placeholder="Ej. Veterinaria San Francisco S.A."
              />
              <Field
                label="Cédula jurídica"
                name="cedulaJuridica"
                value={form.cedulaJuridica}
                error={errors.cedulaJuridica}
                onChange={updateField}
                placeholder="Ej. 3-101-555555"
              />
              <Field
                label="Teléfono de contacto"
                name="telefono"
                type="tel"
                value={form.telefono}
                error={errors.telefono}
                onChange={updateField}
                placeholder="+506 2222-3333"
              />
              <Field
                className="vreg-field--wide"
                label="Correo oficial"
                name="email"
                type="email"
                value={form.email}
                error={errors.email}
                onChange={updateField}
                placeholder="contacto@veterinaria.com"
              />
              <label className={`field vreg-field--wide ${errors.descripcion ? 'field--error' : ''}`}>
                <span>Descripción</span>
                <textarea
                  name="descripcion"
                  rows="4"
                  value={form.descripcion}
                  onChange={updateField}
                  placeholder="Servicios, horarios y especialidades de la clínica..."
                  aria-invalid={errors.descripcion ? true : undefined}
                />
                {errors.descripcion && <small role="alert">{errors.descripcion}</small>}
              </label>
            </div>
          </section>

          {/* Sección 2: Ubicación + mapa */}
          <section className="vreg-card vreg-card--ubicacion" aria-labelledby="vreg-titulo-ubicacion">
            <header className="vreg-card__head">
              <span className="vreg-card__icon vreg-card__icon--secondary"><Icon name="location_on" size={24} /></span>
              <div>
                <h2 id="vreg-titulo-ubicacion">Ubicación física</h2>
                <p>Dirección principal del establecimiento</p>
              </div>
            </header>

            <div className="vreg-fields">
              <Field
                className="vreg-field--wide"
                label="Dirección exacta"
                name="direccion"
                value={form.direccion}
                error={errors.direccion}
                onChange={updateField}
                placeholder="Provincia, cantón, distrito y señas exactas..."
              />
            </div>

            <RegistroMapaUbicacion direccion={form.direccion} />

            <p className="vreg-map-note">
              <Icon name="info" size={16} />
              Vista referencial: la solicitud guarda la dirección como texto
              libre y no incluye coordenadas del mapa.
            </p>
          </section>

          {/* Sección 3 (conservada): Equipo de trabajo opcional */}
          <section className="vreg-card vreg-card--equipo" aria-labelledby="vreg-titulo-equipo">
            <header className="vreg-card__head">
              <span className="vreg-card__icon vreg-card__icon--tertiary"><Icon name="groups" size={24} /></span>
              <div>
                <h2 id="vreg-titulo-equipo">
                  Equipo de trabajo
                  <Badge variant="neutral" className="vreg-optional-badge">Opcional</Badge>
                </h2>
                <p>Funcionarios vinculados a esta veterinaria</p>
              </div>
            </header>

            <p className="vreg-team-help">
              Agrega usuarios registrados en OpenPaw que trabajarán aquí. Puedes
              omitir esta sección y agregarlos después desde el panel de funcionarios.
            </p>

            {team.length === 0 && (
              <p className="vreg-team-empty">Aún no has agregado funcionarios.</p>
            )}

            {team.map((member, i) => (
              <div key={i} className="vreg-member">
                <div className="vreg-member__head">
                  <strong>Funcionario #{i + 1}</strong>
                  <button
                    type="button"
                    className="vreg-member__remove"
                    onClick={() => removeTeamMember(i)}
                    aria-label={`Quitar funcionario ${i + 1}`}
                    title="Quitar funcionario"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
                <div className="vreg-member__grid">
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
                  <label className="field">
                    <span>Rol</span>
                    <select
                      value={member.rolId}
                      onChange={(e) => updateTeamMember(i, 'rolId', Number(e.target.value))}
                      aria-label={`Rol del funcionario ${i + 1}`}
                    >
                      {FUNCIONARIO_ROLES.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                  </label>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              icon="person_add"
              onClick={addTeamMember}
              className="vreg-team-add"
            >
              Agregar funcionario
            </Button>
          </section>
        </div>

        {/* =========================== Columna lateral =========================== */}
        <div className="vreg-side">
          {/* Sección 4: Documentación (dropzone deshabilitado) */}
          <section className="vreg-card vreg-card--docs" aria-labelledby="vreg-titulo-docs">
            <header className="vreg-card__head">
              <span className="vreg-card__icon vreg-card__icon--neutral"><Icon name="folder_open" size={24} /></span>
              <div>
                <h2 id="vreg-titulo-docs">Documentación</h2>
                <p>Personería jurídica</p>
              </div>
            </header>

            <div className="vreg-dropzone" aria-disabled="true">
              <span className="vreg-dropzone__icon"><Icon name="cloud_upload" size={28} /></span>
              <h3>Arrastra tu documento aquí</h3>
              <p>Formatos soportados: PDF, JPG y PNG. Tamaño máximo 10 MB.</p>
              <Badge variant="neutral" icon="lock" className="vreg-dropzone__badge">No disponible</Badge>
            </div>

            <p className="vreg-map-note" role="note">
              <Icon name="info" size={16} />
              La solicitud en línea todavía no admite adjuntos: el administrador
              solicitará la personería jurídica durante la verificación (puede
              tomar hasta 48 horas hábiles).
            </p>
          </section>

          {/* Sección 5: Términos + envío */}
          <aside className="vreg-actions" aria-label="Enviar solicitud de registro">
            <div className={`vreg-terms ${errorTerminos ? 'vreg-terms--error' : ''}`}>
              <input
                ref={terminosRef}
                id="vreg-terms"
                type="checkbox"
                checked={aceptaTerminos}
                onChange={handleChangeTerminos}
                aria-invalid={errorTerminos ? true : undefined}
                aria-describedby={errorTerminos ? 'vreg-terms-error' : undefined}
              />
              <label htmlFor="vreg-terms">
                Acepto los{' '}
                <a href="#terminos" onClick={(e) => e.preventDefault()}>Términos y Condiciones</a> y la{' '}
                <a href="#privacidad" onClick={(e) => e.preventDefault()}>Política de Privacidad</a> de OpenPaw.
              </label>
            </div>

            {errorTerminos && (
              <p id="vreg-terms-error" className="vreg-error" role="alert">{errorTerminos}</p>
            )}
            {errors.submit && (
              <p className="vreg-error" role="alert">{errors.submit}</p>
            )}

            <Button
              type="submit"
              size="lg"
              icon="arrow_forward"
              iconPosition="right"
              loading={status === 'submitting'}
              disabled={status === 'submitting'}
              className="vreg-submit"
            >
              {status === 'submitting' ? 'Enviando...' : 'Solicitar registro'}
            </Button>
          </aside>
        </div>
      </div>

      {sent && (
        <div className="vreg-toast" role="status" aria-live="polite">
          <Icon name="check_circle" color="var(--md-secondary)" size={20} />
          Solicitud enviada correctamente
        </div>
      )}
    </form>
  )
}

export default RegistrationForm
