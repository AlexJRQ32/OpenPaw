/* global describe, test, expect, vi, beforeEach */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { VeterinaryRegistrationPage } from '../features/veterinary-registration/pages/VeterinaryRegistrationPage'

vi.mock('../features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../shared/utils/api', () => ({
  authFetch: vi.fn(),
}))

/* Leaflet se mockea a nivel de módulo: el mapa real necesita layout y DOM
   con medidas (jsdom no los da). RegistroMapaUbicacion solo invoca la API de
   L dentro de useEffect; el fake permite verificar que el contenedor
   accesible existe sin romper el render (patrón ProfilePage.test T28 /
   TrasladosPage.test T35). */
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

function usuarioBase(overrides = {}) {
  return { nombre: 'David Chen', sub: '9', rolId: 4, email: 'dueno@openpaw.cr', ...overrides }
}

function llenarFormularioValido() {
  fireEvent.change(screen.getByLabelText('Nombre comercial'), {
    target: { value: 'Veterinaria San Francisco S.A.' },
  })
  fireEvent.change(screen.getByLabelText('Cédula jurídica'), {
    target: { value: '3-101-555555' },
  })
  fireEvent.change(screen.getByLabelText('Teléfono de contacto'), {
    target: { value: '+506 2222-3333' },
  })
  fireEvent.change(screen.getByLabelText('Dirección exacta'), {
    target: { value: 'Barrio Tournón, San José' },
  })
  fireEvent.change(screen.getByLabelText('Descripción'), {
    target: { value: 'Clínica de pequeñas especies con atención 24/7.' },
  })
}

describe('VeterinaryRegistrationPage (T37 — página única)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: usuarioBase() })
    authFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
  })

  function renderPage() {
    return render(
      <MemoryRouter>
        <VeterinaryRegistrationPage />
      </MemoryRouter>,
    )
  }

  test('renderiza página única con header y las secciones del wireframe', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1, name: 'Registro de comercio' })).toBeInTheDocument()
    expect(screen.getByText('Onboarding')).toBeInTheDocument()
    expect(screen.getByText('Pendiente de aprobación')).toBeInTheDocument()

    /* Secciones obligatorias del alcance #37 (+ equipo opcional conservado) */
    expect(screen.getByRole('heading', { level: 2, name: /Identidad comercial/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /Ubicación física/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /Equipo de trabajo/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /Documentación/ })).toBeInTheDocument()

    /* Checkbox de términos presente en el área de acción */
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    /* Botón único de envío */
    expect(screen.getByRole('button', { name: /Solicitar registro/i })).toBeInTheDocument()
  })

  test('prefilla el correo oficial con el email del usuario autenticado', () => {
    renderPage()
    expect(screen.getByLabelText('Correo oficial')).toHaveValue('dueno@openpaw.cr')
  })

  test('borrador corrupto con tipos inválidos se sana: render y edición sin TypeError (QA #2)', () => {
    /* Draft manipulado: números, null, objetos y arreglos en campos
       obligatorios. Antes del saneo, validateForm → form[field].trim()
       lanzaba TypeError en el primer keystroke y submitRequest dejaba una
       promesa rechazada sin capturar. */
    localStorage.setItem('openpaw_vet_form_draft', JSON.stringify({
      _v: 1,
      nombreComercio: 12345,
      cedulaJuridica: null,
      telefono: { malo: true },
      email: ['lista@invalida'],
      direccion: undefined,
    }))

    expect(() => renderPage()).not.toThrow()

    /* Todos los campos obligatorios quedan como strings vacíos (defaults) */
    expect(screen.getByLabelText('Nombre comercial')).toHaveValue('')
    expect(screen.getByLabelText('Cédula jurídica')).toHaveValue('')
    expect(screen.getByLabelText('Teléfono de contacto')).toHaveValue('')

    /* Editar ejecuta la validación campo a campo sin excepción */
    fireEvent.change(screen.getByLabelText('Nombre comercial'), {
      target: { value: 'Veterinaria San Francisco S.A.' },
    })
    expect(screen.getByLabelText('Nombre comercial')).toHaveValue('Veterinaria San Francisco S.A.')
  })

  test('mapa referencial accesible y chip refleja la dirección tecleada', () => {
    renderPage()

    const mapa = screen.getByRole('img', { name: /Mapa referencial/ })
    expect(mapa).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Dirección exacta'), {
      target: { value: 'Barrio Tournón, San José' },
    })
    expect(screen.getByText('Barrio Tournón, San José')).toBeInTheDocument()
  })

  test('dropzone deshabilitado con nota: sin inputs de archivo (backend no acepta adjuntos)', () => {
    renderPage()

    const dropzone = screen.getByText('Arrastra tu documento aquí').closest('.vreg-dropzone')
    expect(dropzone).not.toBeNull()
    expect(dropzone).toHaveAttribute('aria-disabled', 'true')

    /* El rediseño ya no monta un input file: el POST real es JSON-only */
    expect(document.querySelector('input[type="file"]')).toBeNull()

    expect(screen.getByText(/todavía no admite adjuntos/i)).toBeInTheDocument()
  })

  test('bloquea el envío sin datos ni términos: errores visibles, foco al primer campo inválido y sin POST', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /Solicitar registro/i }))

    /* Errores visibles de campos obligatorios */
    expect(screen.getAllByText('Este campo es obligatorio.').length).toBeGreaterThan(0)
    /* Error de términos visible */
    expect(screen.getByText(/Debes aceptar los Términos y Condiciones/i)).toBeInTheDocument()
    /* Foco movido al primer campo inválido (a11y) */
    expect(document.activeElement).toHaveAttribute('name', 'nombreComercio')
    /* Ningún request disparado */
    expect(authFetch).not.toHaveBeenCalled()
  })

  test('bloquea el envío con datos válidos si falta aceptar términos y enfoca el checkbox', () => {
    renderPage()
    llenarFormularioValido()

    fireEvent.click(screen.getByRole('button', { name: /Solicitar registro/i }))

    expect(screen.getByText(/Debes aceptar los Términos y Condiciones/i)).toBeInTheDocument()
    expect(document.activeElement).toHaveAttribute('id', 'vreg-terms')
    expect(authFetch).not.toHaveBeenCalled()
  })

  test('envía POST /veterinarias con el payload real al validar campos + términos, y muestra confirmación', async () => {
    renderPage()
    llenarFormularioValido()

    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /Solicitud de registro|Solicitar registro/i }))

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        expect.stringContaining('/veterinarias'),
        expect.objectContaining({ method: 'POST' }),
      )
    })

    const [, opts] = authFetch.mock.calls.find(([u]) => String(u).includes('/veterinarias'))
    expect(JSON.parse(opts.body)).toEqual({
      nombre: 'Veterinaria San Francisco S.A.',
      cedulaJuridica: '3-101-555555',
      direccion: 'Barrio Tournón, San José',
      telefono: '+506 2222-3333',
      email: 'dueno@openpaw.cr',
      descripcion: 'Clínica de pequeñas especies con atención 24/7.',
    })

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
