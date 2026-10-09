import { useId, useRef, useState, type ReactNode } from 'react'
import { UploadCloud } from 'lucide-react'
import { toast } from 'sonner'
import { uploadFile, type Uploaded } from '~/lib/upload'

type Props = {
  kind: 'image' | 'attachment'
  accept: string
  multiple?: boolean
  /** Visible prompt; the whole zone is also a focusable button. */
  prompt: ReactNode
  hint?: string
  compact?: boolean
  className?: string
  onUploaded: (file: Uploaded) => void
  /** Fires while any upload is running, so the page can hold back saves. */
  onBusyChange?: (busy: boolean) => void
}

type Job = { key: string; name: string; progress: number }

/** Drag-and-drop zone with a keyboard-operable button fallback and per-file progress. */
export function Dropzone({
  kind,
  accept,
  multiple,
  prompt,
  hint,
  compact,
  className = '',
  onUploaded,
  onBusyChange,
}: Props) {
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const active = useRef(0)
  const [over, setOver] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])

  const run = async (files: File[]) => {
    for (const file of multiple ? files : files.slice(0, 1)) {
      const key = `${file.name}-${crypto.randomUUID()}`
      active.current++
      onBusyChange?.(true)
      setJobs((j) => [...j, { key, name: file.name, progress: 0 }])
      try {
        const done = await uploadFile(file, kind, (p) =>
          setJobs((j) => j.map((x) => (x.key === key ? { ...x, progress: p } : x)))
        )
        onUploaded(done)
      } catch (e) {
        toast.error(`${file.name}: ${(e as Error).message}`)
      } finally {
        setJobs((j) => j.filter((x) => x.key !== key))
        if (--active.current === 0) onBusyChange?.(false)
      }
    }
  }

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          void run([...e.dataTransfer.files])
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-md border border-dashed text-center transition-colors ${over ? 'border-primary bg-primary/10' : 'border-border-strong'} ${compact ? 'px-4 py-4' : 'aspect-video px-6'}`}
      >
        <UploadCloud size={20} strokeWidth={1.75} className="text-muted-foreground" aria-hidden />
        <p className="text-sm">{prompt}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        <input
          ref={input}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => {
            void run([...(e.target.files ?? [])])
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="inline-flex h-9 items-center rounded-md bg-secondary px-3 text-sm font-medium hover:bg-secondary/70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
        >
          {multiple ? 'Choose files' : 'Choose file'}
        </button>
      </div>
      {jobs.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2" aria-live="polite">
          {jobs.map((j) => (
            <li key={j.key} className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="min-w-0 flex-1 truncate">{j.name}</span>
              <progress
                value={Math.round(j.progress * 100)}
                max={100}
                aria-label={`Uploading ${j.name}`}
                className="h-1 w-24 overflow-hidden rounded-full bg-secondary [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-secondary [&::-webkit-progress-value]:bg-primary"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
