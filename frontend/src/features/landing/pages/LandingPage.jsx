import { Link } from "react-router-dom"
import { useAuth } from "../../auth/context/AuthContext"
import { LandingNavbar } from "../../../shared/components/LandingNavbar/LandingNavbar"
import { Reveal } from "../../../shared/components/Reveal/Reveal"
import { Icon } from "../../../shared/components/Icon/Icon"
import { Badge } from "../../../shared/components/Badge/Badge"
/* HIGH-1 (QA T40): los CTAs del hero son <Link> con las clases del DS (.btn--*),
   cuyo CSS vive en Button/button.css y solo lo importa Button.jsx (que no se
   monta en "/"). Se importa directo para que las píldoras tengan estilo. */
import "../../../shared/components/Button/button.css"
import "./LandingPage.css"

/* ---------------------------------------------------------------------------
   T40 · Landing nueva OpenPaw ("Una sola pantalla").
   Dirección de diseño: editorial-luminosa sobre tokens M3, azul primario
   comprometido, display Bricolage Grotesque y bento asimétrico con previews
   reales del producto.

   Todos los datos mostrados son REALES del producto (nada de lorem):
   - Estados de cita Pendiente / Confirmada / Completada  → CitasPage
   - Severidad "Nivel 1 · Crítico" / "Nivel 2 · Urgente"   → EmergenciasPage
   - Precios en colones (₡) y stock mínimo/máximo          → Inventario / Marketplace
   --------------------------------------------------------------------------- */

const AUDIENCIAS = [
  {
    id: "aud-veterinarias",
    icon: "medical_services",
    titulo: "Veterinarias",
    texto:
      "Agenda con calendario mensual, expediente clínico por paciente y emergencias clasificadas por severidad.",
  },
  {
    id: "aud-duenos",
    icon: "pets",
    titulo: "Dueños de mascotas",
    texto:
      "El historial completo siempre a mano, citas en dos clics y recordatorios antes de cada vacuna.",
  },
  {
    id: "aud-almacenes",
    icon: "warehouse",
    titulo: "Almacenes",
    texto:
      "Inventario con stock mínimo y máximo, publicado en el marketplace con precios en colones.",
  },
]

const PASOS = [
  {
    icon: "how_to_reg",
    titulo: "Registrá tu cuenta",
    texto:
      "Las veterinarias y los almacenes pasan por una aprobación del administrador. Los dueños entran al instante.",
  },
  {
    icon: "edit_note",
    titulo: "Cargá pacientes e inventario",
    texto:
      "Mascotas con su historial, servicios con duración y precio, productos con stock y mínimos definidos.",
  },
  {
    icon: "event_available",
    titulo: "Operá el día a día",
    texto:
      "Agendá desde el calendario, atendé emergencias por severidad y vendé en el marketplace con stock real.",
  },
]

const CONFIANZA = [
  { icon: "verified_user", texto: "Veterinarias verificadas antes de publicar" },
  { icon: "lock", texto: "El expediente se comparte solo con quien autorizás" },
  { icon: "cloud_done", texto: "Historial centralizado, respaldado y buscable" },
]

const DIAS = ["L", "M", "X", "J", "V", "S", "D"]

export function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="lp">
      <a className="lp-skip" href="#contenido">Saltar al contenido</a>
      <LandingNavbar />

      <main id="contenido">
        {/* ================================================== HERO (split 7/5) */}
        <section className="lp-hero" aria-labelledby="lp-hero-title">
          <div className="lp-shell lp-hero__grid">
            <div className="lp-hero__copy">
              <p className="lp-chip">
                <Icon name="pets" size={16} />
                Gestión veterinaria · Costa Rica
              </p>
              <h1 className="lp-display lp-hero__title" id="lp-hero-title">
                Toda la clínica,
                <br />
                <span className="lp-accent-word">en una sola pantalla.</span>
              </h1>
              <p className="lp-hero__sub">
                Citas, expedientes médicos, emergencias e inventario conectados
                para veterinarias, dueños de mascotas y almacenes.
              </p>
              <div className="lp-hero__actions">
                {isAuthenticated ? (
                  <Link to="/dashboard" className="btn btn--primary">
                    Ir al dashboard <Icon name="arrow_forward" size={18} />
                  </Link>
                ) : (
                  <>
                    <Link to="/auth-method" className="btn btn--primary">
                      Crear cuenta gratis <Icon name="arrow_forward" size={18} />
                    </Link>
                    <Link to="/marketplace" className="btn btn--secondary">
                      Explorar el marketplace
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Collage de previews reales del producto (ilustrativo) */}
            <div className="lp-collage" aria-hidden="true">
              <div className="lp-card lp-collage__cita">
                <header className="lp-collage__head">
                  <span className="lp-collage__hora">Hoy · 10:30</span>
                  <Badge variant="success" icon="check_circle">Confirmada</Badge>
                </header>
                <strong className="lp-collage__titulo">Rex: vacunación antirrábica</strong>
                <small className="lp-collage__meta">Dr. Mora · Clínica Veterinaria Central</small>
              </div>

              <div className="lp-card lp-collage__emergencia">
                <Badge variant="danger" icon="warning" filled>Nivel 1 · Crítico</Badge>
                <ul className="lp-vitales">
                  <li className="lp-vital lp-vital--alerta">
                    <Icon name="monitor_heart" size={16} /> FC 132 bpm
                  </li>
                  <li className="lp-vital lp-vital--alerta">
                    <Icon name="device_thermostat" size={16} /> Temp 39.8 °C
                  </li>
                </ul>
                <small className="lp-collage__meta">Luna · reporte desde la app del dueño</small>
              </div>

              <div className="lp-card lp-collage__mkt">
                <Icon name="inventory_2" size={20} />
                <div className="lp-collage__mkt-txt">
                  <strong>Alimento Perro Premium 5 kg</strong>
                  <small>₡10 000 · 12 en stock</small>
                </div>
                <span className="lp-collage__add"><Icon name="add_shopping_cart" size={18} /></span>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================== AUDIENCIAS (#about, hairline) */}
        <section className="lp-audiencias" id="about" aria-labelledby="lp-aud-title">
          <div className="lp-shell">
            <Reveal>
              <h2 className="lp-h2" id="lp-aud-title">Un sistema, tres formas de usarlo.</h2>
              <p className="lp-lead">
                OpenPaw adapta la misma información al rol de cada persona:
                nada se digita dos veces.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <ul className="lp-aud">
                {AUDIENCIAS.map((a) => (
                  <li className="lp-aud__item" key={a.id}>
                    <span className="lp-aud__icon"><Icon name={a.icon} size={22} /></span>
                    <h3>{a.titulo}</h3>
                    <p>{a.texto}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ============================== PRODUCTO (#features, bento asimétrico) */}
        <section className="lp-producto" id="features" aria-labelledby="lp-prod-title">
          <div className="lp-shell">
            <Reveal>
              <h2 className="lp-h2" id="lp-prod-title">Lo que OpenPaw hace todos los días.</h2>
              <p className="lp-lead">
                Cinco módulos que comparten la misma base de datos: lo que se
                agenda, se trata, se vende y se despacha vive en un solo lugar.
              </p>
            </Reveal>

            <div className="lp-bento">
              {/* A · Citas — celda grande */}
              <Reveal className="lp-cell-wrap lp-bento__citas" delay={0}>
                <article className="lp-cell lp-cell--citas">
                  <h3>Citas con calendario real</h3>
                  <p>
                    Calendario mensual con las citas del día, estados
                    Pendiente, Confirmada o Completada y filtros para la recepción.
                  </p>
                  <div className="lp-cal" aria-hidden="true">
                    <div className="lp-cal__week">
                      {DIAS.map((d, i) => (
                        <span key={d} className={`lp-cal__day${i === 2 ? " lp-cal__day--hoy" : ""}`}>
                          <small>{d}</small>
                          <strong>{10 + i}</strong>
                        </span>
                      ))}
                    </div>
                    <ul className="lp-cal__citas">
                      <li>
                        <span className="lp-cal__hora">10:30</span>
                        <div className="lp-cal__txt">
                          <strong>Rex: consulta general</strong>
                          <small>Dr. Mora · Consultorio 2</small>
                        </div>
                        <Badge variant="success" icon="check_circle">Confirmada</Badge>
                      </li>
                      <li>
                        <span className="lp-cal__hora">15:00</span>
                        <div className="lp-cal__txt">
                          <strong>Luna: control postoperatorio</strong>
                          <small>Dra. Solís · Consultorio 1</small>
                        </div>
                        <Badge variant="warning" icon="schedule">Pendiente</Badge>
                      </li>
                    </ul>
                  </div>
                </article>
              </Reveal>

              {/* B · Expediente — timeline clínico */}
              <Reveal className="lp-cell-wrap lp-bento__expediente" delay={0.05}>
                <article className="lp-cell lp-cell--expediente">
                  <h3>Expediente clínico en línea de tiempo</h3>
                  <p>
                    Consultas, vacunas, aportes y emergencias de cada mascota,
                    ordenados por fecha en un solo historial.
                  </p>
                  <ol className="lp-tline" aria-hidden="true">
                    <li>
                      <span className="lp-tline__node lp-tline__node--ok"><Icon name="vaccines" size={14} /></span>
                      <div><strong>Vacunación antirrábica</strong><small>12 jul</small></div>
                    </li>
                    <li>
                      <span className="lp-tline__node lp-tline__node--ok"><Icon name="medication" size={14} /></span>
                      <div><strong>Desparasitación interna</strong><small>28 jun</small></div>
                    </li>
                    <li>
                      <span className="lp-tline__node lp-tline__node--alerta"><Icon name="emergency" size={14} /></span>
                      <div><strong>Emergencia Nivel 2 · Urgente</strong><small>14 jun</small></div>
                    </li>
                  </ol>
                </article>
              </Reveal>

              {/* C · Emergencias — severidad + vitales */}
              <Reveal className="lp-cell-wrap lp-bento__emergencias" delay={0.1}>
                <article className="lp-cell lp-cell--emergencias">
                  <h3>Emergencias con severidad</h3>
                  <p>
                    Cada reporte llega clasificado como crítico o urgente, con
                    signos vitales al frente.
                  </p>
                  <div className="lp-emerg" aria-hidden="true">
                    <Badge variant="danger" icon="priority_high">Nivel 1 · Crítico</Badge>
                    <div className="lp-vitales">
                      <span className="lp-vital lp-vital--alerta">
                        <Icon name="monitor_heart" size={15} /> FC 132 bpm
                      </span>
                      <span className="lp-vital">
                        <Icon name="water_drop" size={15} /> SpO₂ 96 %
                      </span>
                    </div>
                  </div>
                </article>
              </Reveal>

              {/* D · Inventario — stock mínimo/máximo */}
              <Reveal className="lp-cell-wrap lp-bento__inventario" delay={0.15}>
                <article className="lp-cell lp-cell--inventario">
                  <h3>Inventario que avisa</h3>
                  <p>
                    Stock mínimo y máximo por producto; el marketplace muestra
                    solo lo que hay disponible.
                  </p>
                  <div className="lp-stock" aria-hidden="true">
                    <div className="lp-stock__head">
                      <span>Alimento Perro Premium</span>
                      <strong>12 / 30</strong>
                    </div>
                    <div className="lp-stock__track">
                      <span className="lp-stock__fill" />
                      <i className="lp-stock__min" title="Stock mínimo" />
                    </div>
                    <small>Mínimo: 6 unidades · aviso antes de quedarte sin bolsas</small>
                  </div>
                </article>
              </Reveal>

              {/* E · Marketplace — banda ancha oscura */}
              <Reveal className="lp-cell-wrap lp-bento__marketplace" delay={0.2}>
                <article className="lp-cell lp-cell--marketplace">
                  <div className="lp-mkt__copy">
                    <h3>Marketplace con stock real</h3>
                    <p>
                      Productos y servicios de veterinarias y almacenes aprobados,
                      carrito compartido y checkout sin llamadas.
                    </p>
                    <Link to="/marketplace" className="lp-link-light">
                      Ver el marketplace <Icon name="arrow_forward" size={16} />
                    </Link>
                  </div>
                  <div className="lp-mkt" aria-hidden="true">
                    <span className="lp-mkt-chip">
                      <Icon name="inventory_2" size={16} />
                      Alimento Perro Premium 5 kg <strong>₡10 000</strong>
                    </span>
                    <span className="lp-mkt-chip">
                      <Icon name="spa" size={16} />
                      Grooming completo <strong>₡15 000</strong>
                    </span>
                    <span className="lp-mkt-chip lp-mkt-chip--btn">
                      <Icon name="add_shopping_cart" size={16} /> Agregar al carrito
                    </span>
                  </div>
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ============================ CÓMO FUNCIONA (#how, secuencia real) */}
        <section className="lp-como" id="how" aria-labelledby="lp-como-title">
          <div className="lp-shell lp-como__grid">
            <Reveal className="lp-como__intro">
              <h2 className="lp-h2" id="lp-como-title">De cero a operar en una tarde.</h2>
              <p className="lp-lead">
                Sin migraciones dolorosas: la clínica empieza a funcionar el
                mismo día que se registra.
              </p>
            </Reveal>
            <Reveal delay={0.1} className="lp-como__pasos-wrap">
              <ol className="lp-pasos" aria-label="Pasos para empezar a usar OpenPaw">
                {PASOS.map((paso, i) => (
                  <li className="lp-paso" key={paso.titulo}>
                    <span className="lp-paso__num" aria-hidden="true">{i + 1}</span>
                    <div className="lp-paso__body">
                      <h3>
                        <Icon name={paso.icon} size={20} />
                        {paso.titulo}
                      </h3>
                      <p>{paso.texto}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>

        {/* ================================================= CONFIANZA (pull-quote) */}
        <section className="lp-confianza" aria-labelledby="lp-conf-title">
          <div className="lp-shell">
            <Reveal>
              <Icon name="pets" size={150} className="lp-confianza__marca" />
              <blockquote className="lp-display" id="lp-conf-title">
                Ningún expediente debería vivir solo en un cuaderno.
              </blockquote>
              <p className="lp-confianza__attr">Esa es la idea detrás de cada módulo de OpenPaw.</p>
              <ul className="lp-confianza__chips">
                {CONFIANZA.map((c) => (
                  <li key={c.icon}>
                    <Icon name={c.icon} size={17} />
                    {c.texto}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ==================================================== CTA FINAL (banda oscura) */}
        <section className="lp-cta-final" aria-labelledby="lp-cta-title">
          <div className="lp-shell">
            <Reveal>
              <h2 className="lp-display" id="lp-cta-title">Empezá hoy. Es gratis.</h2>
              <p className="lp-cta-final__sub">
                Creá tu cuenta como dueño de mascota o registrá tu veterinaria
                o almacén en minutos.
              </p>
              <div className="lp-cta-final__actions">
                {isAuthenticated ? (
                  <Link to="/dashboard" className="lp-btn-light">
                    Ir al dashboard <Icon name="arrow_forward" size={18} />
                  </Link>
                ) : (
                  <Link to="/auth-method" className="lp-btn-light">
                    Crear cuenta gratis <Icon name="arrow_forward" size={18} />
                  </Link>
                )}
                <Link to="/login" className="lp-link-light">Iniciar sesión</Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ============================================================== FOOTER */}
      <footer className="lp-footer">
        <div className="lp-shell">
          <div className="lp-footer__grid">
            <div className="lp-footer__brand">
              <img src="/logo.png" alt="OpenPaw" width="34" height="34" />
              <p className="lp-footer__tagline">
                La clínica entera, en una sola pantalla.
              </p>
              <p className="lp-footer__lugar">
                <Icon name="location_on" size={15} /> San José, Costa Rica
              </p>
            </div>

            <nav className="lp-footer__col" aria-label="Producto">
              <h3>Producto</h3>
              <a href="#about">La idea</a>
              <a href="#features">Funcionalidades</a>
              <a href="#how">Cómo funciona</a>
              <Link to="/marketplace">Marketplace</Link>
            </nav>

            <nav className="lp-footer__col" aria-label="Cuenta">
              <h3>Cuenta</h3>
              <Link to="/login">Iniciar sesión</Link>
              <Link to="/auth-method">Crear cuenta</Link>
              <Link to="/dashboard">Dashboard</Link>
            </nav>

            <nav className="lp-footer__col" aria-label="Legal">
              <h3>Legal</h3>
              <a href="#">Privacidad</a>
              <a href="#">Términos</a>
              <a href="#">Contacto</a>
            </nav>
          </div>

          <div className="lp-footer__bottom">
            <p>&copy; 2026 OpenPaw. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
