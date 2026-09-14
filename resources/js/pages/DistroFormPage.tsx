import {
  Alert,
  Autocomplete,
  Button,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { FloppyDiskIcon } from '@phosphor-icons/react/FloppyDisk'
import { XIcon } from '@phosphor-icons/react/X'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Redirect, useLocation, useRoute } from 'wouter'

import { useAuth } from '../auth'
import {
  createDistro,
  distroLabel,
  getDistro,
  getDistros,
  updateDistro,
  type Distro,
} from '../services/distros'
import { packageTypes } from '../utils/pkgTypes'

import styles from './AppFormPage.module.css'

/** Architecture names follow `uname -m`, the same vocabulary used by the package extractors. */
const commonArchs = ['x86_64', 'aarch64', 'i686', 'armv7hl', 'riscv64', 'ppc64le', 's390x']

type DistroFormValues = {
  name: string
  version: string
  pkgType: string | null
  arch: string
  // The release the entry is compatible with, as the id the select carries
  compatibleDistroId: string | null
  releaseDate: string
  eolDate: string
}

/** `<input type="date">` only accepts `YYYY-MM-DD`, while the API may return a full ISO string. */
function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : ''
}

export default function DistroFormPage() {
  const { t } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const [, params] = useRoute('/distros/:id/edit')
  const distroId = params?.id ? Number(params.id) : undefined

  const [loading, setLoading] = useState(Boolean(distroId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Every entry of the catalog may be the release this one is compatible with, so the form offers
  // them all and leaves out the entry being edited
  const [distros, setDistros] = useState<Distro[]>([])

  const form = useForm<DistroFormValues>({
    initialValues: {
      name: '',
      version: '',
      pkgType: null,
      arch: '',
      compatibleDistroId: null,
      releaseDate: '',
      eolDate: '',
    },
  })

  useEffect(() => {
    if (!distroId) return
    getDistro(distroId)
      .then((distro) => {
        form.setValues({
          name: distro.name,
          version: distro.version ?? '',
          pkgType: distro.pkgType,
          arch: distro.arch,
          compatibleDistroId: distro.compatibleDistro ? String(distro.compatibleDistro.id) : null,
          releaseDate: toDateInput(distro.releaseDate),
          eolDate: toDateInput(distro.eolDate),
        })
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : t('distros.loadError')),
      )
      .finally(() => setLoading(false))
  }, [distroId])

  useEffect(() => {
    let active = true
    getDistros()
      .then((result) => {
        if (active) setDistros(result)
      })
      .catch(() => {
        // Without the options the compatibility stays empty, which is the same as naming nothing
      })
    return () => {
      active = false
    }
  }, [])

  if (!ready)
    return (
      <div className={styles.loading}>
        <Loader color='orange' />
      </div>
    )
  if (!user) return <Redirect to='/login' />
  if (user.role !== 'admin') return <Redirect to='/distros' />
  if (loading)
    return (
      <div className={styles.loading}>
        <Loader color='orange' />
      </div>
    )

  const compatibleOptions = distros
    .filter((distro) => distro.id !== distroId)
    .map((distro) => ({ value: String(distro.id), label: distroLabel(distro) }))

  async function handleSubmit(values: DistroFormValues) {
    try {
      setSaving(true)
      setError(null)
      const payload = {
        name: values.name,
        version: values.version || null,
        pkgType: values.pkgType,
        arch: values.arch,
        compatibleDistroId: values.compatibleDistroId ? Number(values.compatibleDistroId) : null,
        releaseDate: values.releaseDate || null,
        eolDate: values.eolDate || null,
      }
      if (distroId) await updateDistro(distroId, payload)
      else await createDistro(payload)
      navigate('/distros')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('distros.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>
            {distroId ? t('distros.editEntry') : t('distros.newEntry')}
          </Text>
          <Title order={1}>{distroId ? t('distros.editDistro') : t('distros.addDistro')}</Title>
        </div>
        <Button
          leftSection={<XIcon size={18} />}
          variant='default'
          onClick={() => navigate('/distros')}
        >
          {t('common.cancel')}
        </Button>
      </header>

      {error && (
        <Alert color='red' mb='lg'>
          {error}
        </Alert>
      )}

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack className={styles.form}>
          <TextInput
            label={t('distros.fields.name')}
            placeholder='Ubuntu'
            required
            {...form.getInputProps('name')}
          />

          <TextInput
            description={t('distros.fields.versionHint')}
            label={t('distros.fields.version')}
            placeholder='24.04'
            {...form.getInputProps('version')}
          />

          <Select
            label={t('distros.fields.pkgType')}
            clearable
            data={packageTypes}
            description={t('distros.fields.pkgTypeHint')}
            {...form.getInputProps('pkgType')}
          />

          <Autocomplete
            data={commonArchs}
            description={t('distros.fields.archHint')}
            label={t('distros.fields.arch')}
            placeholder='x86_64'
            required
            {...form.getInputProps('arch')}
          />

          <Select
            clearable
            data={compatibleOptions}
            description={t('distros.fields.compatibleDistroHint')}
            label={t('distros.fields.compatibleDistro')}
            searchable
            {...form.getInputProps('compatibleDistroId')}
          />

          <TextInput
            label={t('distros.fields.releaseDate')}
            type='date'
            {...form.getInputProps('releaseDate')}
          />

          <TextInput
            label={t('distros.fields.eolDate')}
            type='date'
            {...form.getInputProps('eolDate')}
          />

          <Group justify='flex-end'>
            <Button type='submit' leftSection={<FloppyDiskIcon size={18} />} loading={saving}>
              {t('distros.save')}
            </Button>
          </Group>
        </Stack>
      </form>
    </main>
  )
}
