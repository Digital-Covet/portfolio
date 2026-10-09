import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import File from '#models/file'
import StorageService from '#services/storage_service'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Authenticated file proxy. Objects in the private Supabase bucket are never linked
 * directly: this route checks the session, then redirects to a signed URL that
 * expires after 60 seconds, so a copied link is useless later.
 */
export default class FilesController {
  async show({ params, request, response }: HttpContext) {
    if (!UUID.test(params.id)) return response.notFound()

    const file = await File.find(params.id)
    if (!file) return response.notFound()

    try {
      let url = await new StorageService().signedUrl(file.bucket, file.storagePath, 60)
      if (request.input('download')) {
        url += `${url.includes('?') ? '&' : '?'}download=${encodeURIComponent(file.originalName)}`
      }
      response.header('Cache-Control', 'private, no-store')
      return response.redirect().toPath(url)
    } catch (error) {
      logger.error({ err: error, fileId: file.id }, 'file proxy failed to sign url')
      return response.status(502).send('File is temporarily unavailable')
    }
  }
}
