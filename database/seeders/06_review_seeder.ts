import { BaseSeeder } from '@adonisjs/lucid/seeders'

import { ReviewFactory } from '#database/factories/review_factory'
import App from '#models/app'
import Review from '#models/review'
import User from '#models/user'

const knownEmails = ['admin@example.com', 'user@example.com']

function shuffled<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function randomInt(max: number) {
  return Math.floor(Math.random() * (max + 1))
}

export default class ReviewSeeder extends BaseSeeder {
  /** The demo reviews must never be created on a real deployment. */
  static environment = ['development', 'test']

  async run() {
    const apps = await App.all()
    const randomUsers = await User.query().whereNotIn('email', knownEmails)

    for (const user of randomUsers) {
      const reviewed = shuffled(apps).slice(0, randomInt(apps.length))

      for (const app of reviewed) {
        const review = await ReviewFactory.make()

        await Review.updateOrCreate(
          { userId: user.id, appId: app.id },
          { rating: review.rating, comment: review.comment },
        )
      }
    }
  }
}
