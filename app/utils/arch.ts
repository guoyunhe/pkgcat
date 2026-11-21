import { debArches, pacmanArchs, supportedArches } from '#config/arch'

/**
 * Architecture of the packages that carry no machine code, and therefore belong to every
 * architecture of a distribution. RPM based distributions name it `noarch`, and the catalog stores
 * every such package under that name, whatever the archive it was read from calls it.
 */
export const archIndependentPackageArch = 'noarch'

/**
 * Architectures a package that carries no machine code was stored with before the catalog settled
 * on one spelling, one per archive format: Debian and its derivatives write `all`, pacman `any`.
 * These are the names the formats write, not the `noarch` the maps of `config/arch.ts` resolve them
 * to.
 */
export const legacyArchIndependentArches = ['all', 'any']

/** Package formats whose names for an architecture are mapped to the one of the catalog. */
export type ArchFormat = 'deb' | 'pacman'

/** Names each format spells an architecture with, mapped to the RPM name of the catalog. */
const formatArches: Record<ArchFormat, Record<string, string>> = {
  deb: debArches,
  pacman: pacmanArchs,
}

/** Architectures of the catalog the way each format names them, mapped back from the RPM name. */
const catalogArches: Record<ArchFormat, Record<string, string>> = {
  deb: reverseArches(debArches),
  pacman: reverseArches(pacmanArchs),
}

function reverseArches(arches: Record<string, string>) {
  const reversed: Record<string, string> = {}
  for (const [name, arch] of Object.entries(arches)) {
    if (arch === archIndependentPackageArch) continue
    // A format that spells an architecture the way the catalog does names it that way in a URL,
    // while the other names are the format's own (`x86_64_v3`, `armv7h`)
    if (reversed[arch] === undefined || name === arch) reversed[arch] = name
  }
  return reversed
}

/**
 * Architecture of a package in the spelling the catalog stores it in, as the format it was read
 * from names it. A name the format shares with the catalog, and one the catalog does not know, is
 * kept.
 */
export function toCatalogArch(arch: string | null, format: ArchFormat): string | null {
  if (arch === null) return null
  return formatArches[format][arch] ?? arch
}

/**
 * Architecture of the catalog the way a package format names it, which the URLs of a repository are
 * built with.
 */
export function toFormatArch(arch: string, format: ArchFormat): string {
  return catalogArches[format][arch] ?? arch
}

/** Whether the catalog carries packages and distributions of an architecture. */
export function isSupportedArch(arch: string): boolean {
  return (
    arch === archIndependentPackageArch || (supportedArches as readonly string[]).includes(arch)
  )
}

/**
 * Whether a package of the given architecture is part of the packages of another one. Packages
 * without a known architecture are counted with every architecture, so that they are replaced by a
 * synchronization instead of piling up.
 */
export function belongsToArch(packageArch: string | null, arch: string | undefined) {
  if (arch === undefined || packageArch === null) return true
  return packageArch === arch || packageArch === archIndependentPackageArch
}
