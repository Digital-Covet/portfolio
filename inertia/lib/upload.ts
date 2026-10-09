export type Uploaded = { id: string; name: string; size: number; url: string }

function xsrfToken() {
  const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : ''
}

/** POSTs a file to /uploads with progress (fetch cannot report upload progress). */
export function uploadFile(
  file: File,
  kind: 'image' | 'attachment',
  onProgress: (fraction: number) => void
): Promise<Uploaded> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/uploads')
    xhr.setRequestHeader('Accept', 'application/json')
    xhr.setRequestHeader('X-XSRF-TOKEN', xsrfToken())
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total)
    xhr.onerror = () => reject(new Error('Network error. Try again.'))
    xhr.onload = () => {
      let body: (Partial<Uploaded> & { error?: string; messages?: { message: string }[] }) | null =
        null
      try {
        body = JSON.parse(xhr.responseText)
      } catch {
        /* non-JSON error page */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body?.id) resolve(body as Uploaded)
      else reject(new Error(body?.error ?? body?.messages?.[0]?.message ?? 'Upload failed.'))
    }
    const data = new FormData()
    data.append('kind', kind)
    data.append('file', file)
    xhr.send(data)
  })
}

/** POSTs JSON with the XSRF header and returns the parsed JSON body. */
export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': xsrfToken(),
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.errors?.[0]?.message ?? data?.error ?? 'Something went wrong.')
  }
  return data as T
}
