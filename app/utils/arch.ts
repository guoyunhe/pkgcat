/**
 * Architectures that carry no machine code, and therefore belong to every architecture of a
 * distribution. Debian and its derivatives call them `all`, RPM based distributions `noarch`.
 */
export const archIndependentPackageArches = ['all', 'noarch']

/**
 * Whether a package of the given architecture is part of the packages of another one. Packages
 * without a known architecture are counted with every architecture, so that they are replaced by a
 * synchronization instead of piling up.
 */
export function belongsToArch(packageArch: string | null, arch: string | undefined) {
  if (arch === undefined || packageArch === null) return true
  return packageArch === arch || archIndependentPackageArches.includes(packageArch)
}
