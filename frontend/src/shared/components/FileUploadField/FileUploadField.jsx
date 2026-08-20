export function FileUploadField({ name, accept, summary, error, onChange }) {
  return (
    <>
      <label className="upload-field">
        <input
          name={name}
          type="file"
          accept={accept}
          onChange={onChange}
        />
        <span>Adjuntar documento</span>
        <strong>{summary}</strong>
      </label>
      {error && <small className="field-error">{error}</small>}
    </>
  )
}
