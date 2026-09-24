/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  drive: {
    fs: {
      serve: typeof routes['drive.fs.serve']
    }
  }
  auth: {
    register: typeof routes['auth.register']
    login: typeof routes['auth.login']
    logout: typeof routes['auth.logout']
    user: typeof routes['auth.user']
    updateProfile: typeof routes['auth.update_profile']
    updatePassword: typeof routes['auth.update_password']
  }
  users: {
    show: typeof routes['users.show']
    favorites: typeof routes['users.favorites']
  }
  reviews: {
    userIndex: typeof routes['reviews.user_index']
  }
  apps: {
    index: typeof routes['apps.index']
    store: typeof routes['apps.store']
    show: typeof routes['apps.show']
    update: typeof routes['apps.update']
    destroy: typeof routes['apps.destroy']
    merge: typeof routes['apps.merge']
    appstream: typeof routes['apps.appstream']
    appstreamFields: typeof routes['apps.appstream_fields']
    reviews: {
      index: typeof routes['apps.reviews.index']
      store: typeof routes['apps.reviews.store']
      destroy: typeof routes['apps.reviews.destroy']
    }
    pkgs: {
      index: typeof routes['apps.pkgs.index']
      store: typeof routes['apps.pkgs.store']
    }
  }
  favorites: {
    store: typeof routes['favorites.store']
    destroy: typeof routes['favorites.destroy']
  }
  images: {
    index: typeof routes['images.index']
    store: typeof routes['images.store']
    show: typeof routes['images.show']
    update: typeof routes['images.update']
    destroy: typeof routes['images.destroy']
  }
  pkgs: {
    index: typeof routes['pkgs.index']
    store: typeof routes['pkgs.store']
    show: typeof routes['pkgs.show']
    update: typeof routes['pkgs.update']
    destroy: typeof routes['pkgs.destroy']
  }
  repos: {
    index: typeof routes['repos.index']
    store: typeof routes['repos.store']
    show: typeof routes['repos.show']
    update: typeof routes['repos.update']
    destroy: typeof routes['repos.destroy']
  }
  distros: {
    index: typeof routes['distros.index']
    store: typeof routes['distros.store']
    show: typeof routes['distros.show']
    update: typeof routes['distros.update']
    destroy: typeof routes['distros.destroy']
  }
  categories: {
    index: typeof routes['categories.index']
  }
  search: {
    count: typeof routes['search.count']
  }
}
