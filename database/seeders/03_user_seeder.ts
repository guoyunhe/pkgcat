import { BaseSeeder } from '@adonisjs/lucid/seeders'

import type { DistroSelector } from '#database/data/types'
import { UserFactory } from '#database/factories/user_factory'
import Distro from '#models/distro'
import User from '#models/user'

/** Release a user runs, which the seeder of the distributions has to have stored already. */
async function findDistroId({ name, version, arch }: DistroSelector) {
  const query = Distro.query().where('name', name).where('arch', arch)
  if (version === null) {
    query.whereNull('version')
  } else {
    query.where('version', version)
  }

  const distro = await query.first()
  if (!distro) throw new Error(`Unknown release: ${name} ${version ?? '(rolling)'} (${arch})`)
  return distro.id
}

const users = [
  {
    name: 'Test Admin',
    email: 'admin@example.com',
    password: 'Admin123!',
    role: 'admin',
    distro: { name: 'openSUSE Tumbleweed', version: null, arch: 'x86_64' },
  },
  {
    name: 'Test User',
    email: 'user@example.com',
    password: 'User123!',
    role: 'user',
    distro: { name: 'Fedora Linux', version: '43', arch: 'x86_64' },
  },
]

const randomUserCount = 20

/**
 * Releases the generated accounts are spread over, one after the other: the demo users read as a
 * sample of the readers of the catalog, so they do not all run the same distribution.
 */
const randomUserDistros: DistroSelector[] = [
  { name: 'Arch Linux', version: null, arch: 'x86_64' },
  { name: 'Debian', version: '13', arch: 'x86_64' },
  { name: 'Ubuntu', version: '24.04', arch: 'x86_64' },
  { name: 'Fedora Linux', version: '43', arch: 'x86_64' },
  { name: 'Linux Mint', version: '22', arch: 'x86_64' },
  { name: 'openSUSE Tumbleweed', version: null, arch: 'x86_64' },
  { name: 'Manjaro Linux', version: null, arch: 'x86_64' },
  { name: 'Kali Linux', version: null, arch: 'x86_64' },
  { name: 'AlmaLinux', version: '9', arch: 'x86_64' },
  { name: 'Rocky Linux', version: '10', arch: 'x86_64' },
  { name: 'CachyOS', version: null, arch: 'x86_64' },
  { name: 'elementary OS', version: '8', arch: 'x86_64' },
  { name: 'MX Linux', version: '23', arch: 'x86_64' },
  { name: 'Gentoo Linux', version: null, arch: 'x86_64' },
]

export default class UserSeeder extends BaseSeeder {
  /** The demo accounts must never be created on a real deployment. */
  static environment = ['development', 'test']

  async run() {
    for (const { distro, ...user } of users) {
      const distroId = await findDistroId(distro)
      await User.updateOrCreate({ email: user.email }, { ...user, distroId })
    }

    for (let i = 0; i < randomUserCount; i++) {
      const email = `user${String(i + 1).padStart(3, '0')}@example.com`
      const user = await UserFactory.merge({ email }).make()
      const distroId = await findDistroId(randomUserDistros[i % randomUserDistros.length])

      await User.updateOrCreate(
        { email },
        { name: user.name, password: user.password, role: user.role, distroId },
      )
    }
  }
}
