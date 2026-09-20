/**
 * Architecture of the packages that carry no machine code, and therefore belong to every
 * architecture of a distribution. RPM based distributions name it `noarch`, and the catalog stores
 * every such package under that name, whatever the archive it was read from calls it.
 */
export const archIndependentPackageArch = 'noarch'

/**
 * Architectures a package that carries no machine code was stored with before the catalog settled
 * on one spelling, one per archive format: Debian and its derivatives write `all`, pacman `any`.
 */
export const legacyArchIndependentArches = ['all', 'any']

/**
 * Architecture of a package in the one spelling the catalog stores it in.
 */
export function canonicalPackageArch(arch: string | null): string | null {
  return arch !== null && legacyArchIndependentArches.includes(arch)
    ? archIndependentPackageArch
    : arch
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
