import vine from '@vinejs/vine'

/**
 * Taxonomy term payload. Names are trimmed and bounded; parent ids are
 * required for child levels (industry → sector, key business → industry).
 * Uniqueness and slug generation stay server-side in the controller.
 */
export const taxonomyCreateValidator = vine.create({
  name: vine.string().trim().minLength(2).maxLength(120),
  sectorId: vine.string().trim().maxLength(64).optional(),
  industryId: vine.string().trim().maxLength(64).optional(),
})

export const taxonomyRenameValidator = vine.create({
  name: vine.string().trim().minLength(2).maxLength(120),
})
