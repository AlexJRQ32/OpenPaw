import { renderHook, act } from '@testing-library/react'
import { useForm } from '../shared/hooks/useForm'

describe('useForm', () => {
  const initialValues = { email: '', password: '' }
  const validate = vi.fn((values) => {
    const errors = {}
    if (!values.email) errors.email = 'Email requerido'
    if (!values.password) errors.password = 'Password requerido'
    return errors
  })

  beforeEach(() => {
    validate.mockClear()
  })

  test('inicializa con valores por defecto', () => {
    const { result } = renderHook(() => useForm(initialValues, validate))
    expect(result.current.values).toEqual(initialValues)
    expect(result.current.errors).toEqual({})
  })

  test('updateField actualiza el valor correcto', () => {
    const { result } = renderHook(() => useForm(initialValues, validate))
    act(() => {
      result.current.updateField({
        target: { name: 'email', value: 'test@test.com', type: 'text' },
      })
    })
    expect(result.current.values.email).toBe('test@test.com')
  })

  test('validate ejecuta la función de validación', () => {
    const { result } = renderHook(() => useForm(initialValues, validate))
    act(() => {
      result.current.updateField({
        target: { name: 'email', value: 'test@test.com', type: 'text' },
      })
    })
    expect(validate).toHaveBeenCalled()
  })

  test('handleSubmit llama al callback con los valores', async () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() =>
      useForm({ email: 'a@b.c', password: '123' }, () => ({})),
    )

    await act(async () => {
      await result.current.handleSubmit(onSubmit)({ preventDefault: vi.fn() })
    })

    expect(onSubmit).toHaveBeenCalledWith({ email: 'a@b.c', password: '123' })
  })

  test('reset restablece los valores iniciales', () => {
    const { result } = renderHook(() => useForm(initialValues, validate))
    act(() => {
      result.current.updateField({
        target: { name: 'email', value: 'changed@test.com', type: 'text' },
      })
    })
    expect(result.current.values.email).toBe('changed@test.com')

    act(() => {
      result.current.reset()
    })
    expect(result.current.values).toEqual(initialValues)
    expect(result.current.errors).toEqual({})
  })
})