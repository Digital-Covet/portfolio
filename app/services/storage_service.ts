import env from '#start/env'

/**
 * Thin client for Supabase Object Storage using the service key. Callers record the
 * resulting `bucket` + `path` in the `file` table.
 */
export default class StorageService {
  #base() {
    const url = env.get('SUPABASE_URL')
    const key = env.get('SUPABASE_SECRET_KEY')
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set to use object storage')
    }
    return { url: url.replace(/\/$/, ''), key }
  }

  /**
   * Uploads (or replaces) an object. Returns the bucket and path to store on `file`.
   */
  async upload(bucket: string, path: string, body: Blob, contentType: string) {
    const { url, key } = this.#base()
    const response = await fetch(`${url}/storage/v1/object/${bucket}/${encodePath(path)}`, {
      method: 'POST',
      headers: { 'apikey': key, 'content-type': contentType, 'x-upsert': 'true' },
      body,
    })
    if (!response.ok) {
      throw new Error(`Storage upload failed (${response.status}): ${await response.text()}`)
    }
    return { bucket, path }
  }

  /**
   * Public URL for an object in a public bucket.
   */
  publicUrl(bucket: string, path: string) {
    return `${this.#base().url}/storage/v1/object/public/${bucket}/${encodePath(path)}`
  }

  /**
   * Short-lived signed URL for an object in a private bucket.
   */
  async signedUrl(bucket: string, path: string, expiresInSeconds = 60) {
    const { url, key } = this.#base()
    const response = await fetch(`${url}/storage/v1/object/sign/${bucket}/${encodePath(path)}`, {
      method: 'POST',
      headers: { 'apikey': key, 'content-type': 'application/json' },
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
    })
    if (!response.ok) {
      throw new Error(`Storage sign failed (${response.status}): ${await response.text()}`)
    }
    const { signedURL } = (await response.json()) as { signedURL: string }
    return `${url}/storage/v1${signedURL}`
  }

  /**
   * Browser-loadable URL for a `file` row: the public URL for public buckets, a signed
   * URL otherwise. Returns null when storage isn't configured or signing fails, so a
   * missing image never breaks the page.
   */
  async urlFor(
    file: { bucket: string; storagePath: string; visibility: string },
    expiresInSeconds = 3600
  ): Promise<string | null> {
    try {
      return file.visibility === 'public'
        ? this.publicUrl(file.bucket, file.storagePath)
        : await this.signedUrl(file.bucket, file.storagePath, expiresInSeconds)
    } catch {
      return null
    }
  }
  /**
   * Removes an object. Best effort: failures are not thrown.
   */
  async remove(bucket: string, path: string) {
    const { url, key } = this.#base()
    await fetch(`${url}/storage/v1/object/${bucket}/${encodePath(path)}`, {
      method: 'DELETE',
      headers: { apikey: key },
    }).catch(() => {})
  }
}

function encodePath(path: string) {
  return path.split('/').map(encodeURIComponent).join('/')
}
