/** Converts a YouTube / Vimeo URL to its embed URL; anything else returns null. */
export function embedUrl(raw: string): string | null {
  try {
    const u = new URL(raw)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed${u.pathname}`
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname.startsWith('/embed/')) return `https://www.youtube-nocookie.com${u.pathname}`
      const v = u.searchParams.get('v')
      return v ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v)}` : null
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = u.pathname.split('/').filter(Boolean).pop()
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null
    }
  } catch {
    /* not a URL */
  }
  return null
}
