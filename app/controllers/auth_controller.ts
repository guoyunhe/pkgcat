import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'

import User from '#models/user'
import ProfileTransformer from '#transformers/profile_transformer'
import {
  loginValidator,
  passwordValidator,
  profileValidator,
  registerValidator,
} from '#validators/user'

export default class AuthController {
  async register({ request, serialize }: HttpContext) {
    const { name, email, password } = await request.validateUsing(registerValidator)

    const user = await User.create({ name, email, password })
    const token = await User.accessTokens.create(user)

    return serialize({
      user: ProfileTransformer.transform(user),
      token: token.value!.release(),
    })
  }

  async login({ request, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, password)
    const token = await User.accessTokens.create(user)

    return serialize({
      user: ProfileTransformer.transform(user),
      token: token.value!.release(),
    })
  }

  async logout({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.currentAccessToken) {
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    }

    return {
      message: 'Logged out successfully',
    }
  }

  /**
   * The account of the authenticated user, which is the one place its email is answered: the
   * catalog pages read a user through `users/:id`, which leaves the account details out.
   */
  async user({ auth, serialize }: HttpContext) {
    return serialize(ProfileTransformer.transform(auth.getUserOrFail()))
  }

  /**
   * Name and email of the authenticated account. The email is unique among the accounts, so the
   * validator is told which account is being edited.
   */
  async updateProfile({ request, auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(profileValidator, { meta: { userId: user.id } })

    await user.merge(payload).save()
    return serialize(ProfileTransformer.transform(user))
  }

  /**
   * Password of the authenticated account. The current one is what the request proves it knows, so
   * it is verified before the new one is stored. The sessions of the account are left alone: a new
   * password is no reason to sign the reader out of the devices they are already using.
   */
  async updatePassword({ request, auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const { currentPassword, password } = await request.validateUsing(passwordValidator)

    const valid = await hash.verify(user.password, currentPassword)
    if (!valid) {
      throw new Exception('The current password is incorrect', {
        status: 422,
        code: 'E_INVALID_CURRENT_PASSWORD',
      })
    }

    user.password = password
    await user.save()
    return serialize(ProfileTransformer.transform(user))
  }
}
