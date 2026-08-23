/* global describe, test, expect, vi, beforeEach */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { StoreRegistrationPage } from '../features/store-registration/pages/StoreRegistrationPage'

vi.mock('../features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../shared/utils/api', () => ({
  authFetch: vi.fn(),
}))

/* Leaflet se mockea a nivel de módulo: el mapa real necesita layout y DOM
   con medidas (jsdom no los da). RegistroMapaAlmacen solo invoca la API de L
   dentro de useEffect; el fake permite verificar que el contenedor accesible
   existe sin romper el render (patrón VeterinaryRegistrationPage.test T37 /
   ProfilePage.test T28 / TrasladosPage.test T35). */
vi.mock('leaflet', () => {
  const addTo = vi.fn()
  const remove = vi.fn()
  return {
    default: {
      map: vi.fn(() => ({ remove, setView: vi.fn() })),
      divIcon: vi.fn(() => ({})),
      tileLayer: vi.fn(() => ({ addTo })),
      marker: vi.fn(() => ({ addTo })),
    },
  }
})

import { useAuth } from '../features/auth/context/AuthContext'
import { authFetch } from '../shared/utils/api'

const DRAFT_KEY = 'openpaw_store_form_draft'

function usuarioBase(overrides = {}) {
  return { nombre: 'David Chen', sub: '9', rolId: 4, email: 'dueno@openpaw.cr', ...overrides }
}

function llenarCamposObligatorios() {
  fireEvent.change(screen.getByLabelText('Nombre del almacén'), {
    target: { value: 'Almacén Central Veterinaria Sur' },
  })
  fireEvent.change(screen.getByLabelText('Cédula jurídica'), {
    target: { value: '3-101-444444' },
  })
  fireEvent.change(screen.getByLabelText('Teléfono'), {
    target: { value: '+506 2255-6677' },
  })
  fireEvent.change(screen.getByLabelText('Dirección completa'), {
    target: { value: 'San Pedro, San José' },
  })
}

describe('StoreRegistrationPage (T38 — página única)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: usuarioBase() })
    authFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
  })

  function renderPage() {
    return render(
      <MemoryRouter>
        <StoreRegistrationPage />
      </MemoryRouter>,
    )
  }

  test('renderiza página única con header y las secciones del wireframe', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: 'Solicitud de registro de almacén veterinario' })).toBeInTheDocument()
    expect(screen.getByText('Onboarding')).toBeInTheDocument()
    expect(screen.getByText('Pendiente de aprobación')).toBeInTheDocument()

    /* Secciones del alcance #38 (+ equipo opcional conservado del wizard) */
    expect(screen.getByRole('heading', { level: 2, name: /Información general/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /Ubicación y capacidad/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /Equipo de trabajo/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /Documentación/ })).toBeInTheDocument()

    /* Campos de capacidad del wireframe aceptados por CrearAlmacenDto */
    expect(screen.getByLabelText('Tipo de almacén')).toBeInTheDocument()
    expect(screen.getByLabelText('Capacidad de almacenamiento')).toBeInTheDocument()
    expect(screen.getByLabelText('Control de temperatura')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre del responsable')).toBeInTheDocument()

    /* Acciones del wireframe: guardar borrador + envío */
    expect(screen.getByRole('button', { name: /Guardar borrador/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Enviar Solicitud/i })).toBeInTheDocument()
  })

  test('el wireframe del almacén NO incluye gate de términos: sin checkboxes', () => {
    /* Decisión documentada: a diferencia del registro de veterinaria (T37),
       este wireframe no replica términos y condiciones. El test fija la
       decisión para que un checkbox accidental se detecte en QA. */
    renderPage()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  test('prefilla el email con el correo del usuario autenticado', () => {
    renderPage()
    expect(screen.getByLabelText('Email')).toHaveValue('dueno@openpaw.cr')
  })

  test('borrador corrupto con tipos inválidos se sana: render y edición sin TypeError (QA T37 replicado)', () => {
    /* Draft manipulado: números, null, objetos, arreglos y booleanos en
       campos del formulario. Antes del saneo, validateStoreRegistrationForm →
       form[field].trim() lanzaba TypeError en el primer keystroke. */
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      _v: 1,
      nombreAlmacen: 12345,
      cedulaJuridica: null,
      telefono: { malo: true },
      email: ['lista@invalida'],
      direccion: undefined,
      tipoAlmacen: {},
      capacidadAlmacenamiento: 42,
      controlTemperatura: false,
      claveDesconocida: 'inyectada',
    }))

    expect(() => renderPage()).not.toThrow()

    /* Campos de texto quedan como strings vacíos (defaults) y las claves
       desconocidas NUNCA entran al formulario */
    expect(screen.getByLabelText('Nombre del almacén')).toHaveValue('')
    expect(screen.getByLabelText('Cédula jurídica')).toHaveValue('')
    expect(screen.getByLabelText('Teléfono')).toHaveValue('')
    expect(screen.getByLabelText('Tipo de almacén')).toHaveValue('')
    expect(screen.getByLabelText('Capacidad de almacenamiento')).toHaveValue('')
    /* ControlTemperatura tiene default válido (SinControl) al no ser string */
    expect(screen.getByLabelText('Control de temperatura')).toHaveValue('SinControl')

    /* Editar ejecuta la validación campo a campo sin excepción */
    fireEvent.change(screen.getByLabelText('Nombre del almacén'), {
      target: { value: 'Almacén Central Veterinaria Sur' },
    })
    expect(screen.getByLabelText('Nombre del almacén')).toHaveValue('Almacén Central Veterinaria Sur')
  })

  test('borrador válido guardado previamente se restaura (texto y selects)', () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      _v: 1,
      nombreAlmacen: 'Almacén guardado ayer',
      direccion: 'Heredia Centro, frente al parque',
      capacidadAlmacenamiento: 'Mas500',
      controlTemperatura: 'CadenaFrio',
    }))

    renderPage()

    expect(screen.getByLabelText('Nombre del almacén')).toHaveValue('Almacén guardado ayer')
    expect(screen.getByLabelText('Dirección completa')).toHaveValue('Heredia Centro, frente al parque')
    expect(screen.getByLabelText('Capacidad de almacenamiento')).toHaveValue('Mas500')
    expect(screen.getByLabelText('Control de temperatura')).toHaveValue('CadenaFrio')
  })

  test('botón Guardar borrador persiste _v:1 con el estado actual y muestra feedback accesible', () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Nombre del almacén'), {
      target: { value: 'Borrador explícito S.A.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Guardar borrador/i }))

    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY))
    expect(draft._v).toBe(1)
    expect(draft.nombreAlmacen).toBe('Borrador explícito S.A.')
    expect(draft.capacidadAlmacenamiento).toBe('')

    expect(screen.getByText(/Borrador guardado a las/)).toBeInTheDocument()
  })

  test('mapa referencial accesible y chip refleja la dirección tecleada', () => {
    renderPage()

    const mapa = screen.getByRole('img', { name: /Mapa referencial de la ubicación del almacén/ })
    expect(mapa).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Dirección completa'), {
      target: { value: 'San Pedro, San José' },
    })
    expect(screen.getByText('San Pedro, San José')).toBeInTheDocument()
  })

  test('dropzone deshabilitado con nota: sin inputs de archivo (backend no acepta adjuntos)', () => {
    renderPage()

    const dropzone = screen.getByText('Arrastre y suelte los documentos aquí').closest('.sreg-dropzone')
    expect(dropzone).not.toBeNull()
    expect(dropzone).toHaveAttribute('aria-disabled', 'true')

    /* El rediseño ya no monta un input file: el POST real es JSON-only */
    expect(document.querySelector('input[type="file"]')).toBeNull()

    expect(screen.getByText(/todavía no admite adjuntos/i)).toBeInTheDocument()
  })

  test('bloquea el envío vacío: errores visibles, foco al primer campo inválido y sin POST', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    /* Errores visibles de campos obligatorios (validation.js + wireframe) */
    expect(screen.getAllByText('Este campo es obligatorio.').length).toBeGreaterThan(0)
    expect(screen.getByText('Selecciona el tipo de almacén.')).toBeInTheDocument()
    expect(screen.getByText('Selecciona la capacidad de almacenamiento.')).toBeInTheDocument()

    /* Foco movido al primer campo inválido en orden DOM (a11y) */
    expect(document.activeElement).toHaveAttribute('name', 'nombreAlmacen')

    /* Ningún request disparado */
    expect(authFetch).not.toHaveBeenCalled()
  })

  test('bloquea el envío si falta la capacidad y enfoca ese select', () => {
    renderPage()
    llenarCamposObligatorios()
    fireEvent.change(screen.getByLabelText('Tipo de almacén'), {
      target: { value: 'Externo' },
    })
    fireEvent.change(screen.getByLabelText('Nombre del responsable'), {
      target: { value: 'María Rodríguez' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    expect(screen.getByText('Selecciona la capacidad de almacenamiento.')).toBeInTheDocument()
    expect(document.activeElement).toHaveAttribute('name', 'capacidadAlmacenamiento')
    expect(authFetch).not.toHaveBeenCalled()
  })

  test('envía POST /almacenes con enums válidos y SIN coordenadas ni adjuntos', async () => {
    renderPage()
    llenarCamposObligatorios()
    fireEvent.change(screen.getByLabelText('Tipo de almacén'), {
      target: { value: 'CentroDistribucion' },
    })
    fireEvent.change(screen.getByLabelText('Nombre del responsable'), {
      target: { value: 'María Rodríguez' },
    })
    fireEvent.change(screen.getByLabelText('Capacidad de almacenamiento'), {
      target: { value: 'De150a500' },
    })
    fireEvent.change(screen.getByLabelText('Control de temperatura'), {
      target: { value: 'CadenaFrio' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        expect.stringContaining('/almacenes'),
        expect.objectContaining({ method: 'POST' }),
      )
    })

    const [, opts] = authFetch.mock.calls.find(([u]) => String(u).includes('/almacenes'))
    const body = JSON.parse(opts.body)

    /* Payload EXACTO: solo campos que CrearAlmacenDto acepta. Latitud/
       Longitud existen en el DTO pero jamás se envían (mapa posicional);
       tampoco hay multipart/adjuntos. */
    expect(body).toEqual({
      nombre: 'Almacén Central Veterinaria Sur',
      cedulaJuridica: '3-101-444444',
      direccion: 'San Pedro, San José',
      telefono: '+506 2255-6677',
      email: 'dueno@openpaw.cr',
      descripcion: '',
      tipoAlmacen: 'CentroDistribucion',
      nombreResponsable: 'María Rodríguez',
      capacidadAlmacenamiento: 'De150a500',
      controlTemperatura: 'CadenaFrio',
    })
    expect(body).not.toHaveProperty('latitud')
    expect(body).not.toHaveProperty('longitud')

    /* Confirmación de éxito (conservada del wizard original) */
    expect(await screen.findByText('Solicitud enviada correctamente')).toBeInTheDocument()
  })

  test('sección opcional de equipo: agrega y quita funcionarios', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /Agregar funcionario/i }))
    expect(screen.getByText('Funcionario #1')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Quitar funcionario 1'))
    expect(screen.queryByText('Funcionario #1')).not.toBeInTheDocument()
  })
})
