import { BaseSeeder } from '@adonisjs/lucid/seeders'

import { UserFactory } from '#database/factories/user_factory'
import User from '#models/user'

const users = [
  {
    name: 'Test Admin',
    email: 'admin@example.com',
    password: 'Admin123!',
    role: 'admin',
  },
  {
    name: 'Test User',
    email: 'user@example.com',
    password: 'User123!',
    role: 'user',
  },
]

const randomUserCount = 20

export default class UserSeeder extends BaseSeeder {
  /** The demo accounts must never be created on a real deployment. */
  static environment = ['development', 'test']

  async run() {
    for (const user of users) {
      await User.updateOrCreate({ email: user.email }, user)
    }

    for (let i = 0; i < randomUserCount; i++) {
      const email = `user${String(i + 1).padStart(3, '0')}@example.com`
      const user = await UserFactory.merge({ email }).make()

      await User.updateOrCreate(
        { email },
        { name: user.name, password: user.password, role: user.role },
      )
    }
  }
}
