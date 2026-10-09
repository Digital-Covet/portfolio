import vine from '@vinejs/vine'

/** Create / edit payload for the Clients library. */
export const clientValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255),
  logoFileId: vine.string().uuid().nullable().optional(),
  keyBusinessIds: vine.array(vine.string().uuid()).maxLength(100),
})

/** Name-only create used by the case-study editor's inline "Add client" (admin+). */
export const quickClientValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255),
})
