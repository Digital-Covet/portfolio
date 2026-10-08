import vine from '@vinejs/vine'

/**
 * Share builder payload. Follows the design-system share-builder spec:
 * content is either an explicit selection or a filter rule, plus optional
 * recipient + protection settings. Passwords are write-only (never returned).
 */
export const shareValidator = vine.create({
  mode: vine.enum(['selected', 'rule'] as const),
  caseStudyIds: vine.array(vine.string().trim().maxLength(64)).optional(),
  rule: vine
    .object({
      sectors: vine.array(vine.string().trim().maxLength(120)).optional(),
      industries: vine.array(vine.string().trim().maxLength(120)).optional(),
      keyBusinesses: vine.array(vine.string().trim().maxLength(120)).optional(),
      categories: vine.array(vine.string().trim().maxLength(120)).optional(),
      services: vine.array(vine.string().trim().maxLength(120)).optional(),
      clients: vine.array(vine.string().trim().maxLength(64)).optional(),
    })
    .optional(),
  recipientName: vine.string().trim().maxLength(180).optional(),
  company: vine.string().trim().maxLength(180).optional(),
  email: vine.string().trim().email().maxLength(320).optional(),
  requirePassword: vine.boolean().optional(),
  password: vine.string().minLength(10).maxLength(256).optional(),
  expiresAt: vine.string().trim().maxLength(32).optional(),
  maxViews: vine.number().min(1).max(100_000).optional(),
})

export const shareUnlockValidator = vine.create({
  password: vine.string().minLength(1).maxLength(256),
})
