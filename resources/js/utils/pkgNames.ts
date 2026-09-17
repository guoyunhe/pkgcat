/** Package name an application owns, as the API reads and writes it. */
export type PkgNameMapping = {
  name: string
  /** Package format the mapping is limited to, or `null` when it applies to every format. */
  type: string | null
}

/** Package formats a mapping can be limited to; anything else is part of the package name. */
const pkgTypes = ['deb', 'rpm', 'pacman', 'appimage']

/**
 * Tag a mapping is edited as in the form. The package format is written in front of the name
 * (`deb:vlc`), while a name that is mapped in every package format is the bare name.
 */
export function formatPkgNameMapping(mapping: PkgNameMapping) {
  return mapping.type ? `${mapping.type}:${mapping.name}` : mapping.name
}

/**
 * Mapping a tag of the form stands for. A tag whose prefix is not a package format is a package
 * name that is mapped in every format, so that a name containing a colon cannot be misread.
 */
export function parsePkgNameMapping(tag: string): PkgNameMapping {
  const separator = tag.indexOf(':')
  if (separator > 0) {
    const type = tag.slice(0, separator).trim().toLowerCase()
    const name = tag.slice(separator + 1).trim()
    if (name && pkgTypes.includes(type)) return { name, type }
  }
  return { name: tag.trim(), type: null }
}
