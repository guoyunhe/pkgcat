import { BaseSeeder } from '@adonisjs/lucid/seeders'

import Distro from '#models/distro'

/** Architecture names follow `uname -m`, the same vocabulary used by the package extractors. */
const arches = ['x86_64', 'aarch64']

/**
 * Release and end-of-support dates follow [https://endoflife.date](https://endoflife.date) (`eol`),
 * except for the distributions that it does not track, which use the support statement of their
 * vendor. Rolling release distributions have no end of support, so they keep a `null` `eolDate`.
 */
const distros = [
  {
    name: 'Ubuntu',
    version: '24.04',
    pkgType: 'deb',
    arch: arches,
    releaseDate: '2024-04-25',
    eolDate: '2029-05-31',
  },
  {
    name: 'Debian',
    version: '13',
    pkgType: 'deb',
    arch: arches,
    releaseDate: '2025-08-09',
    eolDate: '2030-06-30',
  },
  {
    name: 'Fedora Linux',
    version: '42',
    pkgType: 'rpm',
    arch: arches,
    releaseDate: '2025-04-15',
    eolDate: '2026-05-27',
  },
  {
    name: 'Fedora Linux',
    version: '43',
    pkgType: 'rpm',
    arch: arches,
    releaseDate: '2025-10-28',
    eolDate: '2026-12-09',
  },
  {
    name: 'Fedora Linux',
    version: '44',
    pkgType: 'rpm',
    arch: arches,
    releaseDate: '2026-04-28',
    eolDate: '2027-06-02',
  },
  {
    name: 'Linux Mint',
    version: '22',
    pkgType: 'deb',
    arch: ['x86_64'],
    releaseDate: '2024-07-25',
    eolDate: '2029-04-01',
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
  },
  {
    name: 'AlmaLinux',
    version: '9',
    pkgType: 'rpm',
    arch: arches,
    releaseDate: '2022-05-26',
    eolDate: '2032-05-31',
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
  },
  {
    name: 'openSUSE Tumbleweed',
    version: null,
    pkgType: 'rpm',
    arch: arches,
    releaseDate: null,
    eolDate: null,
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
  },
  {
    name: 'elementary OS',
    version: '8',
    pkgType: 'deb',
    arch: arches,
    releaseDate: '2024-11-26',
    eolDate: '2029-05-31',
  },
  {
    name: 'Zorin OS',
    version: '17',
    pkgType: 'deb',
    arch: ['x86_64'],
    releaseDate: '2023-12-20',
    eolDate: '2027-06-01',
  },
  {
    name: 'Kali Linux',
    version: null,
    pkgType: 'deb',
    arch: arches,
    releaseDate: null,
    eolDate: null,
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
    for (const distro of distros) {
      await Distro.updateOrCreate({ name: distro.name, version: distro.version }, distro as any)
    }
  }
}
