/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'drive.fs.serve': {
    methods: ["GET","HEAD"],
    pattern: '/uploads/*',
    tokens: [{"old":"/uploads/*","type":0,"val":"uploads","end":""},{"old":"/uploads/*","type":2,"val":"*","end":""}],
    types: placeholder as Registry['drive.fs.serve']['types'],
  },
  'auth.register': {
    methods: ["POST"],
    pattern: '/api/auth/register',
    tokens: [{"old":"/api/auth/register","type":0,"val":"api","end":""},{"old":"/api/auth/register","type":0,"val":"auth","end":""},{"old":"/api/auth/register","type":0,"val":"register","end":""}],
    types: placeholder as Registry['auth.register']['types'],
  },
  'auth.login': {
    methods: ["POST"],
    pattern: '/api/auth/login',
    tokens: [{"old":"/api/auth/login","type":0,"val":"api","end":""},{"old":"/api/auth/login","type":0,"val":"auth","end":""},{"old":"/api/auth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.login']['types'],
  },
  'auth.logout': {
    methods: ["POST"],
    pattern: '/api/auth/logout',
    tokens: [{"old":"/api/auth/logout","type":0,"val":"api","end":""},{"old":"/api/auth/logout","type":0,"val":"auth","end":""},{"old":"/api/auth/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['auth.logout']['types'],
  },
  'auth.user': {
    methods: ["GET","HEAD"],
    pattern: '/api/auth/user',
    tokens: [{"old":"/api/auth/user","type":0,"val":"api","end":""},{"old":"/api/auth/user","type":0,"val":"auth","end":""},{"old":"/api/auth/user","type":0,"val":"user","end":""}],
    types: placeholder as Registry['auth.user']['types'],
  },
  'users.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/users/:id',
    tokens: [{"old":"/api/users/:id","type":0,"val":"api","end":""},{"old":"/api/users/:id","type":0,"val":"users","end":""},{"old":"/api/users/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['users.show']['types'],
  },
  'users.favorites': {
    methods: ["GET","HEAD"],
    pattern: '/api/users/:id/favorites',
    tokens: [{"old":"/api/users/:id/favorites","type":0,"val":"api","end":""},{"old":"/api/users/:id/favorites","type":0,"val":"users","end":""},{"old":"/api/users/:id/favorites","type":1,"val":"id","end":""},{"old":"/api/users/:id/favorites","type":0,"val":"favorites","end":""}],
    types: placeholder as Registry['users.favorites']['types'],
  },
  'reviews.user_index': {
    methods: ["GET","HEAD"],
    pattern: '/api/users/:id/reviews',
    tokens: [{"old":"/api/users/:id/reviews","type":0,"val":"api","end":""},{"old":"/api/users/:id/reviews","type":0,"val":"users","end":""},{"old":"/api/users/:id/reviews","type":1,"val":"id","end":""},{"old":"/api/users/:id/reviews","type":0,"val":"reviews","end":""}],
    types: placeholder as Registry['reviews.user_index']['types'],
  },
  'apps.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/apps',
    tokens: [{"old":"/api/apps","type":0,"val":"api","end":""},{"old":"/api/apps","type":0,"val":"apps","end":""}],
    types: placeholder as Registry['apps.index']['types'],
  },
  'apps.store': {
    methods: ["POST"],
    pattern: '/api/apps',
    tokens: [{"old":"/api/apps","type":0,"val":"api","end":""},{"old":"/api/apps","type":0,"val":"apps","end":""}],
    types: placeholder as Registry['apps.store']['types'],
  },
  'apps.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/apps/:id',
    tokens: [{"old":"/api/apps/:id","type":0,"val":"api","end":""},{"old":"/api/apps/:id","type":0,"val":"apps","end":""},{"old":"/api/apps/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['apps.show']['types'],
  },
  'apps.update': {
    methods: ["PUT","PATCH"],
    pattern: '/api/apps/:id',
    tokens: [{"old":"/api/apps/:id","type":0,"val":"api","end":""},{"old":"/api/apps/:id","type":0,"val":"apps","end":""},{"old":"/api/apps/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['apps.update']['types'],
  },
  'apps.destroy': {
    methods: ["DELETE"],
    pattern: '/api/apps/:id',
    tokens: [{"old":"/api/apps/:id","type":0,"val":"api","end":""},{"old":"/api/apps/:id","type":0,"val":"apps","end":""},{"old":"/api/apps/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['apps.destroy']['types'],
  },
  'apps.merge': {
    methods: ["POST"],
    pattern: '/api/apps/:id/merge',
    tokens: [{"old":"/api/apps/:id/merge","type":0,"val":"api","end":""},{"old":"/api/apps/:id/merge","type":0,"val":"apps","end":""},{"old":"/api/apps/:id/merge","type":1,"val":"id","end":""},{"old":"/api/apps/:id/merge","type":0,"val":"merge","end":""}],
    types: placeholder as Registry['apps.merge']['types'],
  },
  'favorites.store': {
    methods: ["POST"],
    pattern: '/api/apps/:id/favorite',
    tokens: [{"old":"/api/apps/:id/favorite","type":0,"val":"api","end":""},{"old":"/api/apps/:id/favorite","type":0,"val":"apps","end":""},{"old":"/api/apps/:id/favorite","type":1,"val":"id","end":""},{"old":"/api/apps/:id/favorite","type":0,"val":"favorite","end":""}],
    types: placeholder as Registry['favorites.store']['types'],
  },
  'favorites.destroy': {
    methods: ["DELETE"],
    pattern: '/api/apps/:id/favorite',
    tokens: [{"old":"/api/apps/:id/favorite","type":0,"val":"api","end":""},{"old":"/api/apps/:id/favorite","type":0,"val":"apps","end":""},{"old":"/api/apps/:id/favorite","type":1,"val":"id","end":""},{"old":"/api/apps/:id/favorite","type":0,"val":"favorite","end":""}],
    types: placeholder as Registry['favorites.destroy']['types'],
  },
  'apps.reviews.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/apps/:app_id/reviews',
    tokens: [{"old":"/api/apps/:app_id/reviews","type":0,"val":"api","end":""},{"old":"/api/apps/:app_id/reviews","type":0,"val":"apps","end":""},{"old":"/api/apps/:app_id/reviews","type":1,"val":"app_id","end":""},{"old":"/api/apps/:app_id/reviews","type":0,"val":"reviews","end":""}],
    types: placeholder as Registry['apps.reviews.index']['types'],
  },
  'apps.reviews.store': {
    methods: ["POST"],
    pattern: '/api/apps/:app_id/reviews',
    tokens: [{"old":"/api/apps/:app_id/reviews","type":0,"val":"api","end":""},{"old":"/api/apps/:app_id/reviews","type":0,"val":"apps","end":""},{"old":"/api/apps/:app_id/reviews","type":1,"val":"app_id","end":""},{"old":"/api/apps/:app_id/reviews","type":0,"val":"reviews","end":""}],
    types: placeholder as Registry['apps.reviews.store']['types'],
  },
  'apps.reviews.destroy': {
    methods: ["DELETE"],
    pattern: '/api/apps/:app_id/reviews/:id',
    tokens: [{"old":"/api/apps/:app_id/reviews/:id","type":0,"val":"api","end":""},{"old":"/api/apps/:app_id/reviews/:id","type":0,"val":"apps","end":""},{"old":"/api/apps/:app_id/reviews/:id","type":1,"val":"app_id","end":""},{"old":"/api/apps/:app_id/reviews/:id","type":0,"val":"reviews","end":""},{"old":"/api/apps/:app_id/reviews/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['apps.reviews.destroy']['types'],
  },
  'apps.pkgs.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/apps/:app_id/pkgs',
    tokens: [{"old":"/api/apps/:app_id/pkgs","type":0,"val":"api","end":""},{"old":"/api/apps/:app_id/pkgs","type":0,"val":"apps","end":""},{"old":"/api/apps/:app_id/pkgs","type":1,"val":"app_id","end":""},{"old":"/api/apps/:app_id/pkgs","type":0,"val":"pkgs","end":""}],
    types: placeholder as Registry['apps.pkgs.index']['types'],
  },
  'apps.pkgs.store': {
    methods: ["POST"],
    pattern: '/api/apps/:app_id/pkgs',
    tokens: [{"old":"/api/apps/:app_id/pkgs","type":0,"val":"api","end":""},{"old":"/api/apps/:app_id/pkgs","type":0,"val":"apps","end":""},{"old":"/api/apps/:app_id/pkgs","type":1,"val":"app_id","end":""},{"old":"/api/apps/:app_id/pkgs","type":0,"val":"pkgs","end":""}],
    types: placeholder as Registry['apps.pkgs.store']['types'],
  },
  'images.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/images',
    tokens: [{"old":"/api/images","type":0,"val":"api","end":""},{"old":"/api/images","type":0,"val":"images","end":""}],
    types: placeholder as Registry['images.index']['types'],
  },
  'images.store': {
    methods: ["POST"],
    pattern: '/api/images',
    tokens: [{"old":"/api/images","type":0,"val":"api","end":""},{"old":"/api/images","type":0,"val":"images","end":""}],
    types: placeholder as Registry['images.store']['types'],
  },
  'images.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/images/:id',
    tokens: [{"old":"/api/images/:id","type":0,"val":"api","end":""},{"old":"/api/images/:id","type":0,"val":"images","end":""},{"old":"/api/images/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['images.show']['types'],
  },
  'images.update': {
    methods: ["PUT","PATCH"],
    pattern: '/api/images/:id',
    tokens: [{"old":"/api/images/:id","type":0,"val":"api","end":""},{"old":"/api/images/:id","type":0,"val":"images","end":""},{"old":"/api/images/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['images.update']['types'],
  },
  'images.destroy': {
    methods: ["DELETE"],
    pattern: '/api/images/:id',
    tokens: [{"old":"/api/images/:id","type":0,"val":"api","end":""},{"old":"/api/images/:id","type":0,"val":"images","end":""},{"old":"/api/images/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['images.destroy']['types'],
  },
  'pkgs.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/pkgs',
    tokens: [{"old":"/api/pkgs","type":0,"val":"api","end":""},{"old":"/api/pkgs","type":0,"val":"pkgs","end":""}],
    types: placeholder as Registry['pkgs.index']['types'],
  },
  'pkgs.store': {
    methods: ["POST"],
    pattern: '/api/pkgs',
    tokens: [{"old":"/api/pkgs","type":0,"val":"api","end":""},{"old":"/api/pkgs","type":0,"val":"pkgs","end":""}],
    types: placeholder as Registry['pkgs.store']['types'],
  },
  'pkgs.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/pkgs/:id',
    tokens: [{"old":"/api/pkgs/:id","type":0,"val":"api","end":""},{"old":"/api/pkgs/:id","type":0,"val":"pkgs","end":""},{"old":"/api/pkgs/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['pkgs.show']['types'],
  },
  'pkgs.update': {
    methods: ["PUT","PATCH"],
    pattern: '/api/pkgs/:id',
    tokens: [{"old":"/api/pkgs/:id","type":0,"val":"api","end":""},{"old":"/api/pkgs/:id","type":0,"val":"pkgs","end":""},{"old":"/api/pkgs/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['pkgs.update']['types'],
  },
  'pkgs.destroy': {
    methods: ["DELETE"],
    pattern: '/api/pkgs/:id',
    tokens: [{"old":"/api/pkgs/:id","type":0,"val":"api","end":""},{"old":"/api/pkgs/:id","type":0,"val":"pkgs","end":""},{"old":"/api/pkgs/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['pkgs.destroy']['types'],
  },
  'repos.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/repos',
    tokens: [{"old":"/api/repos","type":0,"val":"api","end":""},{"old":"/api/repos","type":0,"val":"repos","end":""}],
    types: placeholder as Registry['repos.index']['types'],
  },
  'repos.store': {
    methods: ["POST"],
    pattern: '/api/repos',
    tokens: [{"old":"/api/repos","type":0,"val":"api","end":""},{"old":"/api/repos","type":0,"val":"repos","end":""}],
    types: placeholder as Registry['repos.store']['types'],
  },
  'repos.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/repos/:id',
    tokens: [{"old":"/api/repos/:id","type":0,"val":"api","end":""},{"old":"/api/repos/:id","type":0,"val":"repos","end":""},{"old":"/api/repos/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['repos.show']['types'],
  },
  'repos.update': {
    methods: ["PUT","PATCH"],
    pattern: '/api/repos/:id',
    tokens: [{"old":"/api/repos/:id","type":0,"val":"api","end":""},{"old":"/api/repos/:id","type":0,"val":"repos","end":""},{"old":"/api/repos/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['repos.update']['types'],
  },
  'repos.destroy': {
    methods: ["DELETE"],
    pattern: '/api/repos/:id',
    tokens: [{"old":"/api/repos/:id","type":0,"val":"api","end":""},{"old":"/api/repos/:id","type":0,"val":"repos","end":""},{"old":"/api/repos/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['repos.destroy']['types'],
  },
  'distros.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/distros',
    tokens: [{"old":"/api/distros","type":0,"val":"api","end":""},{"old":"/api/distros","type":0,"val":"distros","end":""}],
    types: placeholder as Registry['distros.index']['types'],
  },
  'distros.store': {
    methods: ["POST"],
    pattern: '/api/distros',
    tokens: [{"old":"/api/distros","type":0,"val":"api","end":""},{"old":"/api/distros","type":0,"val":"distros","end":""}],
    types: placeholder as Registry['distros.store']['types'],
  },
  'distros.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/distros/:id',
    tokens: [{"old":"/api/distros/:id","type":0,"val":"api","end":""},{"old":"/api/distros/:id","type":0,"val":"distros","end":""},{"old":"/api/distros/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['distros.show']['types'],
  },
  'distros.update': {
    methods: ["PUT","PATCH"],
    pattern: '/api/distros/:id',
    tokens: [{"old":"/api/distros/:id","type":0,"val":"api","end":""},{"old":"/api/distros/:id","type":0,"val":"distros","end":""},{"old":"/api/distros/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['distros.update']['types'],
  },
  'distros.destroy': {
    methods: ["DELETE"],
    pattern: '/api/distros/:id',
    tokens: [{"old":"/api/distros/:id","type":0,"val":"api","end":""},{"old":"/api/distros/:id","type":0,"val":"distros","end":""},{"old":"/api/distros/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['distros.destroy']['types'],
  },
  'categories.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/categories',
    tokens: [{"old":"/api/categories","type":0,"val":"api","end":""},{"old":"/api/categories","type":0,"val":"categories","end":""}],
    types: placeholder as Registry['categories.index']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
