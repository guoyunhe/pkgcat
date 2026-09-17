import { BaseSeeder } from '@adonisjs/lucid/seeders'

import { ReviewFactory } from '#database/factories/review_factory'
import App from '#models/app'
import Distro from '#models/distro'
import Review from '#models/review'
import User from '#models/user'

const knownEmails = ['admin@example.com', 'user@example.com']

/** Share of the reviews that name a distribution other than the one of their author. */
const otherDistroShare = 0.25

function shuffled<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function randomInt(max: number) {
  return Math.floor(Math.random() * (max + 1))
}

function randomDistroId(distroIds: number[]) {
  return distroIds.length > 0 ? distroIds[randomInt(distroIds.length - 1)] : null
}

export default class ReviewSeeder extends BaseSeeder {
  /** The demo reviews must never be created on a real deployment. */
  static environment = ['development', 'test']

  async run() {
    const apps = await App.all()
    const randomUsers = await User.query().whereNotIn('email', knownEmails)
    const distros = await Distro.query().select('id')
    const distroIds = distros.map((distro) => distro.id)

    for (const user of randomUsers) {
      const reviewed = shuffled(apps).slice(0, randomInt(apps.length))

      for (const app of reviewed) {
        const review = await ReviewFactory.make()
        // An application is usually experienced on the distribution of the account, and now and
        // then on another one, which is what the marker is for
        const distroId =
          user.distroId !== null && Math.random() > otherDistroShare
            ? user.distroId
            : randomDistroId(distroIds)

        await Review.updateOrCreate(
          { userId: user.id, appId: app.id },
          { rating: review.rating, comment: review.comment, distroId },
        )
      }
    }
  }
}
