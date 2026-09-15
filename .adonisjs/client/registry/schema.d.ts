/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'drive.fs.serve': {
    methods: ["GET","HEAD"]
    pattern: '/uploads/*'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { '*': ParamValue[] }
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'auth.register': {
    methods: ["POST"]
    pattern: '/api/auth/register'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').registerValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').registerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['register']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['register']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.login': {
    methods: ["POST"]
    pattern: '/api/auth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['login']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['login']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.logout': {
    methods: ["POST"]
    pattern: '/api/auth/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['logout']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['logout']>>>
    }
  }
  'auth.user': {
    methods: ["GET","HEAD"]
    pattern: '/api/auth/user'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['user']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['user']>>>
    }
  }
  'auth.update_profile': {
    methods: ["PATCH"]
    pattern: '/api/auth/user'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').profileValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').profileValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['updateProfile']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['updateProfile']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.update_password': {
    methods: ["PATCH"]
    pattern: '/api/auth/password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').passwordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').passwordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['updatePassword']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['updatePassword']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'users.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/users/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users_controller').default['show']>>>
    }
  }
  'users.favorites': {
    methods: ["GET","HEAD"]
    pattern: '/api/users/:id/favorites'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/users_controller').default['favorites']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/users_controller').default['favorites']>>>
    }
  }
  'reviews.user_index': {
    methods: ["GET","HEAD"]
    pattern: '/api/users/:id/reviews'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/reviews_controller').default['userIndex']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/reviews_controller').default['userIndex']>>>
    }
  }
  'apps.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/apps'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/app').appListValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/apps_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/apps_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'apps.store': {
    methods: ["POST"]
    pattern: '/api/apps'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/app').appValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/app').appValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/apps_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/apps_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'apps.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/apps/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/app').appLocaleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/apps_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/apps_controller').default['show']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'apps.update': {
    methods: ["PUT","PATCH"]
    pattern: '/api/apps/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/app').appValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/app').appValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/apps_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/apps_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'apps.destroy': {
    methods: ["DELETE"]
    pattern: '/api/apps/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/apps_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/apps_controller').default['destroy']>>>
    }
  }
  'apps.merge': {
    methods: ["POST"]
    pattern: '/api/apps/:id/merge'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/app').mergeAppValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/app').mergeAppValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/apps_controller').default['merge']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/apps_controller').default['merge']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'favorites.store': {
    methods: ["POST"]
    pattern: '/api/apps/:id/favorite'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/favorites_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/favorites_controller').default['store']>>>
    }
  }
  'favorites.destroy': {
    methods: ["DELETE"]
    pattern: '/api/apps/:id/favorite'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/favorites_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/favorites_controller').default['destroy']>>>
    }
  }
  'apps.reviews.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/apps/:app_id/reviews'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { app_id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/reviews_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/reviews_controller').default['index']>>>
    }
  }
  'apps.reviews.store': {
    methods: ["POST"]
    pattern: '/api/apps/:app_id/reviews'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/review').reviewValidator)>>
      paramsTuple: [ParamValue]
      params: { app_id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/review').reviewValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/reviews_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/reviews_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'apps.reviews.destroy': {
    methods: ["DELETE"]
    pattern: '/api/apps/:app_id/reviews/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { app_id: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/reviews_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/reviews_controller').default['destroy']>>>
    }
  }
  'apps.pkgs.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/apps/:app_id/pkgs'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { app_id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/pkg').pkgListValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pkgs_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pkgs_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'apps.pkgs.store': {
    methods: ["POST"]
    pattern: '/api/apps/:app_id/pkgs'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/pkg').pkgValidator)>|InferInput<(typeof import('#validators/pkg').pkgLocaleValidator)>>
      paramsTuple: [ParamValue]
      params: { app_id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/pkg').pkgValidator)>|InferInput<(typeof import('#validators/pkg').pkgLocaleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pkgs_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pkgs_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'images.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/images'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/images_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/images_controller').default['index']>>>
    }
  }
  'images.store': {
    methods: ["POST"]
    pattern: '/api/images'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/images_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/images_controller').default['store']>>>
    }
  }
  'images.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/images/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/images_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/images_controller').default['show']>>>
    }
  }
  'images.update': {
    methods: ["PUT","PATCH"]
    pattern: '/api/images/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/images_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/images_controller').default['update']>>>
    }
  }
  'images.destroy': {
    methods: ["DELETE"]
    pattern: '/api/images/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/images_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/images_controller').default['destroy']>>>
    }
  }
  'pkgs.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/pkgs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/pkg').pkgListValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pkgs_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pkgs_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'pkgs.store': {
    methods: ["POST"]
    pattern: '/api/pkgs'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/pkg').pkgValidator)>|InferInput<(typeof import('#validators/pkg').pkgLocaleValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/pkg').pkgValidator)>|InferInput<(typeof import('#validators/pkg').pkgLocaleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pkgs_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pkgs_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'pkgs.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/pkgs/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/pkg').pkgLocaleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pkgs_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pkgs_controller').default['show']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'pkgs.update': {
    methods: ["PUT","PATCH"]
    pattern: '/api/pkgs/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/pkg').pkgValidator)>|InferInput<(typeof import('#validators/pkg').pkgLocaleValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/pkg').pkgValidator)>|InferInput<(typeof import('#validators/pkg').pkgLocaleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pkgs_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pkgs_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'pkgs.destroy': {
    methods: ["DELETE"]
    pattern: '/api/pkgs/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/pkgs_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/pkgs_controller').default['destroy']>>>
    }
  }
  'repos.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/repos'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/repo').repoListValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/repos_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/repos_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'repos.store': {
    methods: ["POST"]
    pattern: '/api/repos'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/repo').repoValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/repo').repoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/repos_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/repos_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'repos.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/repos/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/repos_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/repos_controller').default['show']>>>
    }
  }
  'repos.update': {
    methods: ["PUT","PATCH"]
    pattern: '/api/repos/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/repo').repoValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/repo').repoValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/repos_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/repos_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'repos.destroy': {
    methods: ["DELETE"]
    pattern: '/api/repos/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/repos_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/repos_controller').default['destroy']>>>
    }
  }
  'distros.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/distros'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#validators/distro').distroListValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/distros_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/distros_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'distros.store': {
    methods: ["POST"]
    pattern: '/api/distros'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/distro').distroValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/distro').distroValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/distros_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/distros_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'distros.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/distros/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/distros_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/distros_controller').default['show']>>>
    }
  }
  'distros.update': {
    methods: ["PUT","PATCH"]
    pattern: '/api/distros/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/distro').distroValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/distro').distroValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/distros_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/distros_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'distros.destroy': {
    methods: ["DELETE"]
    pattern: '/api/distros/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/distros_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/distros_controller').default['destroy']>>>
    }
  }
  'categories.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/categories'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/categories_controller').default['index']>>>
    }
  }
}
