import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import vine from '@vinejs/vine'
import env from '#start/env'
import File from '#models/file'
import StorageService from '#services/storage_service'

const KINDS = {
  image: { extnames: ['jpg', 'jpeg', 'png', 'webp', 'avif'], size: '10mb' },
  attachment: {
    extnames: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip'],
    size: '20mb',
  },
} as const

const kindValidator = vine.create({ kind: vine.enum(['image', 'attachment']) })

/**
 * Editor uploads. Everything lands in the private bucket and is read back through
 * the authenticated `/files/:id` proxy. Returns JSON so the client can show progress.
 */
export default class UploadsController {
  async store({ request, response, auth }: HttpContext) {
    const { kind } = await request.validateUsing(kindValidator)
    const rules = KINDS[kind]

    const upload = request.file('file', { size: rules.size, extnames: [...rules.extnames] })
    if (!upload) return response.unprocessableEntity({ error: 'No file received.' })
    if (!upload.isValid) {
      return response.unprocessableEntity({ error: upload.errors[0]?.message ?? 'Invalid file.' })
    }

    const bucket = env.get('STORAGE_BUCKET_PRIVATE')
    if (!bucket || !upload.tmpPath) {
      return response.internalServerError({ error: 'File storage is not configured.' })
    }

    // Never trust the client file name for the object path.
    const storagePath = `case-studies/${randomUUID()}.${upload.extname}`
    const mime = `${upload.type ?? 'application'}/${upload.subtype ?? 'octet-stream'}`

    try {
      const body = new Blob([await readFile(upload.tmpPath)], { type: mime })
      await new StorageService().upload(bucket, storagePath, body, mime)
    } catch (error) {
      logger.error({ err: error }, 'case study upload failed')
      return response.badGateway({ error: 'Upload failed. Try again.' })
    }

    const file = await File.create({
      bucket,
      storagePath,
      originalName: upload.clientName.slice(0, 255),
      mimeType: mime,
      sizeBytes: upload.size,
      visibility: 'authenticated',
      uploadedBy: auth.user!.id,
    })

    return {
      id: file.id,
      name: file.originalName,
      size: Number(file.sizeBytes),
      url: `/files/${file.id}`,
    }
  }
}
