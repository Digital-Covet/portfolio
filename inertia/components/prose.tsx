import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** Splits "## Heading" sections; text before the first heading is the overview. */
export function parseContent(md: string) {
  const parts = md.split(/^##\s+/m)
  const overview = parts.shift()?.trim() ?? ''
  const sections = parts
    .map((p) => {
      const nl = p.indexOf('\n')
      return nl === -1
        ? { heading: p.trim(), body: '' }
        : { heading: p.slice(0, nl).trim(), body: p.slice(nl + 1).trim() }
    })
    .filter((s) => s.heading)
  return { overview, sections }
}

/**
 * Renders stored markdown. react-markdown ignores raw HTML and sanitises link
 * protocols by default; images are dropped so content can't load third-party pixels.
 */
export function Prose({ text }: { text: string }) {
  if (!text) return null
  return (
    <div className="flex max-w-[var(--prose)] flex-col gap-3 text-sm/6 text-foreground">
      <Markdown
        remarkPlugins={[remarkGfm]}
        disallowedElements={['img']}
        unwrapDisallowed
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-border-strong px-3 py-2 font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border px-3 py-2 align-top">{children}</td>
          ),
          h1: ({ children }) => (
            <h3 className="font-display text-base/6 font-semibold">{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="font-display text-base/6 font-semibold">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="font-display text-sm/6 font-semibold">{children}</h4>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-5 marker:text-muted-foreground">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-5 marker:text-muted-foreground">{children}</ol>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary underline-offset-2 hover:underline"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-border-strong pl-4 text-muted-foreground">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded-sm bg-secondary px-1 font-mono text-[13px]">{children}</code>
          ),
        }}
      >
        {text}
      </Markdown>
    </div>
  )
}
