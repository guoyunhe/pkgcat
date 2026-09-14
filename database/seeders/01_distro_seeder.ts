import { BaseSeeder } from '@adonisjs/lucid/seeders'

import Distro from '#models/distro'
import Repo from '#models/repo'

/** Architecture names follow `uname -m`, the same vocabulary used by the package extractors. */
const desktopArches = ['x86_64', 'aarch64']

/**
 * Architectures of the distributions that publish server builds as well: Debian and the Enterprise
 * Linux rebuilds also build for POWER and the mainframe, on top of the two desktop architectures.
 */
const serverArches = [...desktopArches, 'ppc64le', 's390x']

/** OpenSUSE keeps its x86 packages on the main tree and the other architectures on the ports tree. */
function opensuseArchive(path: string, arch: string) {
  return arch === 'x86_64'
    ? `https://download.opensuse.org/${path}/`
    : `https://download.opensuse.org/ports/${arch}/${path}/`
}

/**
 * Official repository of a distribution; the seeder links it to the entries it serves. Every
 * definition states its synchronization interval, so that a repository cannot end up with one by
 * accident: the repositories of a release stream are frozen once the distribution is published, so
 * they keep `null` and are read again only when the synchronization is forced, while the ones that
 * keep changing after the release state the `updateSyncIntervalDays` interval.
 *
 * `arches` names the architectures the repository serves when one definition covers several of them
 * — the Ubuntu ports archive publishes for every architecture that is not x86 under a single line,
 * and a repository is stored once per name, so it is linked to all of them. It is left out when the
 * repository is read by every architecture of the release, either because its URL names the
 * architecture or because it does not matter.
 */
type DistroRepo = {
  name: string
  type: string
  baseUrl: string
  configContent?: string
  configUrl?: string
  installScript?: string
  syncIntervalDays: number | null
  arches?: string[]
}

/**
 * A deb repository of a distribution, built from the single source line it reads: the line names
 * the archive together with the suite and the components, which is what tells the repositories of a
 * distribution apart. The same archive serves several suites (`trixie` and `trixie-updates`), so
 * the archive alone would give two entries the same base URL, while the source line is unique. That
 * line is also all a deb repository is defined by, so it becomes the content of its configuration
 * file as well.
 *
 * `arches` is passed through for the sources that serve several architectures on one line, which
 * are stored once and linked to all of them.
 */
function debRepo(
  name: string,
  source: string,
  syncIntervalDays: number | null,
  arches?: string[],
): DistroRepo {
  return {
    name,
    type: 'deb',
    baseUrl: source,
    configContent: source,
    syncIntervalDays,
    arches,
  }
}

/**
 * Interval of the repositories whose content keeps changing after the release: the update streams
 * of the distributions, the rolling releases, and the repositories a distribution keeps publishing
 * for the life of a release.
 */
const updateSyncIntervalDays = 7

/**
 * Repositories of one AlmaLinux release: the packages are split between `BaseOS`, which holds the
 * system itself, and `AppStream`, which holds the applications built from it. Both carry the errata
 * of the release, and their URLs name the architecture, so the release has one entry per repository
 * and architecture.
 */
function almalinux(version: string) {
  return (arch: string): DistroRepo[] =>
    ['BaseOS', 'AppStream'].map((repository) => ({
      name: `AlmaLinux ${version} ${repository}`,
      type: 'rpm',
      baseUrl: `https://repo.almalinux.org/almalinux/${version}/${repository}/${arch}/os/`,
      syncIntervalDays: updateSyncIntervalDays,
    }))
}

/**
 * One distribution of the catalog with the architectures it is published for. Every architecture
 * becomes its own entry, and the repositories of the distribution are linked to the entries they
 * serve: a plain array holds the repositories that are read by every architecture of the release
 * (one row linked to each of them), or by the architectures they name (`arches`), while a function
 * of the architecture holds those whose URLs name it (openSUSE keeps the ARM packages on a separate
 * archive, Fedora and the Enterprise Linux rebuilds put the architecture in the path), which are
 * stored once per architecture, with the name telling them apart.
 */
type DistroSeed = {
  name: string
  version: string | null
  pkgType: string | null
  arches: string[]
  releaseDate: string | null
  eolDate: string | null
  repos?: DistroRepo[] | ((arch: string) => DistroRepo[])
}

/**
 * Repositories of one architecture of a distribution: the ones that serve it, with the architecture
 * appended to the name of the repositories whose URLs name it, so that entries can be told apart. A
 * repository that names the architectures it serves is read by all of them, so it keeps its name
 * and is stored once.
 */
function repositories(repos: DistroSeed['repos'], arch: string) {
  const perArchitecture = typeof repos === 'function'
  const definitions = perArchitecture ? repos(arch) : (repos ?? [])

  return definitions
    .filter(({ arches }) => !arches || arches.includes(arch))
    .map(({ arches, ...repository }) =>
      perArchitecture && !arches
        ? { ...repository, name: `${repository.name} (${arch})` }
        : repository,
    )
}

/**
 * Release and end-of-support dates follow [https://endoflife.date](https://endoflife.date) (`eol`),
 * except for the distributions that it does not track, which use the support statement of their
 * vendor. Rolling release distributions have no end of support, so they keep a `null` `eolDate`.
 *
 * Every architecture of a release is seeded as its own entry, and the repositories of a
 * distribution are linked to the entries they serve, so the repository of a release published for
 * several architectures is shared by all of them when its URLs do not name the architecture.
 * Distributions whose packages no extractor reads yet (Arch Linux, Manjaro Linux, NixOS, Gentoo
 * Linux, and SteamOS, which ships pacman repositories) and distributions whose content is behind a
 * subscription (Red Hat Enterprise Linux) therefore have no `repos` entry.
 *
 * The release tree of a distribution is frozen once the release is published, so its repositories
 * keep a `null` sync interval and are only read again with `repo:sync --force`; the update streams
 * of the same release, the rolling releases, and the repositories the distribution keeps publishing
 * for the life of a release are synchronized again every week.
 */
const distros: DistroSeed[] = [
  {
    name: 'AlmaLinux',
    version: '8',
    pkgType: 'rpm',
    arches: serverArches,
    releaseDate: '2021-03-30',
    eolDate: '2029-05-31',
    repos: almalinux('8'),
  },
  {
    name: 'AlmaLinux',
    version: '9',
    pkgType: 'rpm',
    arches: serverArches,
    releaseDate: '2022-05-26',
    eolDate: '2032-05-31',
    repos: almalinux('9'),
  },
  {
    name: 'AlmaLinux',
    version: '10',
    pkgType: 'rpm',
    arches: serverArches,
    releaseDate: '2025-05-27',
    eolDate: '2035-05-31',
    repos: almalinux('10'),
  },
  {
    name: 'Arch Linux',
    version: null,
    pkgType: null,
    // The distribution itself only builds x86_64; its aarch64 packages come from the Arch Linux ARM
    // port, which is what the catalog carries for that architecture
    arches: desktopArches,
    releaseDate: null,
    eolDate: null,
  },
  {
    name: 'Debian',
    version: '12',
    pkgType: 'deb',
    arches: serverArches,
    releaseDate: '2023-06-10',
    eolDate: '2028-06-30',
    repos: [
      debRepo(
        'Debian 12 Main',
        'deb https://deb.debian.org/debian bookworm main contrib non-free non-free-firmware',
        null,
      ),
      debRepo(
        'Debian 12 Updates',
        'deb https://deb.debian.org/debian bookworm-updates main contrib non-free non-free-firmware',
        updateSyncIntervalDays,
      ),
      debRepo(
        'Debian 12 Security',
        'deb https://security.debian.org/debian-security bookworm-security main contrib non-free non-free-firmware',
        updateSyncIntervalDays,
      ),
    ],
  },
  {
    name: 'Debian',
    version: '13',
    pkgType: 'deb',
    arches: serverArches,
    releaseDate: '2025-08-09',
    eolDate: '2030-06-30',
    repos: [
      debRepo(
        'Debian 13 Main',
        'deb https://deb.debian.org/debian trixie main contrib non-free non-free-firmware',
        null,
      ),
      debRepo(
        'Debian 13 Updates',
        'deb https://deb.debian.org/debian trixie-updates main contrib non-free non-free-firmware',
        updateSyncIntervalDays,
      ),
      debRepo(
        'Debian 13 Security',
        'deb https://security.debian.org/debian-security trixie-security main contrib non-free non-free-firmware',
        updateSyncIntervalDays,
      ),
    ],
  },
  {
    name: 'elementary OS',
    version: '8',
    pkgType: 'deb',
    // elementary OS is published for x86_64 only
    arches: ['x86_64'],
    releaseDate: '2024-11-26',
    eolDate: '2029-05-31',
    repos: [
      debRepo(
        'elementary OS 8 Stable',
        'deb http://ppa.launchpad.net/elementary-os/stable/ubuntu noble main',
        // The distribution keeps publishing its own packages for the life of the release
        updateSyncIntervalDays,
      ),
    ],
  },
  {
    name: 'Fedora Linux',
    version: '42',
    pkgType: 'rpm',
    arches: desktopArches,
    releaseDate: '2025-04-15',
    eolDate: '2026-05-27',
    repos: (arch) => [
      {
        name: 'Fedora Linux 42 Everything',
        type: 'rpm',
        baseUrl: `https://download.fedoraproject.org/pub/fedora/linux/releases/42/Everything/${arch}/os/`,
        syncIntervalDays: null,
      },
      {
        name: 'Fedora Linux 42 Updates',
        type: 'rpm',
        // Fedora 42 is past its end of support and no mirror serves its update stream any more,
        // which the archive keeps as it was left; a frozen tree is only read when forced
        baseUrl: `https://archives.fedoraproject.org/pub/archive/fedora/linux/updates/42/Everything/${arch}/`,
        syncIntervalDays: null,
      },
    ],
  },
  {
    name: 'Fedora Linux',
    version: '43',
    pkgType: 'rpm',
    arches: desktopArches,
    releaseDate: '2025-10-28',
    eolDate: '2026-12-09',
    repos: (arch) => [
      {
        name: 'Fedora Linux 43 Everything',
        type: 'rpm',
        baseUrl: `https://download.fedoraproject.org/pub/fedora/linux/releases/43/Everything/${arch}/os/`,
        syncIntervalDays: null,
      },
      {
        name: 'Fedora Linux 43 Updates',
        type: 'rpm',
        baseUrl: `https://download.fedoraproject.org/pub/fedora/linux/updates/43/Everything/${arch}/`,
        syncIntervalDays: updateSyncIntervalDays,
      },
    ],
  },
  {
    name: 'Fedora Linux',
    version: '44',
    pkgType: 'rpm',
    arches: desktopArches,
    releaseDate: '2026-04-28',
    eolDate: '2027-06-02',
    repos: (arch) => [
      {
        name: 'Fedora Linux 44 Everything',
        type: 'rpm',
        baseUrl: `https://download.fedoraproject.org/pub/fedora/linux/releases/44/Everything/${arch}/os/`,
        syncIntervalDays: null,
      },
      {
        name: 'Fedora Linux 44 Updates',
        type: 'rpm',
        baseUrl: `https://download.fedoraproject.org/pub/fedora/linux/updates/44/Everything/${arch}/`,
        syncIntervalDays: updateSyncIntervalDays,
      },
    ],
  },
  {
    name: 'Gentoo Linux',
    version: null,
    pkgType: null,
    arches: desktopArches,
    releaseDate: null,
    eolDate: null,
  },
  {
    name: 'Kali Linux',
    version: null,
    pkgType: 'deb',
    arches: desktopArches,
    releaseDate: null,
    eolDate: null,
    repos: [
      debRepo(
        'Kali Linux Rolling',
        'deb http://http.kali.org/kali kali-rolling main contrib non-free non-free-firmware',
        // A rolling release has no frozen tree, so its repositories are read again every week
        updateSyncIntervalDays,
      ),
    ],
  },
  {
    name: 'Linux Mint',
    version: '22',
    pkgType: 'deb',
    arches: ['x86_64'],
    releaseDate: '2024-07-25',
    eolDate: '2029-04-01',
    repos: [
      debRepo(
        'Linux Mint 22 Main',
        'deb http://packages.linuxmint.com wilma main upstream import backport',
        // The distribution keeps publishing its own packages for the life of the release
        updateSyncIntervalDays,
      ),
    ],
  },
  {
    name: 'Manjaro Linux',
    version: null,
    pkgType: null,
    arches: desktopArches,
    releaseDate: null,
    eolDate: null,
  },
  {
    name: 'MX Linux',
    version: '23',
    pkgType: 'deb',
    arches: desktopArches,
    releaseDate: '2023-07-31',
    eolDate: '2028-06-10',
    repos: [
      debRepo(
        'MX Linux 23 Main',
        'deb http://mxrepo.com/mx/repo/ bookworm main non-free',
        // The distribution keeps publishing its own packages for the life of the release
        updateSyncIntervalDays,
      ),
    ],
  },
  {
    name: 'NixOS',
    version: '25.05',
    pkgType: null,
    arches: desktopArches,
    releaseDate: '2025-05-23',
    eolDate: '2025-12-31',
  },
  {
    name: 'openSUSE Leap',
    version: '16.0',
    pkgType: 'rpm',
    arches: desktopArches,
    releaseDate: '2025-10-01',
    eolDate: '2027-10-31',
    repos: [
      {
        name: 'openSUSE Leap 16.0 OSS',
        type: 'rpm',
        baseUrl: 'https://download.opensuse.org/distribution/leap/16.0/repo/oss/',
        // Leap 16.0 has no update tree of its own: the release publishes its updates into this
        // tree, which also carries every architecture, so it keeps changing and is read every week
        syncIntervalDays: updateSyncIntervalDays,
      },
    ],
  },
  {
    name: 'openSUSE Tumbleweed',
    version: null,
    pkgType: 'rpm',
    arches: desktopArches,
    releaseDate: null,
    eolDate: null,
    repos: (arch) => [
      {
        name: 'openSUSE Tumbleweed OSS',
        type: 'rpm',
        baseUrl: opensuseArchive('tumbleweed/repo/oss', arch),
        // A rolling release has no frozen tree, so its repositories are read again every week
        syncIntervalDays: updateSyncIntervalDays,
      },
      {
        name: 'openSUSE Tumbleweed Non-OSS',
        type: 'rpm',
        baseUrl: opensuseArchive('tumbleweed/repo/non-oss', arch),
        syncIntervalDays: updateSyncIntervalDays,
      },
    ],
  },
  {
    name: 'Pop!_OS',
    version: '24.04',
    pkgType: 'deb',
    // Pop!_OS is published for x86_64 only
    arches: ['x86_64'],
    releaseDate: '2025-12-11',
    eolDate: '2029-05-31',
    repos: [
      debRepo(
        'Pop!_OS 24.04 Main',
        'deb http://apt.pop-os.org/ubuntu noble main',
        // The distribution keeps publishing its own packages for the life of the release
        updateSyncIntervalDays,
      ),
    ],
  },
  {
    name: 'Red Hat Enterprise Linux',
    version: '9',
    pkgType: 'rpm',
    arches: desktopArches,
    releaseDate: '2022-05-18',
    eolDate: '2032-05-31',
  },
  {
    name: 'Rocky Linux',
    version: '9',
    pkgType: 'rpm',
    arches: desktopArches,
    releaseDate: '2022-07-14',
    eolDate: '2032-05-31',
    repos: (arch) => [
      {
        name: 'Rocky Linux 9 BaseOS',
        type: 'rpm',
        baseUrl: `https://dl.rockylinux.org/pub/rocky/9/BaseOS/${arch}/os/`,
        // Errata are published into the release tree itself, so it keeps changing
        syncIntervalDays: updateSyncIntervalDays,
      },
    ],
  },
  {
    name: 'SteamOS',
    version: '3',
    pkgType: 'deb',
    arches: ['x86_64'],
    releaseDate: '2022-03-01',
    eolDate: null,
  },
  {
    name: 'Ubuntu',
    version: '24.04',
    pkgType: 'deb',
    arches: serverArches,
    releaseDate: '2024-04-25',
    eolDate: '2029-05-31',
    repos: [
      debRepo(
        'Ubuntu 24.04 Main',
        'deb http://archive.ubuntu.com/ubuntu/ noble main restricted universe multiverse',
        null,
        ['x86_64'],
      ),
      debRepo(
        'Ubuntu 24.04 Ports',
        'deb http://ports.ubuntu.com/ubuntu-ports/ noble main restricted universe multiverse',
        null,
        ['aarch64', 'ppc64le', 's390x'],
      ),
    ],
  },
  {
    name: 'Ubuntu',
    version: '26.04',
    pkgType: 'deb',
    arches: serverArches,
    releaseDate: '2026-04-23',
    eolDate: '2031-05-29',
    repos: [
      debRepo(
        'Ubuntu 26.04 Main',
        'deb http://archive.ubuntu.com/ubuntu/ resolute main restricted universe multiverse',
        null,
        ['x86_64'],
      ),
      debRepo(
        'Ubuntu 26.04 Ports',
        'deb http://ports.ubuntu.com/ubuntu-ports/ resolute main restricted universe multiverse',
        null,
        ['aarch64', 'ppc64le', 's390x'],
      ),
    ],
  },
  {
    name: 'Zorin OS',
    version: '17',
    pkgType: 'deb',
    arches: ['x86_64'],
    releaseDate: '2023-12-20',
    eolDate: '2027-06-01',
    repos: [
      debRepo(
        'Zorin OS 17 Stable',
        'deb http://ppa.launchpad.net/zorinos/stable/ubuntu jammy main',
        // The distribution keeps publishing its own packages for the life of the release
        updateSyncIntervalDays,
      ),
    ],
  },
]

export default class DistroSeeder extends BaseSeeder {
  async run() {
    // Distributions each repository is linked to, collected while the entries are written
    const links = new Map<string, number[]>()

    for (const { arches, repos, ...distro } of distros) {
      for (const arch of arches) {
        // The seed data carries ISO dates, while the Lucid types expect `DateTime` instances
        const distroRecord = await Distro.updateOrCreate(
          { name: distro.name, version: distro.version, arch },
          { ...distro, arch } as any,
        )

        for (const definition of repositories(repos, arch)) {
          const repoRecord = await Repo.updateOrCreate(
            { name: definition.name },
            { ...definition, source: 'distro' },
          )
          const distroIds = links.get(repoRecord.name) ?? []
          if (!distroIds.includes(distroRecord.id)) distroIds.push(distroRecord.id)
          links.set(repoRecord.name, distroIds)
        }
      }
    }

    // The repository of a release published for several architectures is linked to all of them
    for (const [name, distroIds] of links) {
      const repo = await Repo.findByOrFail('name', name)
      await repo.related('distros').sync(distroIds)
    }
  }
}
