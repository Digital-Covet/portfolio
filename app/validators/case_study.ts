import vine from '@vinejs/vine'

const ids = () => vine.array(vine.string().uuid()).maxLength(100)

/**
 * Editor payload. Drafts only need a title and client; the publish-time checks
 * (hero, classification) live in the controller so errors can name the field.
 */
export const caseStudyValidator = vine.create({
  intent: vine.enum(['save', 'autosave', 'publish', 'restore']),
  title: vine.string().trim().minLength(1).maxLength(255),
  clientId: vine.string().uuid(),
  overview: vine.string().trim().maxLength(20000).optional(),
  challenge: vine.string().trim().maxLength(20000).optional(),
  solution: vine.string().trim().maxLength(20000).optional(),
  results: vine.string().trim().maxLength(20000).optional(),
  /** Sections the editor has no field for, kept verbatim so a save never drops them. */
  extra: vine.string().maxLength(40000).optional(),
  heroFileId: vine.string().uuid().nullable().optional(),
  galleryIds: vine.array(vine.string().uuid()).maxLength(30),
  attachmentIds: ids(),
  videoUrls: vine
    .array(
      vine
        .string()
        .trim()
        .url({ protocols: ['https'] })
        .maxLength(2048)
    )
    .maxLength(10),
  metrics: vine
    .array(
      vine.object({
        label: vine.string().trim().minLength(1).maxLength(255),
        value: vine.string().trim().minLength(1).maxLength(255),
      })
    )
    .maxLength(12),
  testimonials: vine
    .array(
      vine.object({
        quote: vine.string().trim().minLength(1).maxLength(2000),
        authorName: vine.string().trim().minLength(1).maxLength(255),
        authorTitle: vine.string().trim().maxLength(255).nullable().optional(),
      })
    )
    .maxLength(10),
  keyBusinessIds: ids(),
  workCategoryIds: ids(),
  serviceIds: ids(),
  businessModelIds: ids(),
})
