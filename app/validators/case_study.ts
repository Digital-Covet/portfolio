import vine from '@vinejs/vine'

/**
 * Case-study editor payload. Drafts allow partial content; publishing
 * requires the five items listed in the design-system editor spec
 * (title, summary, hero image, client, sector).
 */
export const caseStudyDraftValidator = vine.create({
  title: vine.string().trim().maxLength(180).optional(),
  summary: vine.string().trim().maxLength(240).optional(),
  heroImageKey: vine.string().trim().maxLength(512).optional(),
  clientId: vine.string().trim().maxLength(64).optional(),
  sector: vine.string().trim().maxLength(120).optional(),
  industry: vine.string().trim().maxLength(120).optional(),
  keyBusiness: vine.string().trim().maxLength(120).optional(),
  categories: vine.array(vine.string().trim().maxLength(120)).optional(),
  services: vine.array(vine.string().trim().maxLength(120)).optional(),
  businessModels: vine.array(vine.string().trim().maxLength(120)).optional(),
  storyMarkdown: vine.string().optional(),
  galleryKeys: vine.array(vine.string().trim().maxLength(512)).optional(),
  videos: vine
    .array(
      vine.object({
        url: vine.string().trim().url().maxLength(2048),
        provider: vine.enum(['youtube', 'vimeo', 'other'] as const).optional(),
      })
    )
    .optional(),
  metrics: vine
    .array(
      vine.object({
        label: vine.string().trim().maxLength(120),
        value: vine.string().trim().maxLength(64),
        suffix: vine.enum(['%', 'x', '+', ''] as const).optional(),
      })
    )
    .optional(),
  testimonialQuote: vine.string().trim().maxLength(2000).optional(),
  testimonialName: vine.string().trim().maxLength(180).optional(),
  testimonialRole: vine.string().trim().maxLength(240).optional(),
  attachmentKeys: vine.array(vine.string().trim().maxLength(512)).optional(),
})

export const caseStudyPublishValidator = vine.create({
  title: vine.string().trim().minLength(1).maxLength(180),
  summary: vine.string().trim().minLength(1).maxLength(240),
  heroImageKey: vine.string().trim().minLength(1).maxLength(512),
  clientId: vine.string().trim().minLength(1).maxLength(64),
  sector: vine.string().trim().minLength(1).maxLength(120),
})
