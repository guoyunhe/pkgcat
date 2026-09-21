/**
 * Component types an application of the catalog can carry, as the AppStream specification names
 * them. The server validates the same list (`app/validators/app.ts`), and repositories announce the
 * type of everything they import, so an editor only ever corrects one. `desktop` is not one of
 * them: it is the name AppStream used before the type was split into `desktop-application`.
 *
 * A type is stored, sent and filtered by as its identifier, which reads the same in every language;
 * the interface shows a type under its translated name (see `appTypeKey`).
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

/**
 * Translation key under which the interface names an AppStream type. Every type of the list above
 * is translated (`apps.types.<identifier>` in `public/locales`), and a caller passes the identifier
 * as the default value of the translation, so that a type the interface does not translate yet — or
 * one an older import wrote — is still named by itself rather than left empty.
 */
export function appTypeKey(type: string) {
  return `apps.types.${type}`
}
