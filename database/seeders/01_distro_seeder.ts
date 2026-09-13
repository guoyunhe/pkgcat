import { BaseSeeder } from '@adonisjs/lucid/seeders'

import Distro from '#models/distro'
import Repo from '#models/repo'

/** Architecture names follow `uname -m`, the same vocabulary used by the package extractors. */
const arches = ['x86_64', 'aarch64']

/** Official repository of a distribution; the seeder links it with `distroId` and a distro source. */
type DistroRepo = {
  name: string
  type: string
  baseUrl: string
  configContent?: string
  configUrl?: string
  installScript?: string
  syncIntervalDays?: number | null
}

/** One distribution of the catalog, together with the official repositories it ships. */
type DistroSeed = {
  name: string
  version: string | null
  pkgType: string | null
  arch: string[]
  releaseDate: string | null
  eolDate: string | null
  repos?: DistroRepo[]
}

/**
 * Release and end-of-support dates follow [https://endoflife.date](https://endoflife.date) (`eol`),
 * except for the distributions that it does not track, which use the support statement of their
 * vendor. Rolling release distributions have no end of support, so they keep a `null` `eolDate`.
 *
 * `repos` holds the official repositories of the distribution, which are seeded together with it
 * and linked through `distroId`. Distributions whose packages no extractor reads yet (Arch Linux,
 * Manjaro Linux, NixOS, Gentoo Linux, and SteamOS, which ships pacman repositories) and
 * distributions whose content is behind a subscription (Red Hat Enterprise Linux) therefore have no
 * `repos` entry.
 */
const distros: DistroSeed[] = [
  {
    name: 'Ubuntu',
    version: '24.04',
    pkgType: 'deb',
    arch: arches,
    releaseDate: '2024-04-25',
    eolDate: '2029-05-31',
    repos: [
      {
        name: 'Ubuntu 24.04 Main',
        type: 'deb',
        baseUrl: 'http://archive.ubuntu.com/ubuntu/',
        configContent:
          'deb http://archive.ubuntu.com/ubuntu noble main restricted universe multiverse',
        syncIntervalDays: 7,
      },
    ],
  },
  {
    name: 'Debian',
    version: '13',
    pkgType: 'deb',
    arch: arches,
    releaseDate: '2025-08-09',
    eolDate: '2030-06-30',
    repos: [
      {
        name: 'Debian 13 Main',
        type: 'deb',
        baseUrl: 'https://deb.debian.org/debian/',
        configContent:
          'deb https://deb.debian.org/debian trixie main contrib non-free non-free-firmware',
      },
      {
        name: 'Debian 13 Updates',
        type: 'deb',
        baseUrl: 'https://deb.debian.org/debian/',
        configContent:
          'deb https://deb.debian.org/debian trixie-updates main contrib non-free non-free-firmware',
      },
      {
        name: 'Debian 13 Security',
        type: 'deb',
        baseUrl: 'https://security.debian.org/debian-security/',
        configContent:
          'deb https://security.debian.org/debian-security trixie-security main contrib non-free non-free-firmware',
      },
    ],
  },
  {
    name: 'Fedora Linux',
    version: '42',
    pkgType: 'rpm',
    arch: arches,
    releaseDate: '2025-04-15',
    eolDate: '2026-05-27',
    repos: [
      {
        name: 'Fedora Linux 42 Everything',
        type: 'rpm',
        baseUrl:
          'https://download.fedoraproject.org/pub/fedora/linux/releases/42/Everything/x86_64/os/',
        syncIntervalDays: 7,
      },
      {
        name: 'Fedora Linux 42 Updates',
        type: 'rpm',
        baseUrl:
          'https://download.fedoraproject.org/pub/fedora/linux/updates/42/Everything/x86_64/',
        syncIntervalDays: 7,
      },
    ],
  },
  {
    name: 'Fedora Linux',
    version: '43',
    pkgType: 'rpm',
    arch: arches,
    releaseDate: '2025-10-28',
    eolDate: '2026-12-09',
    repos: [
      {
        name: 'Fedora Linux 43 Everything',
        type: 'rpm',
        baseUrl:
          'https://download.fedoraproject.org/pub/fedora/linux/releases/43/Everything/x86_64/os/',
        syncIntervalDays: 7,
      },
      {
        name: 'Fedora Linux 43 Updates',
        type: 'rpm',
        baseUrl:
          'https://download.fedoraproject.org/pub/fedora/linux/updates/43/Everything/x86_64/',
        syncIntervalDays: 7,
      },
    ],
  },
  {
    name: 'Fedora Linux',
    version: '44',
    pkgType: 'rpm',
    arch: arches,
    releaseDate: '2026-04-28',
    eolDate: '2027-06-02',
    repos: [
      {
        name: 'Fedora Linux 44 Everything',
        type: 'rpm',
        baseUrl:
          'https://download.fedoraproject.org/pub/fedora/linux/releases/44/Everything/x86_64/os/',
        syncIntervalDays: 7,
      },
      {
        name: 'Fedora Linux 44 Updates',
        type: 'rpm',
        baseUrl:
          'https://download.fedoraproject.org/pub/fedora/linux/updates/44/Everything/x86_64/',
        syncIntervalDays: 7,
      },
    ],
  },
  {
    name: 'Linux Mint',
    version: '22',
    pkgType: 'deb',
    arch: ['x86_64'],
    releaseDate: '2024-07-25',
    eolDate: '2029-04-01',
    repos: [
      {
        name: 'Linux Mint 22 Main',
        type: 'deb',
        baseUrl: 'http://packages.linuxmint.com/',
        configContent: 'deb http://packages.linuxmint.com wilma main upstream import backport',
        syncIntervalDays: 7,
      },
    ],
  },
  {
    name: 'Red Hat Enterprise Linux',
    version: '9',
    pkgType: 'rpm',
    arch: arches,
    releaseDate: '2022-05-18',
    eolDate: '2032-05-31',
  },
  {
    name: 'Rocky Linux',
    version: '9',
    pkgType: 'rpm',
    arch: arches,
    releaseDate: '2022-07-14',
    eolDate: '2032-05-31',
    repos: [
      {
        name: 'Rocky Linux 9 BaseOS',
        type: 'rpm',
        baseUrl: 'https://dl.rockylinux.org/pub/rocky/9/BaseOS/x86_64/os/',
        syncIntervalDays: 7,
      },
    ],
  },
  {
    name: 'AlmaLinux',
    version: '9',
    pkgType: 'rpm',
    arch: arches,
    releaseDate: '2022-05-26',
    eolDate: '2032-05-31',
    repos: [
      {
        name: 'AlmaLinux 9 BaseOS',
        type: 'rpm',
        baseUrl: 'https://repo.almalinux.org/almalinux/9/BaseOS/x86_64/os/',
        syncIntervalDays: 7,
      },
    ],
  },
  {
    name: 'Arch Linux',
    version: null,
    pkgType: null,
    arch: ['x86_64'],
    releaseDate: null,
    eolDate: null,
  },
  {
    name: 'openSUSE Leap',
    version: '16.0',
    pkgType: 'rpm',
    arch: arches,
    releaseDate: '2025-10-01',
    eolDate: '2027-10-31',
    repos: [
      {
        name: 'openSUSE Leap 16.0 OSS',
        type: 'rpm',
        baseUrl: 'https://download.opensuse.org/distribution/leap/16.0/repo/oss/',
        syncIntervalDays: 7,
      },
      {
        name: 'openSUSE Leap 16.0 Updates',
        type: 'rpm',
        baseUrl: 'https://download.opensuse.org/update/leap/16.0/oss/',
        syncIntervalDays: 7,
      },
    ],
  },
  {
    name: 'openSUSE Tumbleweed',
    version: null,
    pkgType: 'rpm',
    arch: arches,
    releaseDate: null,
    eolDate: null,
    repos: [
      {
        name: 'openSUSE Tumbleweed OSS',
        type: 'rpm',
        baseUrl: 'https://download.opensuse.org/tumbleweed/repo/oss/',
        syncIntervalDays: 7,
      },
      {
        name: 'openSUSE Tumbleweed Non-OSS',
        type: 'rpm',
        baseUrl: 'https://download.opensuse.org/tumbleweed/repo/non-oss/',
        syncIntervalDays: 7,
      },
    ],
  },
  {
    name: 'Manjaro Linux',
    version: null,
    pkgType: null,
    arch: arches,
    releaseDate: null,
    eolDate: null,
  },
  {
    name: 'Pop!_OS',
    version: '24.04',
    pkgType: 'deb',
    arch: arches,
    releaseDate: '2025-12-11',
    eolDate: '2029-05-31',
    repos: [
      {
        name: 'Pop!_OS 24.04 Main',
        type: 'deb',
        baseUrl: 'http://apt.pop-os.org/ubuntu/',
        configContent: 'deb http://apt.pop-os.org/ubuntu noble main',
        syncIntervalDays: 7,
      },
    ],
  },
  {
    name: 'SteamOS',
    version: '3',
    pkgType: 'deb',
    arch: ['x86_64'],
    releaseDate: '2022-03-01',
    eolDate: null,
  },
  {
    name: 'NixOS',
    version: '25.05',
    pkgType: null,
    arch: arches,
    releaseDate: '2025-05-23',
    eolDate: '2025-12-31',
  },
  {
    name: 'MX Linux',
    version: '23',
    pkgType: 'deb',
    arch: arches,
    releaseDate: '2023-07-31',
    eolDate: '2028-06-10',
    repos: [
      {
        name: 'MX Linux 23 Main',
        type: 'deb',
        baseUrl: 'http://mxrepo.com/mx/repo/',
        configContent: 'deb http://mxrepo.com/mx/repo/ bookworm main non-free',
        syncIntervalDays: 7,
      },
    ],
  },
  {
    name: 'elementary OS',
    version: '8',
    pkgType: 'deb',
    arch: arches,
    releaseDate: '2024-11-26',
    eolDate: '2029-05-31',
    repos: [
      {
        name: 'elementary OS 8 Stable',
        type: 'deb',
        baseUrl: 'http://ppa.launchpad.net/elementary-os/stable/ubuntu/',
        configContent: 'deb http://ppa.launchpad.net/elementary-os/stable/ubuntu noble main',
        syncIntervalDays: 7,
      },
    ],
  },
  {
    name: 'Zorin OS',
    version: '17',
    pkgType: 'deb',
    arch: ['x86_64'],
    releaseDate: '2023-12-20',
    eolDate: '2027-06-01',
    repos: [
      {
        name: 'Zorin OS 17 Stable',
        type: 'deb',
        baseUrl: 'http://ppa.launchpad.net/zorinos/stable/ubuntu/',
        configContent: 'deb http://ppa.launchpad.net/zorinos/stable/ubuntu jammy main',
        syncIntervalDays: 7,
      },
    ],
  },
  {
    name: 'Kali Linux',
    version: null,
    pkgType: 'deb',
    arch: arches,
    releaseDate: null,
    eolDate: null,
    repos: [
      {
        name: 'Kali Linux Rolling',
        type: 'deb',
        baseUrl: 'http://http.kali.org/kali/',
        configContent:
          'deb http://http.kali.org/kali kali-rolling main contrib non-free non-free-firmware',
        syncIntervalDays: 7,
      },
    ],
  },
  {
    name: 'Gentoo Linux',
    version: null,
    pkgType: null,
    arch: arches,
    releaseDate: null,
    eolDate: null,
  },
]

export default class DistroSeeder extends BaseSeeder {
  async run() {
    for (const { repos, ...distro } of distros) {
      const record = await Distro.updateOrCreate(
        { name: distro.name, version: distro.version },
        distro as any,
      )

      for (const repo of repos ?? []) {
        await Repo.updateOrCreate(
          { name: repo.name },
          { ...repo, source: 'distro', distroId: record.id },
        )
      }
    }
  }
}
