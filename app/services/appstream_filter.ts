/**
 * Roots of the AppStream IDs the catalog leaves out. Fedora ships an
 * `org.fedoraproject.LangPack-<locale>` component per language, which names a locale rather than an
 * application.
 */
const ignoredAppstreamIdPrefixes = ['org.fedoraproject.langpack']

/** Whether the catalog leaves the component of an AppStream ID out. */
export function isIgnoredAppstreamId(id: string) {
  const key = id.trim().toLowerCase()
  return ignoredAppstreamIdPrefixes.some((prefix) => key.startsWith(prefix))
}

/** Patterns of those IDs, for the rows an earlier import wrote. */
export function ignoredAppstreamIdPatterns() {
  return ignoredAppstreamIdPrefixes.map((prefix) => `${prefix}%`)
}
