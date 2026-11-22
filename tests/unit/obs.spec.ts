import { test } from '@japa/runner'

import {
  ignoredObsProject,
  obsRepositoryName,
  obsRepositoryProject,
} from '#services/obs_repositories'

test.group('Projects of the build service an import leaves out', () => {
  test('leaves out the openQA projects of devel', ({ assert }) => {
    assert.isTrue(ignoredObsProject('devel:openQA'))
    assert.isTrue(ignoredObsProject('devel:openQA:ci'))
    assert.isTrue(ignoredObsProject('devel:openQA:GitHub:os-autoinst:openQA:PR-5165'))
  })

  test('leaves out the namespaces whose projects build the releases', ({ assert }) => {
    assert.isTrue(ignoredObsProject('openSUSE:Factory'))
    assert.isTrue(ignoredObsProject('Debian:12'))
    assert.isTrue(ignoredObsProject('Arch:extra'))
    // A namespace itself is not a project the build service publishes from
    assert.isFalse(ignoredObsProject('openSUSE'))
  })

  test('takes the projects of the other namespaces', ({ assert }) => {
    assert.isFalse(ignoredObsProject('home:guoyunhe'))
    assert.isFalse(ignoredObsProject('isv:onlyoffice'))
    assert.isFalse(ignoredObsProject('devel:tools'))
  })
})

test.group('Name a repository of the build service is stored under', () => {
  test('names the project and the repository it publishes', ({ assert }) => {
    const name = obsRepositoryName({
      project: 'devel:openQA:ci',
      repository: 'openSUSE_Tumbleweed',
    })

    assert.equal(name, '[OBS] devel:openQA:ci (openSUSE_Tumbleweed)')
    assert.equal(obsRepositoryProject(name), 'devel:openQA:ci')
  })

  test('reads no project from a name the import did not write', ({ assert }) => {
    assert.isNull(obsRepositoryProject('openSUSE Tumbleweed (OSS)'))
    assert.isNull(obsRepositoryProject('[OBS] devel:openQA'))
  })
})
