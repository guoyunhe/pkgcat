import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.user': { paramsTuple?: []; params?: {} }
    'auth.update_profile': { paramsTuple?: []; params?: {} }
    'auth.update_password': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.favorites': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'reviews.user_index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.index': { paramsTuple?: []; params?: {} }
    'apps.store': { paramsTuple?: []; params?: {} }
    'apps.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.merge': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'favorites.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'favorites.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.reviews.index': { paramsTuple: [ParamValue]; params: {'app_id': ParamValue} }
    'apps.reviews.store': { paramsTuple: [ParamValue]; params: {'app_id': ParamValue} }
    'apps.reviews.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'app_id': ParamValue,'id': ParamValue} }
    'apps.pkgs.index': { paramsTuple: [ParamValue]; params: {'app_id': ParamValue} }
    'apps.pkgs.store': { paramsTuple: [ParamValue]; params: {'app_id': ParamValue} }
    'images.index': { paramsTuple?: []; params?: {} }
    'images.store': { paramsTuple?: []; params?: {} }
    'images.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'images.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'images.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'pkgs.index': { paramsTuple?: []; params?: {} }
    'pkgs.store': { paramsTuple?: []; params?: {} }
    'pkgs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'pkgs.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'pkgs.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'repos.index': { paramsTuple?: []; params?: {} }
    'repos.store': { paramsTuple?: []; params?: {} }
    'repos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'repos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'repos.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'distros.index': { paramsTuple?: []; params?: {} }
    'distros.store': { paramsTuple?: []; params?: {} }
    'distros.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'distros.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'distros.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.index': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'auth.user': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.favorites': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'reviews.user_index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.index': { paramsTuple?: []; params?: {} }
    'apps.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.reviews.index': { paramsTuple: [ParamValue]; params: {'app_id': ParamValue} }
    'apps.pkgs.index': { paramsTuple: [ParamValue]; params: {'app_id': ParamValue} }
    'images.index': { paramsTuple?: []; params?: {} }
    'images.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'pkgs.index': { paramsTuple?: []; params?: {} }
    'pkgs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'repos.index': { paramsTuple?: []; params?: {} }
    'repos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'distros.index': { paramsTuple?: []; params?: {} }
    'distros.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'auth.user': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.favorites': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'reviews.user_index': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.index': { paramsTuple?: []; params?: {} }
    'apps.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.reviews.index': { paramsTuple: [ParamValue]; params: {'app_id': ParamValue} }
    'apps.pkgs.index': { paramsTuple: [ParamValue]; params: {'app_id': ParamValue} }
    'images.index': { paramsTuple?: []; params?: {} }
    'images.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'pkgs.index': { paramsTuple?: []; params?: {} }
    'pkgs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'repos.index': { paramsTuple?: []; params?: {} }
    'repos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'distros.index': { paramsTuple?: []; params?: {} }
    'distros.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.index': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'apps.store': { paramsTuple?: []; params?: {} }
    'apps.merge': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'favorites.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.reviews.store': { paramsTuple: [ParamValue]; params: {'app_id': ParamValue} }
    'apps.pkgs.store': { paramsTuple: [ParamValue]; params: {'app_id': ParamValue} }
    'images.store': { paramsTuple?: []; params?: {} }
    'pkgs.store': { paramsTuple?: []; params?: {} }
    'repos.store': { paramsTuple?: []; params?: {} }
    'distros.store': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'auth.update_profile': { paramsTuple?: []; params?: {} }
    'auth.update_password': { paramsTuple?: []; params?: {} }
    'apps.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'images.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'pkgs.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'repos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'distros.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'apps.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'images.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'pkgs.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'repos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'distros.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'apps.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'favorites.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.reviews.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'app_id': ParamValue,'id': ParamValue} }
    'images.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'pkgs.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'repos.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'distros.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}