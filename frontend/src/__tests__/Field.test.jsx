import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Field } from '../shared/components/Field/Field'

describe('Field', () => {
  test('renderiza label e input', () => {
    render(<Field label="Email" name="email" value="" onChange={() => {}} />)
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  test('muestra el mensaje de error', () => {
    render(
      <Field label="Email" name="email" value="" error="Campo requerido" onChange={() => {}} />,
    )
    expect(screen.getByText('Campo requerido')).toBeInTheDocument()
  })

  test('onChange se dispara al escribir', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Field label="Email" name="email" value="" onChange={onChange} />)
    await user.type(screen.getByLabelText('Email'), 'a')
    expect(onChange).toHaveBeenCalled()
  })
})