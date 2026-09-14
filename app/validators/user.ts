import vine from '@vinejs/vine'

/**
 * Shared rules for email and password.
 */
const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

/**
 * Validator to use when performing self-register
 */
export const registerValidator = vine.create({
  name: vine.string().trim().maxLength(32),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

/**
 * Validator of the account the user edits itself. The email is unique among the accounts, so the
 * check leaves the account being edited out of it, which the controllers pass as the `userId` meta
 * value.
 */
export const profileValidator = vine.create({
  name: vine.string().trim().maxLength(32),
  email: email().unique({
    table: 'users',
    column: 'email',
    filter: (db, _value, field) => {
      const userId = (field.meta as { userId?: number }).userId
      if (userId) db.whereNot('id', userId)
    },
  }),
})

/**
 * Validator of a password the account replaces itself. The current password is what the request
 * proves it knows, which the controller verifies before the new one is stored.
 */
export const passwordValidator = vine.create({
  currentPassword: vine.string(),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

/**
 * Validator to use before validating user credentials during login
 */
export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})
