import vine from '@vinejs/vine'

/** Dimensions a live rule can filter on. Order is the order the builder offers them. */
export const RULE_FIELDS = [
  'sector',
  'industry',
  'keyBusiness',
  'workCategory',
  'service',
  'client',
] as const

export type RuleField = (typeof RULE_FIELDS)[number]

/**
 * Create / edit payload for a share. Mode-specific rules (at least one study, at
 * least one condition, a future date) live in the controller so errors can name the field.
 */
export const shareValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255),
  mode: vine.enum(['pick', 'rule']),
  caseStudyIds: vine.array(vine.string().uuid()).maxLength(200),
  rules: vine
    .array(
      vine.object({
        field: vine.enum(RULE_FIELDS),
        ids: vine.array(vine.string().uuid()).minLength(1).maxLength(100),
      })
    )
    .maxLength(RULE_FIELDS.length),
  /** `keep` leaves the stored hash alone; `remove` clears it; `set` hashes `password`. */
  passwordAction: vine.enum(['keep', 'set', 'remove']),
  password: vine.string().minLength(6).maxLength(128).nullable().optional(),
  /** Calendar day (UTC) on which the link stops working, inclusive. */
  expiresAt: vine
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  maxViews: vine.number().withoutDecimals().min(1).max(1_000_000).nullable().optional(),
})
