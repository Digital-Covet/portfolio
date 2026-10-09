import { publicThumbnail } from '#services/dashboard_service'

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const proxyUrl = (id: string) => `/files/${id}`

/** Public-bucket files link straight to storage; everything else goes through the auth proxy. */
export const fileUrl = (
  f: { id: string; bucket: string; storagePath: string; visibility: string } | null
) =>
  f
    ? (publicThumbnail({
        bucket: f.bucket,
        storage_path: f.storagePath,
        visibility: f.visibility,
      }) ?? proxyUrl(f.id))
    : null
