import { BaseSeeder } from '@adonisjs/lucid/seeders'

import Distro from '#models/distro'
import Repo from '#models/repo'

/** Architecture names follow `uname -m`, the same vocabulary used by the package extractors. */
const desktopArches = ['x86_64', 'aarch64']

/** Ubuntu keeps its x86 packages on the main archive and the ARM ones on the ports archive. */
function ubuntuArchive(arch: string) {
  return arch === 'aarch64'
    ? 'http://ports.ubuntu.com/ubuntu-ports/'
    : 'http://archive.ubuntu.com/ubuntu/'
}

/**
 * Official repository of a distribution; the seeder links it to the entries it serves. Every
 * definition states its synchronization interval, so that a repository cannot end up with one by
 * accident: the repositories of a release stream are frozen once the distribution is published, so
 * they keep `null` and are read again only when the synchronization is forced, while the ones that
 * keep changing after the release state the `updateSyncIntervalDays` interval.
 */
type DistroRepo = {
  name: string
  type: string
  baseUrl: string
  configContent?: string
  configUrl?: string
  installScript?: string
  syncIntervalDays: number | null
}

/**
 * Interval of the repositories whose content keeps changing after the release: the update streams
 * of the distributions, the rolling releases, and the repositories a distribution keeps publishing
 * for the life of a release.
 */
const updateSyncIntervalDays = 7

/**
 * One distribution of the catalog with the architectures it is published for. Every architecture
 * becomes its own entry, and the repositories of the distribution are linked to the entries they
 * serve: a plain array holds the repositories that serve every architecture of the release (one row
 * linked to each of them), while a function of the architecture holds those whose URLs name it
 * (Ubuntu keeps the ARM packages on a separate archive, Fedora and the Enterprise Linux rebuilds
 * put the architecture in the path), which are stored once per architecture, with the name telling
 * them apart.
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

/** Repositories of one architecture of a distribution, named so that entries can be told apart. */
function repositories(repos: DistroSeed['repos'], arch: string) {
  if (typeof repos === 'function') {
    return repos(arch).map((repo) => ({ ...repo, name: `${repo.name} (${arch})` }))
  }
  return repos ?? []
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
    name: 'Ubuntu',
    version: '24.04',
    pkgType: 'deb',
    arches: desktopArches,
    releaseDate: '2024-04-25',
    eolDate: '2029-05-31',
    repos: (arch) => [
      {
        name: 'Ubuntu 24.04 Main',
        type: 'deb',
        baseUrl: ubuntuArchive(arch),
        configContent: `deb ${ubuntuArchive(arch)} noble main restricted universe multiverse`,
        syncIntervalDays: null,
      },
    ],
  },
  {
    name: 'Debian',
    version: '13',
    pkgType: 'deb',
    arches: desktopArches,
    releaseDate: '2025-08-09',
    eolDate: '2030-06-30',
    repos: [
      {
        name: 'Debian 13 Main',
        type: 'deb',
        baseUrl: 'https://deb.debian.org/debian/',
        configContent:
          'deb https://deb.debian.org/debian trixie main contrib non-free non-free-firmware',
        syncIntervalDays: null,
      },
      {
        name: 'Debian 13 Updates',
        type: 'deb',
        baseUrl: 'https://deb.debian.org/debian/',
        configContent:
          'deb https://deb.debian.org/debian trixie-updates main contrib non-free non-free-firmware',
        syncIntervalDays: updateSyncIntervalDays,
      },
      {
        name: 'Debian 13 Security',
        type: 'deb',
        baseUrl: 'https://security.debian.org/debian-security/',
        configContent:
          'deb https://security.debian.org/debian-security trixie-security main contrib non-free non-free-firmware',
        syncIntervalDays: updateSyncIntervalDays,
      },
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
        baseUrl: `https://download.fedoraproject.org/pub/fedora/linux/updates/42/Everything/${arch}/`,
        syncIntervalDays: updateSyncIntervalDays,
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
    name: 'Linux Mint',
    version: '22',
    pkgType: 'deb',
    arches: ['x86_64'],
    releaseDate: '2024-07-25',
    eolDate: '2029-04-01',
    repos: [
      {
        name: 'Linux Mint 22 Main',
        type: 'deb',
        baseUrl: 'http://packages.linuxmint.com/',
        configContent: 'deb http://packages.linuxmint.com wilma main upstream import backport',
        // The distribution keeps publishing its own packages for the life of the release
        syncIntervalDays: updateSyncIntervalDays,
      },
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
    name: 'AlmaLinux',
    version: '9',
    pkgType: 'rpm',
    arches: desktopArches,
    releaseDate: '2022-05-26',
    eolDate: '2032-05-31',
    repos: (arch) => [
      {
        name: 'AlmaLinux 9 BaseOS',
        type: 'rpm',
        baseUrl: `https://repo.almalinux.org/almalinux/9/BaseOS/${arch}/os/`,
        // Errata are published into the release tree itself, so it keeps changing
        syncIntervalDays: updateSyncIntervalDays,
      },
    ],
  },
  {
    name: 'Arch Linux',
    version: null,
    pkgType: null,
    arches: ['x86_64'],
    releaseDate: null,
    eolDate: null,
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
        syncIntervalDays: null,
      },
      {
        name: 'openSUSE Leap 16.0 Updates',
        type: 'rpm',
        baseUrl: 'https://download.opensuse.org/update/leap/16.0/oss/',
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
    repos: [
      {
        name: 'openSUSE Tumbleweed OSS',
        type: 'rpm',
        baseUrl: 'https://download.opensuse.org/tumbleweed/repo/oss/',
        // A rolling release has no frozen tree, so its repositories are read again every week
        syncIntervalDays: updateSyncIntervalDays,
      },
      {
        name: 'openSUSE Tumbleweed Non-OSS',
        type: 'rpm',
        baseUrl: 'https://download.opensuse.org/tumbleweed/repo/non-oss/',
        syncIntervalDays: updateSyncIntervalDays,
      },
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
    name: 'Pop!_OS',
    version: '24.04',
    pkgType: 'deb',
    // Pop!_OS is published for x86_64 only
    arches: ['x86_64'],
    releaseDate: '2025-12-11',
    eolDate: '2029-05-31',
    repos: [
      {
        name: 'Pop!_OS 24.04 Main',
        type: 'deb',
        baseUrl: 'http://apt.pop-os.org/ubuntu/',
        configContent: 'deb http://apt.pop-os.org/ubuntu noble main',
        // The distribution keeps publishing its own packages for the life of the release
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
    name: 'NixOS',
    version: '25.05',
    pkgType: null,
    arches: desktopArches,
    releaseDate: '2025-05-23',
    eolDate: '2025-12-31',
  },
  {
    name: 'MX Linux',
    version: '23',
    pkgType: 'deb',
    arches: desktopArches,
    releaseDate: '2023-07-31',
    eolDate: '2028-06-10',
    repos: [
      {
        name: 'MX Linux 23 Main',
        type: 'deb',
        baseUrl: 'http://mxrepo.com/mx/repo/',
        configContent: 'deb http://mxrepo.com/mx/repo/ bookworm main non-free',
        // The distribution keeps publishing its own packages for the life of the release
        syncIntervalDays: updateSyncIntervalDays,
      },
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
      {
        name: 'elementary OS 8 Stable',
        type: 'deb',
        baseUrl: 'http://ppa.launchpad.net/elementary-os/stable/ubuntu/',
        configContent: 'deb http://ppa.launchpad.net/elementary-os/stable/ubuntu noble main',
        // The distribution keeps publishing its own packages for the life of the release
        syncIntervalDays: updateSyncIntervalDays,
      },
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
      {
        name: 'Zorin OS 17 Stable',
        type: 'deb',
        baseUrl: 'http://ppa.launchpad.net/zorinos/stable/ubuntu/',
        configContent: 'deb http://ppa.launchpad.net/zorinos/stable/ubuntu jammy main',
        // The distribution keeps publishing its own packages for the life of the release
        syncIntervalDays: updateSyncIntervalDays,
      },
    ],
  },
  {
    name: 'Kali Linux',
    version: null,
    pkgType: 'deb',
    arches: desktopArches,
    releaseDate: null,
    eolDate: null,
    repos: [
      {
        name: 'Kali Linux Rolling',
        type: 'deb',
        baseUrl: 'http://http.kali.org/kali/',
        configContent:
          'deb http://http.kali.org/kali kali-rolling main contrib non-free non-free-firmware',
        // A rolling release has no frozen tree, so its repositories are read again every week
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
