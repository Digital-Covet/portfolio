import type { EditorForm, EditorOptions } from './types'

function MultiSelect({
  id,
  label,
  values,
  options,
  disabled,
  onChange,
}: {
  id: string
  label: string
  values: string[]
  options: string[]
  disabled: boolean
  onChange: (next: string[]) => void
}) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="field__input"
        multiple
        size={Math.min(4, Math.max(2, options.length))}
        value={values}
        disabled={disabled}
        aria-describedby={`${id}-hint`}
        onChange={(e) => onChange(Array.from(e.target.selectedOptions).map((o) => o.value))}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <span id={`${id}-hint`} className="cse-count">
        {values.length > 0 ? values.join(', ') : 'None selected'}
      </span>
    </div>
  )
}

/**
 * Fixed 360px metadata rail: Classification + Ownership cards.
 * Dependent selects narrow as the parent is picked (sector → industry →
 * key business), matching the list FilterBar pattern.
 */
export default function MetaRail({
  form,
  options,
  ownerName,
  ownerInitials,
  department,
  disabled,
  errors,
  onChange,
}: {
  form: EditorForm
  options: EditorOptions
  ownerName: string
  ownerInitials: string
  department: string
  disabled: boolean
  errors: Partial<Record<'clientId' | 'sector', string>>
  onChange: (patch: Partial<EditorForm>) => void
}) {
  const industryEnabled = form.sector !== ''
  const keyBusinessEnabled = industryEnabled && form.industry !== ''

  return (
    <aside className="cse-rail" aria-label="Case study details">
      <section className="cse-railcard" aria-labelledby="cse-class">
        <h2 id="cse-class" className="cse-railcard__title">
          Classification
        </h2>
        <div className="field">
          <label className="field__label" htmlFor="cse-client">
            Client
          </label>
          <select
            id="cse-client"
            className="field__input"
            value={form.clientId}
            disabled={disabled}
            aria-describedby={errors.clientId ? 'cse-client-error' : undefined}
            onChange={(e) => onChange({ clientId: e.target.value })}
          >
            <option value="">Select a client…</option>
            {options.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.clientId && (
            <p id="cse-client-error" className="field__error" role="alert">
              {errors.clientId}
            </p>
          )}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="cse-sector">
            Sector
          </label>
          <select
            id="cse-sector"
            className="field__input"
            value={form.sector}
            disabled={disabled}
            aria-describedby={errors.sector ? 'cse-sector-error' : undefined}
            onChange={(e) => onChange({ sector: e.target.value, industry: '', keyBusiness: '' })}
          >
            <option value="">Select…</option>
            {options.sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.sector && (
            <p id="cse-sector-error" className="field__error" role="alert">
              {errors.sector}
            </p>
          )}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="cse-industry">
            Industry
          </label>
          <select
            id="cse-industry"
            className="field__input"
            value={form.industry}
            disabled={disabled || !industryEnabled}
            onChange={(e) => onChange({ industry: e.target.value, keyBusiness: '' })}
          >
            <option value="">{industryEnabled ? 'Select…' : 'Pick a sector first…'}</option>
            {options.industries.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="cse-keybusiness">
            Key business
          </label>
          <select
            id="cse-keybusiness"
            className="field__input"
            value={form.keyBusiness}
            disabled={disabled || !keyBusinessEnabled}
            onChange={(e) => onChange({ keyBusiness: e.target.value })}
          >
            <option value="">{keyBusinessEnabled ? 'Select…' : 'Pick an industry first…'}</option>
            {options.keyBusinesses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <MultiSelect
          id="cse-categories"
          label="Work categories"
          values={form.categories}
          options={options.categories}
          disabled={disabled}
          onChange={(categories) => onChange({ categories })}
        />
        <MultiSelect
          id="cse-services"
          label="Services"
          values={form.services}
          options={options.services}
          disabled={disabled}
          onChange={(services) => onChange({ services })}
        />
        <MultiSelect
          id="cse-models"
          label="Business models"
          values={form.businessModels}
          options={options.businessModels}
          disabled={disabled}
          onChange={(businessModels) => onChange({ businessModels })}
        />
      </section>

      <section className="cse-railcard" aria-labelledby="cse-owner">
        <h2 id="cse-owner" className="cse-railcard__title">
          Ownership
        </h2>
        <p className="cse-owner">
          <span className="dash-avatar" aria-hidden="true">
            {ownerInitials}
          </span>
          <span className="cse-owner__name">{ownerName}</span>
        </p>
        <p className="cse-count">
          Department (read-only): <span className="telemetry">{department}</span>
        </p>
      </section>
    </aside>
  )
}
