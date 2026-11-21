/**
 * Architectures the catalog supports, named the way RPM names them. The RPM name is what a
 * distribution and a package are stored with, whatever package format they were read from; only a
 * distribution of one of these is seeded and accepted by the API. The first entry is the
 * architecture a deb repository that names none is read for.
 */
export const supportedArches = ['x86_64', 'aarch64'] as const

/**
 * Names Debian and its derivatives spell an architecture with, mapped to the RPM name. Only the
 * names that differ have to be listed, as `s390x` and `riscv64` are spelled the same in both, and
 * the `all` of a package that carries no machine code is stored as the `noarch` of the catalog.
 */
export const debArches: Record<string, string> = {
  all: 'noarch',
  amd64: 'x86_64',
  arm64: 'aarch64',
  armhf: 'armv7hl',
  i386: 'i686',
  ppc64el: 'ppc64le',
}

/**
 * Names pacman spells an architecture with, mapped to the RPM name. Arch Linux and CachyOS build
 * their packages for a machine level of x86-64 (`x86_64_v3`), which the catalog stores as the
 * architecture the distribution is published for. The plain names are kept beside them, so that a
 * mirrorlist that names `$arch` is expanded with the architecture itself rather than a machine
 * level, and `any` is the pacman name for `noarch`.
 */
export const pacmanArchs: Record<string, string> = {
  any: 'noarch',
  aarch64: 'aarch64',
  armv6h: 'armv6hl',
  armv7h: 'armv7hl',
  x86_64: 'x86_64',
  x86_64_v2: 'x86_64',
  x86_64_v3: 'x86_64',
  x86_64_v4: 'x86_64',
}
