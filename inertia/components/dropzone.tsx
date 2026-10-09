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
  /** How many more files this zone may accept; extra files are skipped with a toast. */
  remaining?: number
  onUploaded: (file: Uploaded) => void
  /** Fires while any upload is running, so the page can hold back saves. */
  onBusyChange?: (busy: boolean) => void
}

const CONCURRENCY = 3

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
  remaining,
  onUploaded,
  onBusyChange,
}: Props) {
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const active = useRef(0)
  const [over, setOver] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])

  const uploadOne = async (file: File) => {
    const key = `${file.name}-${crypto.randomUUID()}`
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
    }
  }

  const run = async (dropped: File[]) => {
    let files = multiple ? dropped : dropped.slice(0, 1)
    if (remaining !== undefined && files.length > remaining) {
      toast.error(
        remaining > 0
          ? `Only ${remaining} more file${remaining === 1 ? '' : 's'} allowed; extra files skipped.`
          : 'File limit reached.'
      )
      files = files.slice(0, Math.max(remaining, 0))
    }
    if (files.length === 0) return

    // Hold saves until every file in this batch has settled.
    active.current++
    onBusyChange?.(true)
    const queue = [...files]
    const worker = async () => {
      for (let file = queue.shift(); file; file = queue.shift()) await uploadOne(file)
    }
    try {
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker))
    } finally {
      if (--active.current === 0) onBusyChange?.(false)
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
