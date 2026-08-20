import { Link } from "react-router-dom"
import { useAuth } from "../../auth/context/AuthContext"
import { LandingNavbar } from "../../../shared/components/LandingNavbar/LandingNavbar"
import { Reveal } from "../../../shared/components/Reveal/Reveal"
import "./LandingPage.css"

const SERVICIOS = [
  "Vacunas", "Consultas", "Grooming", "Cirugias", "Desparasitacion", "Expedientes", "Citas", "Laboratorio",
]

const FEATURES = [
  { id: "01", icon: "fas fa-paw", title: "Expediente unico", text: "Historial medico centralizado por mascota: vacunas, consultas, cirugias y recetas en un solo lugar." },
  { id: "02", icon: "fas fa-share-alt", title: "Comparte al instante", text: "Comparte el expediente con cualquier veterinario o clinica con un solo clic." },
  { id: "03", icon: "fas fa-calendar-check", title: "Citas sin friccion", text: "Agenda veterinaria con reservas, recordatorios y seguimiento de cada paciente." },
  { id: "04", icon: "fas fa-store", title: "Marketplace de confianza", text: "Explora productos y servicios de veterinarias y almacenes con stock real." },
]

const STEPS = [
  { numero: "01", titulo: "Crea tu cuenta", detalle: "Registrate como dueno o veterinaria en menos de un minuto." },
  { numero: "02", titulo: "Agrega tus mascotas", detalle: "Registra el historial, vacunas y datos de cada paciente." },
  { numero: "03", titulo: "Vive tranquilo", detalle: "Comparte expedientes, agenda citas y recibe alertas." },
]

export function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <>
      <LandingNavbar />
      <main className="landing">
        {/* HERO */}
        <section className="hero">
          <div className="hero-glow hero-glow--a" aria-hidden="true" />
          <div className="hero-glow hero-glow--b" aria-hidden="true" />
          <div className="hero-grid" aria-hidden="true" />

          <div className="hero-copy">
            <p className="hero-eyebrow">Historial clinico compartible</p>
            <h1 className="hero-title">
              El historial de tu mascota,
              <br />
              <em>siempre contigo.</em>
            </h1>
            <p className="hero-sub">
              OpenPaw junta vacunas, consultas, citas y expedientes de tus mascotas
              en un solo lugar. Compartilo con tu veterinaria de confianza cuando quieras.
            </p>
            <div className="hero-actions">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary">
                  Ir al dashboard <i className="fas fa-arrow-right" />
                </Link>
              ) : (
                <>
                  <Link to="/auth-method" className="btn-primary">
                    Crear cuenta gratis <i className="fas fa-arrow-right" />
                  </Link>
                  <Link to="/login" className="btn-ghost">Ya tengo cuenta</Link>
                </>
              )}
            </div>

            <dl className="hero-stats">
              <div className="hero-stat">
                <dt>Un solo</dt><dd>expediente</dd>
              </div>
              <div className="hero-stat">
                <dt>Solo</dt><dd>un clic</dd>
              </div>
              <div className="hero-stat">
                <dt>Cero</dt><dd>papeles</dd>
              </div>
            </dl>
          </div>

          {/* Ficha de mascota construida en CSS */}
          <div className="hero-visual" aria-hidden="true">
            <div className="pet-panel">
              <div className="pet-panel__glow" aria-hidden="true" />

              <header className="pet-profile">
                <div className="pet-avatar">
                  <i className="fas fa-dog" />
                </div>
                <div className="pet-profile__info">
                  <span className="pet-badge"><i className="fas fa-shield-heart" />Vacunas al dia</span>
                  <strong className="pet-name">Rex</strong>
                  <span className="pet-meta">Labrador · 4 anios</span>
                </div>
              </header>

              <div className="pet-vaccines">
                <div className="pet-vaccines__head">
                  <span>Cobertura de vacunas</span>
                  <strong>80%</strong>
                </div>
                <div className="pet-progress">
                  <span className="pet-progress__bar" />
                </div>
                <small className="pet-vaccines__note">4 de 5 vacunas al corriente</small>
              </div>

              <div className="pet-cards">
                <div className="pet-mini">
                  <span className="pet-mini__icon pet-mini__icon--cal"><i className="fas fa-calendar-check" /></span>
                  <div>
                    <small>Proxima cita</small>
                    <strong>12 ago · Veterinaria Central</strong>
                  </div>
                </div>
                <div className="pet-mini">
                  <span className="pet-mini__icon pet-mini__icon--ok"><i className="fas fa-user-shield" /></span>
                  <div>
                    <small>Expediente</small>
                    <strong>Compartido con 2 veterinarias</strong>
                  </div>
                </div>
              </div>

              <ul className="pet-tags">
                <li><i className="fas fa-syringe" />Vacunas</li>
                <li><i className="fas fa-calendar-check" />Citas</li>
                <li><i className="fas fa-folder-open" />Expediente</li>
              </ul>
            </div>
          </div>
        </section>

        {/* TICKER */}
        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
            {[...SERVICIOS, ...SERVICIOS].map((s, i) => (
              <span key={i} className="ticker-item">{s}</span>
            ))}
          </div>
        </div>

        {/* ABOUT */}
        <section className="about" id="about">
          <Reveal>
            <div className="about-head">
              <p className="section-kicker">La idea</p>
              <h2 className="section-title">
                Dejar de perseguir historiales
                <br />
                <em>entre veterinarias.</em>
              </h2>
            </div>
          </Reveal>
          <div className="about-body">
            <Reveal delay={0.1}>
              <p className="about-lead">
                Cada mascota tiene su historia, sus vacunas y sus citas. Entre un
                veterinario y otro, es facil perder el rastro. OpenPaw centraliza
                todo para que solo te preocupes por una pantalla.
              </p>
            </Reveal>
            <div className="about-highlights">
              <Reveal delay={0.15}>
                <div className="highlight-item">
                  <i className="fas fa-user-group" aria-hidden="true" />
                  <div>
                    <strong>Multi-usuario</strong>
                    <small>Duenos y veterinarias comparten el mismo expediente</small>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.25}>
                <div className="highlight-item">
                  <i className="fas fa-bell" aria-hidden="true" />
                  <div>
                    <strong>Alertas a tiempo</strong>
                    <small>Avisos de citas y recordatorios de vacunas, sin sorpresas</small>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.35}>
                <div className="highlight-item">
                  <i className="fas fa-lock" aria-hidden="true" />
                  <div>
                    <strong>Privacidad real</strong>
                    <small>Vos decis quien accede al historial de tu mascota</small>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="features" id="features">
          <Reveal>
            <div className="features-head">
              <p className="section-kicker">Funcionalidades</p>
              <h2 className="section-title">
                Simple de usar,
                <br />
                <em>serio por dentro.</em>
              </h2>
            </div>
          </Reveal>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <Reveal key={f.id} delay={i * 0.1}>
                <article className="feature-card">
                  <span className="feature-card__num">{f.id}</span>
                  <i className={`${f.icon} feature-icon`} aria-hidden="true" />
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* COMO */}
        <section className="how" id="how">
          <Reveal>
            <div className="how-head">
              <p className="section-kicker">Como funciona</p>
              <h2 className="section-title">
                En tres pasos,
                <br />
                <em>estas dentro.</em>
              </h2>
            </div>
          </Reveal>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <Reveal key={s.numero} delay={i * 0.15}>
                <li className="step">
                  <span className="step__num">{s.numero}</span>
                  <h3>{s.titulo}</h3>
                  <p>{s.detalle}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <section className="cta">
          <div className="cta-glow" aria-hidden="true" />
          <Reveal>
            <h2 className="cta-title">
              El bienestar de tu mascota no deberia estar disperso.
            </h2>
            <p className="cta-sub">
              Crea tu cuenta gratis y ten el historial de tu mascota donde puedas verlo.
            </p>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary btn-primary--light">
                Ir al dashboard <i className="fas fa-arrow-right" />
              </Link>
            ) : (
              <Link to="/auth-method" className="btn-primary btn-primary--light">
                Comenzar gratis <i className="fas fa-arrow-right" />
              </Link>
            )}
          </Reveal>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-brand__head">
                <img src="/logo.png" alt="OpenPaw" className="footer-logo" />
                <span className="footer-brand__name">OpenPaw</span>
              </div>
              <p className="footer-brand__tagline">El historial de tu mascota, siempre contigo.</p>
              <div className="footer-social">
                <a href="#" aria-label="OpenPaw en Facebook"><i className="fab fa-facebook-f" /></a>
                <a href="#" aria-label="OpenPaw en Instagram"><i className="fab fa-instagram" /></a>
                <a href="#" aria-label="OpenPaw en X"><i className="fab fa-x-twitter" /></a>
              </div>
            </div>

            <nav className="footer-col" aria-label="Producto">
              <h3 className="footer-col__title">Producto</h3>
              <a href="#about">La idea</a>
              <a href="#features">Funcionalidades</a>
              <a href="#how">Como funciona</a>
              <Link to="/marketplace">Marketplace</Link>
            </nav>

            <nav className="footer-col" aria-label="Cuenta">
              <h3 className="footer-col__title">Cuenta</h3>
              <Link to="/login">Iniciar sesion</Link>
              <Link to="/auth-method">Crear cuenta</Link>
              <Link to="/dashboard">Dashboard</Link>
            </nav>

            <nav className="footer-col" aria-label="Legal">
              <h3 className="footer-col__title">Legal</h3>
              <a href="#">Privacidad</a>
              <a href="#">Terminos</a>
              <a href="#">Contacto</a>
            </nav>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2026 OpenPaw. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </>
  )
}

export default LandingPage
