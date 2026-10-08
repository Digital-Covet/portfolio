import vine from '@vinejs/vine'

/**
 * Client record payload. Key-business links are derived from the client's
 * case studies (no direct pivot), so create/edit only manages the record
 * itself: name + logo.
 */
export const clientValidator = vine.create({
  name: vine.string().trim().minLength(2).maxLength(120),
  logoUrl: vine.string().trim().maxLength(2048).optional(),
})
