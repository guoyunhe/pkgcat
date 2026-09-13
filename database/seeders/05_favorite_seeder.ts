import { BaseSeeder } from '@adonisjs/lucid/seeders'

import App from '#models/app'
import User from '#models/user'

const favoritesByUser = [
  {
    email: 'user@example.com',
    apps: ['com.libretro.RetroArch', 'org.keepassxc.KeePassXC.desktop'],
  },
  {
    email: 'admin@example.com',
    apps: ['dev.eden_emu.eden'],
  },
]

const knownEmails = ['admin@example.com', 'user@example.com']

function shuffled<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function randomInt(max: number) {
  return Math.floor(Math.random() * (max + 1))
}

export default class FavoriteSeeder extends BaseSeeder {
  /** The demo favorites must never be created on a real deployment. */
  static environment = ['development', 'test']

  async run() {
    for (const { email, apps } of favoritesByUser) {
      const user = await User.findByOrFail('email', email)
      const favoriteApps = await App.query().whereIn('appstreamId', apps)

      const foundIds = new Set(favoriteApps.map((app) => app.appstreamId))
      const missing = apps.filter((appstreamId) => !foundIds.has(appstreamId))
      if (missing.length) {
        throw new Error(`Favorite seeder: apps not found for ${email}: ${missing.join(', ')}`)
      }

      await user.related('favoriteApps').sync(
        favoriteApps.map((app) => app.id),
        false,
      )
    }

    const apps = await App.all()
    const randomUsers = await User.query().whereNotIn('email', knownEmails)

    for (const user of randomUsers) {
      const favorites = shuffled(apps).slice(0, randomInt(apps.length))
      if (favorites.length === 0) continue

      await user.related('favoriteApps').sync(
        favorites.map((app) => app.id),
        false,
      )
    }
  }
}
