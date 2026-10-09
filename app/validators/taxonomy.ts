import vine from '@vinejs/vine'

/** Create / rename payload. `parentId` is only read for industries and key businesses. */
export const taxonomyValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(120),
  parentId: vine.string().uuid().optional(),
})
