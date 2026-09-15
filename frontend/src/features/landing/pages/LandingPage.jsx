import { Fragment } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../auth/context/AuthContext"
import { LandingNavbar } from "../../../shared/components/LandingNavbar/LandingNavbar"
import { Reveal } from "../../../shared/components/Reveal/Reveal"
import { Icon } from "../../../shared/components/Icon/Icon"
import { Badge } from "../../../shared/components/Badge/Badge"
import "../../../shared/components/Button/button.css"
import "./LandingPage.css"

/* ==========================================================================
   Landing OpenPaw — "El Expediente" (2026 rewrite, zero visual inheritance)
   Dirección: editorial-documental. Hero fotográfico full-bleed con scrim navy
   (legibilidad AAA) y copy a la izquierda. El azul institucional #004fb7 se
   conserva como ancla de marca (links y CTAs).
   Prueba social: ninguna inventada. El único sujeto es Rex (= el usuario).
   ========================================================================== */

/* ---
   Dos responsables, un mismo expediente. La metafora visual es la doble
   pagina de un carnet abierto: la costura central ES el expediente.
--- */
const ROLES = [
  {
    id: "vet",
    icon: "medical_services",
    titulo: "Veterinarias",
    texto: "La veterinaria es la fuente clínica del expediente.",
    puntos: [
      "Registra vacunas, tratamientos y emergencias de cada paciente",
      "Clasifica urgencias por severidad, con signos vitales al frente",
      "Atiende con el historial completo, no con un cuaderno",
    ],
    cta: { label: "Registrá tu veterinaria", to: "/veterinary-registration" },
    num: "A",
  },
  {
    id: "dueno",
    icon: "person",
    titulo: "Dueños de mascotas",
    texto: "El dueño consulta y agenda sin llamar a la clínica.",
    puntos: [
      "Consulta el historial completo de la mascota, siempre actualizado",
      "Agenda citas y recibe recordatorios de vacunas a tiempo",
      "Lleva el carnet a cualquier veterinaria, no solo a una",
    ],
    cta: { label: "Creá tu cuenta", to: "/auth-method" },
    num: "B",
  },
]

/* ---
   Índice de módulos. Se presentan como un índice de expediente numerado,
   no como tarjetas iguales: el módulo ancla (expediente clínico) es una
   fila de peso completo; el resto son filas de índice con datos reales.
--- */
const MODULOS = [
  {
    id: "expediente",
    num: "01",
    icon: "assignment",
    titulo: "Expediente clínico",
    desc: "Línea de tiempo con vacunas, tratamientos y emergencias en un solo historial.",
    destacado: true,
  },
  {
    id: "citas",
    num: "02",
    icon: "event",
    titulo: "Citas",
    desc: "Calendario mensual con estados Pendiente, Confirmada y Completada.",
  },
  {
    id: "emergencias",
    num: "03",
    icon: "emergency",
    titulo: "Emergencias",
    desc: "Clasificación por severidad con signos vitales al frente.",
  },
  {
    id: "inventario",
    num: "04",
    icon: "inventory_2",
    titulo: "Inventario",
    desc: "Stock mínimo y máximo con avisos automáticos.",
  },
  {
    id: "marketplace",
    num: "05",
    icon: "storefront",
    titulo: "Marketplace",
    desc: "Productos y servicios de veterinarias y almacenes aprobados, con stock real y precios en colones.",
  },
]

const PASOS = [
  {
    num: "01",
    icon: "how_to_reg",
    titulo: "Registrá tu cuenta",
    texto: "Las veterinarias pasan por aprobación. Los dueños entran al instante.",
  },
  {
    num: "02",
    icon: "edit_note",
    titulo: "Cargá pacientes e inventario",
    texto: "Mascotas con historial, servicios con precio, productos con stock.",
  },
  {
    num: "03",
    icon: "event_available",
    titulo: "Operá el día a día",
    texto: "Agendá citas, atendé emergencias y vendé en el marketplace.",
  },
]

export function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="lp">
      <a className="lp-skip" href="#contenido">Saltar al contenido</a>
      <LandingNavbar />

      <main id="contenido" className="lp-main">
        {/* ================================================================
            S1 — HERO · Escena fotográfica full-bleed + scrim, copy a la izquierda
        ================================================================ */}
        <section className="lp-hero" aria-labelledby="hero-title">
          {/* Ronda 3: foto como FONDO del hero (cover) + scrim navy funcional.
              Si /images/hero-mount.jpg no existe, onerror activa el fallback
              navy sólido vía .lp-hero__bg--fallback. */}
          <div className="lp-hero__bg" aria-hidden="true">
            <img
              src="/images/hero-mount.jpg"
              alt=""
              loading="eager"
              decoding="async"
              onError={(e) => e.currentTarget.closest(".lp-hero__bg").classList.add("lp-hero__bg--fallback")}
            />
            <div className="lp-hero__scrim" />
          </div>
          <div className="lp-shell lp-hero__grid">
            <div className="lp-hero__copy">
              <p className="lp-kicker">
                <span className="lp-kicker__paw" aria-hidden="true"><Icon name="pets" size={15} filled /></span>
                Expediente veterinario compartido
                <span className="lp-kicker__sep" aria-hidden="true">·</span>
                <span className="lp-kicker__mono">CR · ESTD 2026</span>
              </p>

              <h1 className="lp-h1" id="hero-title">
                La historia clínica de tu mascota,
                <span className="lp-h1__vida">
                  {" de por vida."}
                </span>
              </h1>

              <p className="lp-hero__sub">
                Un carnet de salud digital, estilo EDUS de Costa Rica: la veterinaria registra la
                atención y el dueño la consulta siempre, sobre el mismo expediente. De la primera
                antirrábica a la última consulta, todo queda en una sola historia.
              </p>

              <div className="lp-hero__actions">
                {isAuthenticated ? (
                  <Link to="/dashboard" className="btn btn--primary lp-btn-lg">
                    Ir al dashboard <Icon name="arrow_forward" size={18} />
                  </Link>
                ) : (
                  <>
                    <Link to="/auth-method" className="btn btn--primary lp-btn-lg">
                      Creá tu cuenta <Icon name="arrow_forward" size={18} />
                    </Link>
                    <Link to="/marketplace" className="btn btn--secondary lp-btn-lg">
                      Explorar el marketplace
                    </Link>
                  </>
                )}
              </div>

              {!isAuthenticated && (
                <p className="lp-hero__alt">
                  <Icon name="local_hospital" size={16} aria-hidden="true" />
                  ¿Tenés una clínica?{" "}
                  <Link to="/veterinary-registration">Registrá tu veterinaria</Link>
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ================================================================
            S2 — ABOUT · Doble página: dos responsables, un expediente
        ================================================================ */}
        <section className="lp-roles" id="about" aria-labelledby="roles-title">
          <div className="lp-shell">
            <Reveal>
              <header className="lp-sec-head">
                <p className="lp-sec-num lp-mono" aria-hidden="true">01 — La idea</p>
                <h2 className="lp-h2" id="roles-title">Un expediente, dos responsables.</h2>
                <p className="lp-lead">
                  El carnet pertenece a la mascota. La veterinaria agrega la atención clínica y su
                  dueño la consulta siempre, sobre la misma versión.
                </p>
              </header>
            </Reveal>

            {/* Ronda 3: chip estático bajo el lead — cero overlap con las cards.
                En mobile se oculta; el gemelo (--mid, dentro de la ola) aparece
                entre las dos cards apiladas. */}
            <div className="lp-roles__costura" aria-hidden="true">
              <span className="lp-roles__chip">
                <Icon name="sync_alt" size={18} />
                Mismo expediente
              </span>
            </div>

            <Reveal delay={0.08}>
              <div className="lp-roles__ola">
                {ROLES.map((r, i) => (
                  <Fragment key={r.id}>
                    <article className="lp-pagina">
                      <span className="lp-pagina__num lp-mono" aria-hidden="true">{r.num}</span>
                      <header className="lp-pagina__head">
                        <span className="lp-pagina__icon" aria-hidden="true"><Icon name={r.icon} size={22} /></span>
                        <div>
                          <h3 className="lp-pagina__title">{r.titulo}</h3>
                          <p className="lp-pagina__kicker">{r.texto}</p>
                        </div>
                      </header>
                      <ul className="lp-pagina__list">
                        {r.puntos.map((p) => (
                          <li key={p}><Icon name="check_circle" size={17} aria-hidden="true" /> {p}</li>
                        ))}
                      </ul>
                      <Link to={r.cta.to} className="lp-pagina__cta">
                        {r.cta.label} <Icon name="arrow_forward" size={16} aria-hidden="true" />
                      </Link>
                    </article>
                    {i === 0 && (
                      <div className="lp-roles__costura lp-roles__costura--mid" aria-hidden="true">
                        <span className="lp-roles__chip">
                          <Icon name="sync_alt" size={18} />
                          Mismo expediente
                        </span>
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ================================================================
            S3 — FEATURES · Índice numerado del expediente
        ================================================================ */}
        <section className="lp-modulos" id="features" aria-labelledby="bento-title">
          <div className="lp-shell">
            <Reveal>
              <header className="lp-sec-head">
                <p className="lp-sec-num lp-mono" aria-hidden="true">02 — Funcionalidades</p>
                <h2 className="lp-h2" id="bento-title">Lo que OpenPaw hace todos los días.</h2>
                <p className="lp-lead">
                  Cinco módulos comparten la misma base de datos: lo que se registra en uno,
                  aparece en el carnet.
                </p>
              </header>
            </Reveal>

            <ul className="lp-indice" role="list">
              {MODULOS.map((m, i) => (
                <Reveal key={m.id} delay={i * 0.05}>
                  <li className={`lp-indice__fila${m.destacado ? " lp-indice__fila--destacada" : ""}`}>
                    <div className="lp-indice__num lp-mono" aria-hidden="true">{m.num}</div>
                    <div className="lp-indice__cuerpo">
                      <h3 className="lp-indice__titulo">{m.titulo}</h3>
                      <p className="lp-indice__desc">{m.desc}</p>
                    </div>
                    <span className="lp-indice__icon" aria-hidden="true"><Icon name={m.icon} size={26} /></span>

                    {/* Dato real del producto, por fila */}
                    {m.id === "citas" && (
                      <div className="lp-indice__dato" aria-hidden="true">
                        <Badge variant="primary" dot>Pendiente</Badge>
                        <Badge variant="success" dot>Confirmada</Badge>
                        <span className="lp-indice__dia lp-mono">SÁB 12</span>
                      </div>
                    )}
                    {m.id === "emergencias" && (
                      <div className="lp-indice__dato" aria-hidden="true">
                        <Badge variant="danger" icon="warning" filled>Nivel 1 · Crítico</Badge>
                        <span className="lp-indice__vital lp-mono">
                          <Icon name="monitor_heart" size={14} /> FC 132 bpm
                        </span>
                      </div>
                    )}
                    {m.id === "inventario" && (
                      <div className="lp-indice__dato" aria-hidden="true">
                        <div className="lp-indice__barra">
                          <span style={{ width: "40%" }} />
                        </div>
                        <span className="lp-indice__vital lp-mono">12 / 30 u</span>
                      </div>
                    )}
                    {m.id === "marketplace" && (
                      <div className="lp-indice__dato lp-indice__dato--precios" aria-hidden="true">
                        <span>Consulta general ₡10 000</span>
                        <span>Vacuna antirrábica ₡15 000</span>
                      </div>
                    )}
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ================================================================
            S4 — HOW · Tres pasos sobre el lomo del carnet
        ================================================================ */}
        <section className="lp-pasos" id="how" aria-labelledby="steps-title">
          <div className="lp-shell">
            <Reveal>
              <header className="lp-sec-head">
                <p className="lp-sec-num lp-mono" aria-hidden="true">03 — Cómo funciona</p>
                <h2 className="lp-h2" id="steps-title">De cero a operar en una tarde.</h2>
                <p className="lp-lead">Sin migraciones dolorosas y sin depender del cuaderno de la clínica.</p>
              </header>
            </Reveal>

            <Reveal delay={0.08}>
              <ol className="lp-pasos__linea" aria-label="Pasos para empezar">
                {PASOS.map((s) => (
                  <li className="lp-paso" key={s.num}>
                    <span className="lp-paso__num lp-mono" aria-hidden="true">{s.num}</span>
                    <span className="lp-paso__icon" aria-hidden="true"><Icon name={s.icon} size={22} /></span>
                    <h3 className="lp-paso__title">{s.titulo}</h3>
                    <p className="lp-paso__text">{s.texto}</p>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>

        {/* ================================================================
            S5 — CTA FINAL · Contraportada del expediente
        ================================================================ */}
        <section className="lp-cta-final" aria-labelledby="cta-title">
          <div className="lp-shell">
            <Reveal>
              <p className="lp-sec-num lp-mono lp-sec-num--clara" aria-hidden="true">04 — Empezá</p>
              <h2 className="lp-display" id="cta-title">Empezá el carnet de tu mascota hoy.</h2>
              <p className="lp-cta__sub">
                Creá tu cuenta, cargá tu mascota y su historial en minutos.
                El carnet se comparte solo: una veterinaria nueva lo retoma donde quedó.
              </p>
              <div className="lp-cta__acciones">
                {isAuthenticated ? (
                  <Link to="/dashboard" className="lp-btn-clara">
                    Ir al dashboard <Icon name="arrow_forward" size={18} aria-hidden="true" />
                  </Link>
                ) : (
                  <Link to="/auth-method" className="lp-btn-clara">
                    Creá tu cuenta gratis <Icon name="arrow_forward" size={18} aria-hidden="true" />
                  </Link>
                )}
                <Link to="/login" className="lp-link-clara">Iniciar sesión</Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ================================================================
          FOOTER — contraportada
      ================================================================ */}
      <footer className="lp-footer">
        <div className="lp-shell">
          <div className="lp-footer__grid">
            <div className="lp-footer__brand">
              <img src="/logo.png" alt="OpenPaw" width="34" height="34" />
              <p className="lp-footer__tagline">El carnet de salud compartible, de por vida.</p>
              <p className="lp-footer__lugar">
                <Icon name="location_on" size={15} aria-hidden="true" /> San José, Costa Rica
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
            <p className="lp-mono">© 2026 OpenPaw Devs · Proyecto universitario</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
