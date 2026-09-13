/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'

router
  .group(() => {
    // Health check
    router.get('/', () => ({ hello: 'world' }))

    // Auth
    router
      .group(() => {
        router.post('register', [controllers.Auth, 'register'])
        router.post('login', [controllers.Auth, 'login'])
        router.post('logout', [controllers.Auth, 'logout']).use(middleware.auth())
        router.get('user', [controllers.Auth, 'user']).use(middleware.auth())
      })
      .prefix('auth')

    // Users
    router.get('users/:id', [controllers.Users, 'show'])
    router.get('users/:id/favorites', [controllers.Users, 'favorites'])
    router.get('users/:id/reviews', [controllers.Reviews, 'userIndex'])

    // Apps
    router
      .resource('apps', controllers.Apps)
      .apiOnly()
      .use(['store', 'update', 'destroy'], [middleware.auth(), middleware.admin()])
    router
      .post('apps/:id/merge', [controllers.Apps, 'merge'])
      .use([middleware.auth(), middleware.admin()])
    router.post('apps/:id/favorite', [controllers.Favorites, 'store']).use(middleware.auth())
    router.delete('apps/:id/favorite', [controllers.Favorites, 'destroy']).use(middleware.auth())
    router
      .resource('apps.reviews', controllers.Reviews)
      .only(['index', 'store', 'destroy'])
      .use(['store', 'destroy'], middleware.auth())
    router
      .resource('apps.pkgs', controllers.Pkgs)
      .only(['index', 'store'])
      .use(['store'], [middleware.auth(), middleware.admin()])

    // Images
    router.resource('images', controllers.Images).apiOnly().use('*', middleware.auth())

    // Packages
    router
      .resource('pkgs', controllers.Pkgs)
      .apiOnly()
      .use(['store', 'update', 'destroy'], [middleware.auth(), middleware.admin()])

    // Repos
    router
      .resource('repos', controllers.Repos)
      .apiOnly()
      .use(['store', 'update', 'destroy'], [middleware.auth(), middleware.admin()])

    // Distros
    router
      .resource('distros', controllers.Distros)
      .apiOnly()
      .use(['store', 'update', 'destroy'], [middleware.auth(), middleware.admin()])

    // Categories
    router.get('categories', [controllers.Categories, 'index'])
  })
  .prefix('/api')

router.on('*').render('app')
