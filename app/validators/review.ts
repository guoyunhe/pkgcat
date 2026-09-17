import vine from '@vinejs/vine'

/**
 * Validator to use when creating or updating an app review.
 */
export const reviewValidator = vine.create({
  rating: vine.number().min(1).max(5),
  comment: vine.string().trim().maxLength(1000).optional(),
  // The distribution the application was experienced on, when the reviewer names one.
  distroId: vine.number().exists({ table: 'distros', column: 'id' }).nullable(),
})
