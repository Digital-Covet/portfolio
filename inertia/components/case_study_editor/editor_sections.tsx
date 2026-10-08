import { useRef, useState } from 'react'
import {
  BarChart3,
  BookOpen,
  FileText,
  Image as ImageIcon,
  Images,
  Paperclip,
  Quote,
  Video,
  X,
} from 'lucide-react'
import type { AttachmentItem, EditorForm, GalleryItem, MetricItem } from './types'
import { detectProvider } from './types'

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="cse-sectionhead">
      <span className="cse-sectionhead__icon" aria-hidden="true">
        {icon}
      </span>
      <h2 className="cse-sectionhead__title">{title}</h2>
    </div>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="field__error" role="alert">
      {message}
    </p>
  )
}

/** Title (borderless) + server-set slug telemetry + summary counter. */
export function TitleSummary({
  form,
  disabled,
  errors,
  onChange,
}: {
  form: EditorForm
  disabled: boolean
  errors: Partial<Record<'title' | 'summary', string>>
  onChange: (patch: Partial<EditorForm>) => void
}) {
  return (
    <section aria-labelledby="cse-title">
      <h2 id="cse-title" className="visually-hidden">
        Title and summary
      </h2>
      <label className="visually-hidden" htmlFor="cse-title-input">
        Case study title
      </label>
      <input
        id="cse-title-input"
        className="cse-titleinput"
        value={form.title}
        disabled={disabled}
        placeholder="Case study title"
        onChange={(e) => onChange({ title: e.target.value })}
        onBlur={() => {}}
      />
      <p className="telemetry cse-slug" aria-label="Slug">
        /{form.slug || 'untitled'}
      </p>
      <FieldError id="cse-title-error" message={errors.title} />

      <div className="field cse-summary">
        <label className="field__label" htmlFor="cse-summary">
          <span className="cse-sectionhead__icon" aria-hidden="true">
            <FileText size={15} />
          </span>{' '}
          Summary
        </label>
        <textarea
          id="cse-summary"
          className="field__input cse-textarea"
          rows={3}
          maxLength={240}
          value={form.summary}
          disabled={disabled}
          placeholder="One sharp paragraph a client can scan in ten seconds."
          aria-describedby={`cse-summary-count${errors.summary ? ' cse-summary-error' : ''}`}
          onChange={(e) => onChange({ summary: e.target.value })}
        />
        <div className="cse-countrow">
          <FieldError id="cse-summary-error" message={errors.summary} />
          <span id="cse-summary-count" className="telemetry cse-count">
            {form.summary.length} / 240
          </span>
        </div>
      </div>
    </section>
  )
}

/** Hero dropzone: idle dashed tile → uploading progress → preview. */
export function HeroImage({
  form,
  disabled,
  uploading,
  error,
  onPick,
  onRemove,
}: {
  form: EditorForm
  disabled: boolean
  uploading: boolean
  error?: string
  onPick: (file: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  return (
    <section aria-labelledby="cse-hero">
      <SectionHeader icon={<ImageIcon size={17} />} title="Hero image" />
      <h2 id="cse-hero" className="visually-hidden">
        Hero image
      </h2>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="visually-hidden"
        tabIndex={-1}
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onPick(file)
          e.target.value = ''
        }}
      />
      {form.heroImageUrl ? (
        <div className="cse-hero">
          <img src={form.heroImageUrl} alt="Hero preview" className="cse-hero__img" />
          <div className="cse-hero__actions">
            <button
              type="button"
              className="btn btn--outline btn--sm"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              Replace
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={disabled}
              onClick={onRemove}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="cse-dropzone"
          data-drag={dragOver ? 'true' : 'false'}
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const file = e.dataTransfer.files?.[0]
            if (file) onPick(file)
          }}
        >
          {uploading ? (
            <span
              className="cse-dropzone__progress"
              role="progressbar"
              aria-label="Uploading hero image"
            >
              <span className="cse-dropzone__bar" />
            </span>
          ) : (
            <span>Drop an image or browse</span>
          )}
          <span className="telemetry-label">16:9 · JPG or PNG</span>
        </button>
      )}
      <FieldError id="cse-hero-error" message={error} />
    </section>
  )
}

/** Sortable gallery tiles with keyboard move support + add tile. */
export function Gallery({
  items,
  disabled,
  onAdd,
  onRemove,
  onMove,
  onRetry,
}: {
  items: GalleryItem[]
  disabled: boolean
  onAdd: (files: FileList) => void
  onRemove: (key: string) => void
  onMove: (from: number, to: number) => void
  onRetry: (key: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [liveMessage, setLiveMessage] = useState('')

  return (
    <section aria-labelledby="cse-gallery">
      <SectionHeader icon={<Images size={17} />} title="Gallery" />
      <h2 id="cse-gallery" className="visually-hidden">
        Gallery
      </h2>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="visually-hidden"
        tabIndex={-1}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files?.length) onAdd(e.target.files)
          e.target.value = ''
        }}
      />
      <ul className="cse-gallery" aria-label="Gallery images">
        {items.map((item, index) => (
          <li key={item.key} className="cse-tile" data-failed={item.failed ? 'true' : 'false'}>
            {item.uploading ? (
              <span
                className="cse-tile__progress"
                role="progressbar"
                aria-label={`Uploading image ${index + 1}`}
              />
            ) : item.failed ? (
              <span className="cse-tile__failed">
                <span aria-hidden="true">!</span>
                <button type="button" className="dash-link" onClick={() => onRetry(item.key)}>
                  Retry
                </button>
              </span>
            ) : (
              <img
                src={item.url}
                alt={`Gallery image ${index + 1} of ${items.length}`}
                className="cse-tile__img"
              />
            )}
            <span className="cse-tile__tools">
              <button
                type="button"
                className="iconbtn iconbtn--sm"
                aria-label={`Remove image ${index + 1}`}
                disabled={disabled}
                onClick={() => onRemove(item.key)}
              >
                <X size={13} aria-hidden />
              </button>
            </span>
            <span className="cse-tile__move" role="group" aria-label={`Move image ${index + 1}`}>
              <button
                type="button"
                disabled={disabled || index === 0}
                aria-label={`Move image ${index + 1} earlier`}
                onClick={() => {
                  onMove(index, index - 1)
                  setLiveMessage(`Image ${index + 1} moved to position ${index}`)
                }}
              >
                ‹
              </button>
              <button
                type="button"
                disabled={disabled || index === items.length - 1}
                aria-label={`Move image ${index + 1} later`}
                onClick={() => {
                  onMove(index, index + 1)
                  setLiveMessage(`Image ${index + 1} moved to position ${index + 2}`)
                }}
              >
                ›
              </button>
            </span>
          </li>
        ))}
        <li>
          <button
            type="button"
            className="cse-tile cse-tile--add"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <span aria-hidden="true">+</span>
            <span>Add images</span>
          </button>
        </li>
      </ul>
      <p className="visually-hidden" role="status" aria-live="polite">
        {liveMessage}
      </p>
    </section>
  )
}

/** Markdown chrome: Write/Preview tabs + toolbar over a plain textarea. */
export function StoryEditor({
  value,
  disabled,
  onChange,
}: {
  value: string
  disabled: boolean
  onChange: (next: string) => void
}) {
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const insert = (before: string, after = '') => {
    onChange(`${value}${value.endsWith('\n') || value === '' ? '' : '\n'}${before}text${after}\n`)
  }

  return (
    <section aria-labelledby="cse-story">
      <SectionHeader icon={<BookOpen size={17} />} title="Story" />
      <h2 id="cse-story" className="visually-hidden">
        Story
      </h2>
      <div className="cse-tabs" role="tablist" aria-label="Story mode">
        {(['write', 'preview'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            data-active={tab === t ? 'true' : 'false'}
            className="cs-tab"
            onClick={() => setTab(t)}
          >
            {t === 'write' ? 'Write' : 'Preview'}
          </button>
        ))}
      </div>
      {tab === 'write' ? (
        <>
          <div className="cse-toolbar" role="toolbar" aria-label="Markdown formatting">
            {[
              { label: 'Bold', run: () => insert('**', '**') },
              { label: 'Italic', run: () => insert('*', '*') },
              { label: 'Heading', run: () => insert('## ') },
              { label: 'List', run: () => insert('- ') },
              { label: 'Link', run: () => insert('[', '](https://)') },
              { label: 'Image', run: () => insert('![', ']()') },
              { label: 'Quote', run: () => insert('> ') },
              { label: 'Code', run: () => insert('`', '`') },
            ].map((b) => (
              <button
                key={b.label}
                type="button"
                className="cse-toolbtn"
                disabled={disabled}
                onClick={b.run}
              >
                {b.label}
              </button>
            ))}
          </div>
          <label className="visually-hidden" htmlFor="cse-story-input">
            Story markdown
          </label>
          <textarea
            id="cse-story-input"
            className="field__input cse-textarea cse-story"
            rows={10}
            value={value}
            disabled={disabled}
            placeholder="Tell the story: context, approach, outcome…"
            onChange={(e) => onChange(e.target.value)}
          />
        </>
      ) : (
        <div className="cse-preview" aria-label="Story preview">
          {value.trim() ? (
            <pre className="cse-preview__text">{value}</pre>
          ) : (
            <p className="cse-count">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </section>
  )
}

/** Video URLs with provider detection + 16:9 preview facade. */
export function VideoList({
  videos,
  disabled,
  onChange,
}: {
  videos: EditorForm['videos']
  disabled: boolean
  onChange: (next: EditorForm['videos']) => void
}) {
  return (
    <section aria-labelledby="cse-video">
      <SectionHeader icon={<Video size={17} />} title="Video" />
      <h2 id="cse-video" className="visually-hidden">
        Video
      </h2>
      <ul className="cse-list">
        {videos.map((v, i) => (
          <li key={`${v.url}-${i}`} className="cse-videorow">
            <div className="field" style={{ flex: 1 }}>
              <label className="visually-hidden" htmlFor={`cse-video-${i}`}>
                Video URL {i + 1}
              </label>
              <input
                id={`cse-video-${i}`}
                className="field__input"
                inputMode="url"
                placeholder="https://youtube.com/… or https://vimeo.com/…"
                value={v.url}
                disabled={disabled}
                onChange={(e) => {
                  const next = [...videos]
                  next[i] = { url: e.target.value, provider: detectProvider(e.target.value) }
                  onChange(next)
                }}
              />
            </div>
            <span className="telemetry-label">{v.provider === 'other' ? 'link' : v.provider}</span>
            <button
              type="button"
              className="iconbtn iconbtn--sm"
              aria-label={`Remove video ${i + 1}`}
              disabled={disabled}
              onClick={() => onChange(videos.filter((_, j) => j !== i))}
            >
              <X size={13} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      {videos.length > 0 && videos[0].url && (
        <div className="cse-videopreview" aria-label="Video preview">
          <span className="telemetry-label">16:9 preview · click-to-load on the portal</span>
        </div>
      )}
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        disabled={disabled}
        onClick={() => onChange([...videos, { url: '', provider: 'other' }])}
      >
        Add video
      </button>
    </section>
  )
}

/** Result metrics rows: label · value · suffix. */
export function ResultsEditor({
  metrics,
  disabled,
  onChange,
}: {
  metrics: MetricItem[]
  disabled: boolean
  onChange: (next: MetricItem[]) => void
}) {
  return (
    <section aria-labelledby="cse-results">
      <SectionHeader icon={<BarChart3 size={17} />} title="Results" />
      <h2 id="cse-results" className="visually-hidden">
        Results
      </h2>
      {metrics.length === 0 ? (
        <p className="cse-count">
          No metrics yet.{' '}
          <button
            type="button"
            className="dash-link"
            disabled={disabled}
            onClick={() => onChange([{ label: '', value: '', suffix: '' }])}
          >
            Add metric
          </button>
        </p>
      ) : (
        <ul className="cse-list">
          {metrics.map((m, i) => (
            <li key={i} className="cse-metricrow">
              <label className="visually-hidden" htmlFor={`cse-metric-label-${i}`}>
                Metric {i + 1} label
              </label>
              <input
                id={`cse-metric-label-${i}`}
                className="field__input"
                placeholder="Label"
                value={m.label}
                disabled={disabled}
                onChange={(e) => {
                  const next = [...metrics]
                  next[i] = { ...m, label: e.target.value }
                  onChange(next)
                }}
              />
              <label className="visually-hidden" htmlFor={`cse-metric-value-${i}`}>
                Metric {i + 1} value
              </label>
              <input
                id={`cse-metric-value-${i}`}
                className="field__input telemetry"
                placeholder="Value"
                value={m.value}
                disabled={disabled}
                onChange={(e) => {
                  const next = [...metrics]
                  next[i] = { ...m, value: e.target.value }
                  onChange(next)
                }}
              />
              <label className="visually-hidden" htmlFor={`cse-metric-suffix-${i}`}>
                Metric {i + 1} suffix
              </label>
              <select
                id={`cse-metric-suffix-${i}`}
                className="field__input"
                value={m.suffix}
                disabled={disabled}
                onChange={(e) => {
                  const next = [...metrics]
                  next[i] = { ...m, suffix: e.target.value as MetricItem['suffix'] }
                  onChange(next)
                }}
              >
                <option value="">—</option>
                <option value="%">%</option>
                <option value="x">x</option>
                <option value="+">+</option>
              </select>
              <button
                type="button"
                className="iconbtn iconbtn--sm"
                aria-label={`Remove metric ${i + 1}`}
                disabled={disabled}
                onClick={() => onChange(metrics.filter((_, j) => j !== i))}
              >
                <X size={13} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {metrics.length > 0 && (
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          disabled={disabled}
          onClick={() => onChange([...metrics, { label: '', value: '', suffix: '' }])}
        >
          Add metric
        </button>
      )}
    </section>
  )
}

export function TestimonialFields({
  form,
  disabled,
  onChange,
}: {
  form: EditorForm
  disabled: boolean
  onChange: (patch: Partial<EditorForm>) => void
}) {
  return (
    <section aria-labelledby="cse-quote">
      <SectionHeader icon={<Quote size={17} />} title="Testimonial" />
      <h2 id="cse-quote" className="visually-hidden">
        Testimonial
      </h2>
      <div className="field">
        <label className="visually-hidden" htmlFor="cse-quote-input">
          Quote
        </label>
        <textarea
          id="cse-quote-input"
          className="field__input cse-textarea"
          rows={3}
          value={form.testimonialQuote}
          disabled={disabled}
          placeholder="Client quote…"
          onChange={(e) => onChange({ testimonialQuote: e.target.value })}
        />
      </div>
      <div className="cse-2col">
        <div className="field">
          <label className="field__label" htmlFor="cse-quote-name">
            Name
          </label>
          <input
            id="cse-quote-name"
            className="field__input"
            value={form.testimonialName}
            disabled={disabled}
            onChange={(e) => onChange({ testimonialName: e.target.value })}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="cse-quote-role">
            Role and company
          </label>
          <input
            id="cse-quote-role"
            className="field__input"
            value={form.testimonialRole}
            disabled={disabled}
            onChange={(e) => onChange({ testimonialRole: e.target.value })}
          />
        </div>
      </div>
    </section>
  )
}

export function AttachmentsList({
  items,
  disabled,
  onAdd,
  onRemove,
}: {
  items: AttachmentItem[]
  disabled: boolean
  onAdd: (files: FileList) => void
  onRemove: (key: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <section aria-labelledby="cse-files">
      <SectionHeader icon={<Paperclip size={17} />} title="Attachments" />
      <h2 id="cse-files" className="visually-hidden">
        Attachments
      </h2>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="visually-hidden"
        tabIndex={-1}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files?.length) onAdd(e.target.files)
          e.target.value = ''
        }}
      />
      {items.length > 0 && (
        <ul className="cse-list">
          {items.map((a) => (
            <li key={a.key} className="cse-filerow">
              <span aria-hidden="true">📄</span>
              <span className="cse-filerow__name">{a.name}</span>
              <span className="telemetry cse-count">{a.size}</span>
              <button
                type="button"
                className="iconbtn iconbtn--sm"
                aria-label={`Remove ${a.name}`}
                disabled={disabled}
                onClick={() => onRemove(a.key)}
              >
                <X size={13} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="btn btn--outline btn--sm"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        Add file
      </button>
    </section>
  )
}
