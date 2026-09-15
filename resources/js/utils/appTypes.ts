/**
 * Component types an application of the catalog can carry, as the AppStream specification names
 * them. The server validates the same list (`app/validators/app.ts`), and repositories announce the
 * type of everything they import, so an editor only ever corrects one. `desktop` is not one of
 * them: it is the name AppStream used before the type was split into `desktop-application`.
 */
export const appTypes = [
  'generic',
  'desktop-application',
  'console-application',
  'web-application',
  'addon',
  'font',
  'codec',
  'inputmethod',
  'firmware',
  'driver',
  'localization',
  'service',
  'repository',
  'operating-system',
  'icon-theme',
  'runtime',
]
