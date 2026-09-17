import { splitDebVersion } from '#utils/deb'

/**
 * Helpers shared by the pacman repository parser (`repo_package_extractor`) and the AppStream
 * extractor (`repo_appstream_extractor`), which read the databases of a pacman repository.
 */

/** Suffix of the entry that names the files of one package of a pacman file list. */
export const pacmanFileListSuffix = '/files'

/**
 * Version of a pacman package, stated as `[epoch:]pkgver-pkgrel`. The shape is the one of a Debian
 * version — pacman does not let a `pkgver` carry a dash either, so the release is what follows the
 * last one — and the epoch is dropped the same way.
 */
export function splitPacmanVersion(value: string | undefined) {
  return splitDebVersion(value)
}

/**
 * Fields of the `desc` file of a package of a pacman database, keyed by the `%KEY%` header that
 * introduces them. A value runs up to the empty line that closes it, so a field listed several
 * times (the licenses) keeps every value.
 */
export function pacmanDescFields(content: string): Record<string, string> {
  const fields: Record<string, string> = {}
  let key: string | null = null

  for (const line of content.split('\n')) {
    const header = /^%([A-Z0-9]+)%$/.exec(line.trim())
    if (header) {
      key = header[1]
      fields[key] = ''
      continue
    }
    if (!key) continue
    if (!line.trim()) {
      key = null
      continue
    }

    fields[key] += fields[key] ? `\n${line.trim()}` : line.trim()
  }

  return fields
}

/**
 * Package a directory of a pacman file list belongs to. The directory is named
 * `<name>-<pkgver>-<pkgrel>`, and the version cannot contain a dash, so the name is what is left
 * after the last two of them — checked against the `%NAME%` of every package of the Arch Linux
 * `core` and `extra` databases.
 */
export function pacmanFileListName(directory: string) {
  const parts = directory.split('-')
  return parts.length > 2 ? parts.slice(0, -2).join('-') : directory
}
