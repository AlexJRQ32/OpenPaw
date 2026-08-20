import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    console.error(error)
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <section style={{ maxWidth: 480, width: '100%', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24, boxShadow: '0 8px 24px rgba(16,24,40,0.08)' }}>
            <h1 style={{ margin: '0 0 8px', fontSize: 22, color: '#101828' }}>No se pudo cargar esta pantalla</h1>
            <p style={{ margin: 0, color: '#667085', lineHeight: 1.5 }}>
              Recarga la pagina. Si vuelve a pasar, revisa la consola para ver el detalle del error.
            </p>
            <pre style={{ whiteSpace: 'pre-wrap', margin: '16px 0 0', color: '#b42318', fontSize: 12 }}>
              {this.state.error?.message}
            </pre>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
