import { test } from '@japa/runner'

import {
  archIndependentPackageArch,
  isSupportedArch,
  legacyArchIndependentArches,
  toCatalogArch,
  toFormatArch,
} from '#utils/arch'

test.group('Architecture of a package in the catalog', () => {
  test('maps the name a package format spells to the RPM name', ({ assert }) => {
    assert.equal(toCatalogArch('amd64', 'deb'), 'x86_64')
    assert.equal(toCatalogArch('arm64', 'deb'), 'aarch64')
    assert.equal(toCatalogArch('x86_64_v3', 'pacman'), 'x86_64')
  })

  test('stores a machine-independent package as noarch', ({ assert }) => {
    assert.equal(toCatalogArch('all', 'deb'), archIndependentPackageArch)
    assert.equal(toCatalogArch('any', 'pacman'), archIndependentPackageArch)
    // The cleanup command keeps these spellings, so they have to stay the names the formats write
    assert.deepEqual(legacyArchIndependentArches, ['all', 'any'])
  })

  test('keeps a name the catalog does not map', ({ assert }) => {
    assert.equal(toCatalogArch('riscv64', 'deb'), 'riscv64')
    assert.equal(toCatalogArch(null, 'deb'), null)
  })

  test('names an architecture of the catalog the way a repository URL expects it', ({ assert }) => {
    assert.equal(toFormatArch('x86_64', 'deb'), 'amd64')
    assert.equal(toFormatArch('aarch64', 'deb'), 'arm64')
    assert.equal(toFormatArch('aarch64', 'pacman'), 'aarch64')
    assert.equal(toFormatArch('x86_64', 'pacman'), 'x86_64')
  })

  test('only supports the architectures of the configuration', ({ assert }) => {
    assert.isTrue(isSupportedArch('x86_64'))
    assert.isTrue(isSupportedArch('aarch64'))
    assert.isTrue(isSupportedArch('noarch'))
    assert.isFalse(isSupportedArch('ppc64le'))
    assert.isFalse(isSupportedArch('s390x'))
  })
})
