import type { DistroSelector } from '#database/data/types'

/**
 * Releases of the catalog a repository of a distribution family is linked to. A vendor publishes
 * its repository for a whole family of distributions — the Enterprise Linux ones, the Fedora ones,
 * the SUSE ones, the Debian based ones — and every release of that family installs from it, so a
 * row of the seed data names the family instead of listing the releases itself. A repository a
 * vendor publishes for one release of a family only (the one MEGA publishes for Fedora Linux 43,
 * say) is linked to that release alone, which the `versions` the helpers take name.
 */

/** Architecture of a release, which is what a repository published for it is served at. */
export type RepoArch = 'x86_64' | 'aarch64'

/** One release of a family, with the architectures the family is published for. */
type FamilyRelease = { name: string; version: string | null; arches: RepoArch[] }

const enterpriseLinux: FamilyRelease[] = [
  { name: 'CentOS Stream', version: '9', arches: ['x86_64', 'aarch64'] },
  { name: 'CentOS Stream', version: '10', arches: ['x86_64', 'aarch64'] },
  { name: 'Red Hat Enterprise Linux', version: '8', arches: ['x86_64', 'aarch64'] },
  { name: 'Red Hat Enterprise Linux', version: '9', arches: ['x86_64', 'aarch64'] },
  { name: 'Red Hat Enterprise Linux', version: '10', arches: ['x86_64', 'aarch64'] },
]

const fedora: FamilyRelease[] = [
  { name: 'Fedora Linux', version: '43', arches: ['x86_64', 'aarch64'] },
  { name: 'Fedora Linux', version: '44', arches: ['x86_64', 'aarch64'] },
]

const suse: FamilyRelease[] = [
  { name: 'openSUSE Leap', version: '16.0', arches: ['x86_64', 'aarch64'] },
  { name: 'openSUSE Tumbleweed', version: null, arches: ['x86_64', 'aarch64'] },
  { name: 'SUSE Linux Enterprise', version: '15.7', arches: ['x86_64', 'aarch64'] },
  { name: 'SUSE Linux Enterprise', version: '16.0', arches: ['x86_64', 'aarch64'] },
]

const debian: FamilyRelease[] = [
  { name: 'Debian', version: '12', arches: ['x86_64', 'aarch64'] },
  { name: 'Debian', version: '13', arches: ['x86_64', 'aarch64'] },
]

const ubuntu: FamilyRelease[] = [
  { name: 'Ubuntu', version: '22.04', arches: ['x86_64', 'aarch64'] },
  { name: 'Ubuntu', version: '24.04', arches: ['x86_64', 'aarch64'] },
  { name: 'Ubuntu', version: '26.04', arches: ['x86_64', 'aarch64'] },
]

/**
 * Entries the releases of the list are selected by, for the architectures a repository serves: a
 * release is left out when the repository publishes nothing for it, which is what a vendor that
 * only built for one architecture answers with.
 */
function entries(
  releases: FamilyRelease[],
  arches: RepoArch[],
  versions?: string[],
): DistroSelector[] {
  return releases
    .filter((release) => !versions || versions.includes(release.version ?? ''))
    .flatMap((release) =>
      release.arches
        .filter((arch) => arches.includes(arch))
        .map((arch) => ({ name: release.name, version: release.version, arch })),
    )
}

/** Every release of the Enterprise Linux, Fedora and SUSE families. */
export function rpmDistros(arches: RepoArch[]): DistroSelector[] {
  return entries([...enterpriseLinux, ...fedora, ...suse], arches)
}

/** The Enterprise Linux releases of the named versions, the streams a repository serves included. */
export function elDistros(
  arches: RepoArch[],
  versions: string[] = ['8', '9', '10'],
): DistroSelector[] {
  return entries(enterpriseLinux, arches, versions)
}

export function fedoraDistros(
  arches: RepoArch[],
  versions: string[] = ['43', '44'],
): DistroSelector[] {
  return entries(fedora, arches, versions)
}

/** The SUSE releases of the named versions, which the releases of a series share. */
export function suseDistros(
  arches: RepoArch[],
  versions: string[] = ['15.7', '16.0'],
): DistroSelector[] {
  return entries(suse, arches, versions)
}

/** OpenSUSE Tumbleweed, whose repository is read whatever version it stands at. */
export function tumbleweedDistros(arches: RepoArch[]): DistroSelector[] {
  return entries(suse, arches).filter((entry) => entry.version === null)
}

/** OpenSUSE Leap 16.0, the release the current openSUSE line stands at. */
export function leapDistros(arches: RepoArch[]): DistroSelector[] {
  return entries(suse, arches, ['16.0']).filter((entry) => entry.name === 'openSUSE Leap')
}

/** Every release of the Debian and Ubuntu families. */
export function debDistros(arches: RepoArch[]): DistroSelector[] {
  return entries([...debian, ...ubuntu], arches)
}

export function debianDistros(
  arches: RepoArch[],
  versions: string[] = ['12', '13'],
): DistroSelector[] {
  return entries(debian, arches, versions)
}

export function ubuntuDistros(
  arches: RepoArch[],
  versions: string[] = ['22.04', '24.04', '26.04'],
): DistroSelector[] {
  return entries(ubuntu, arches, versions)
}
