/**
 * Where the API of the build service answers, which every read of an import goes through.
 */
export const obsApiRoot = 'https://api.opensuse.org'

/**
 * Where the build service publishes the repositories, which the catalog syncs packages from.
 */
export const obsDownloadRoot = 'https://download.opensuse.org/repositories/'

/**
 * Published repositories one lookup of a repository name reads at once, which the API refuses to go
 * beyond.
 */
export const obsPublishedLimit = 10000

/**
 * Projects an import leaves out. An entry without a colon names a namespace, whose projects build
 * the releases of the distributions themselves; an entry with one is the prefix of a project that
 * builds something other than a release, such as the openQA projects of `devel:`.
 */
export const ignoredObsProjects = [
  'openSUSE',
  'Debian',
  'Arch',
  'devel:openQA',
  'devel:Factory',
  'editors:tree-sitter:PullRequest',
  'systemsmanagement:saltstack',
  'systemsmanagement:Uyuni',
] as const
