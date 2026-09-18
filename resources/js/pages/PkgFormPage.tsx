import type { Data } from '@generated/data'
import {
  Alert,
  Button,
  Group,
  Loader,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { FloppyDiskIcon } from '@phosphor-icons/react/FloppyDisk'
import { XIcon } from '@phosphor-icons/react/X'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Redirect, useLocation, useRoute, useSearchParams } from 'wouter'

import { useAuth } from '../auth'
import { getApps } from '../services/apps'
import { createPkg, getPkg, updatePkg, type PkgPayload } from '../services/pkgs'
import { localized } from '../utils/appstream'
import { packageTypes } from '../utils/pkgTypes'

import styles from './AppFormPage.module.css'

const checksumTypes = ['sha256', 'sha512', 'sha1', 'md5']

// The API takes the selected applications as flat `appIds` (and not the `apps` the transformer
// returns), because a package may provide several applications.
type PkgFormValues = PkgPayload & { appIds: number[] }

function emptyForm(): PkgFormValues {
  return {
    appIds: [],
    type: 'deb',
    name: '',
    version: '',
    release: '',
    arch: '',
    license: '',
    summary: '',
    description: '',
    downloadUrl: '',
    checksum: '',
    checksumType: 'sha256',
    size: null,
    installCommand: '',
  }
}

export default function PkgFormPage() {
  const { t, i18n } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const [, params] = useRoute('/pkgs/:id/edit')
  const [searchParams] = useSearchParams()
  const pkgId = params?.id ? Number(params.id) : undefined
  const presetAppId = searchParams.get('appId')

  const [apps, setApps] = useState<Data.App[]>([])
  const [loading, setLoading] = useState(Boolean(pkgId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<PkgFormValues>({ initialValues: emptyForm() })

  useEffect(() => {
    getApps('', 1, 50, null, null, 'newest', i18n.language)
      .then((res) => setApps(res.data))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!pkgId) return
    getPkg(pkgId)
      .then((pkg) =>
        form.initialize({
          appIds: pkg.apps.map((app) => app.id),
          type: pkg.type,
          name: pkg.name,
          version: pkg.version ?? '',
          release: pkg.release ?? '',
          arch: pkg.arch ?? '',
          license: pkg.license ?? '',
          summary: pkg.summary ?? '',
          description: pkg.description ?? '',
          downloadUrl: pkg.downloadUrl ?? '',
          checksum: pkg.checksum ?? '',
          checksumType: pkg.checksumType ?? '',
          size: pkg.size,
          installCommand: pkg.installCommand ?? '',
        }),
      )
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : t('common.loadPackagesError')),
      )
      .finally(() => setLoading(false))
  }, [pkgId])

  useEffect(() => {
    if (pkgId || !presetAppId) return
    const id = Number(presetAppId)
    if (Number.isInteger(id) && id > 0) form.setFieldValue('appIds', [id])
  }, [pkgId, presetAppId])

  const appOptions = useMemo(
    () =>
      apps.map((app) => ({
        value: String(app.id),
        label: localized(app.name, i18n.language) ?? String(app.id),
      })),
    [apps, i18n.language],
  )

  if (!ready)
    return (
      <div className={styles.loading}>
        <Loader color='orange' />
      </div>
    )
  if (!user) return <Redirect to='/login' />
  if (user.role !== 'admin') return <Redirect to='/pkgs' />
  if (loading)
    return (
      <div className={styles.loading}>
        <Loader color='orange' />
      </div>
    )

  async function handleSubmit(values: PkgFormValues) {
    try {
      setSaving(true)
      setError(null)
      if (pkgId) await updatePkg(pkgId, values)
      else await createPkg(values)
      navigate('/pkgs')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('packages.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>{t('common.packages')}</Text>
          <Title order={1}>{pkgId ? t('common.edit') : t('common.add')}</Title>
        </div>
        <Button
          leftSection={<XIcon size={18} />}
          variant='default'
          onClick={() => navigate('/pkgs')}
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
          <MultiSelect
            label={t('common.apps')}
            clearable
            searchable
            data={appOptions}
            value={form.values.appIds.map(String)}
            onChange={(values) => form.setFieldValue('appIds', values.map(Number))}
            error={form.errors.appIds}
          />
          <Select
            label={t('common.packageFormat')}
            required
            allowDeselect={false}
            data={packageTypes}
            {...form.getInputProps('type')}
          />
          <TextInput label={t('common.name')} required {...form.getInputProps('name')} />
          <TextInput label={t('common.version')} {...form.getInputProps('version')} />
          <TextInput label={t('packages.fields.release')} {...form.getInputProps('release')} />
          <TextInput label={t('common.architecture')} {...form.getInputProps('arch')} />
          <TextInput label={t('common.license')} {...form.getInputProps('license')} />
          <TextInput label={t('common.summary')} {...form.getInputProps('summary')} />
          <Textarea
            autosize
            label={t('packages.fields.description')}
            minRows={3}
            {...form.getInputProps('description')}
          />
          <TextInput
            label={t('packages.fields.downloadUrl')}
            {...form.getInputProps('downloadUrl')}
          />
          <TextInput label={t('packages.fields.checksum')} {...form.getInputProps('checksum')} />
          <Select
            label={t('packages.fields.checksumType')}
            clearable
            data={checksumTypes}
            value={form.values.checksumType || null}
            onChange={(value) => form.setFieldValue('checksumType', value ?? '')}
            error={form.errors.checksumType}
          />
          <NumberInput
            label={t('packages.fields.size')}
            min={0}
            value={form.values.size ?? ''}
            onChange={(value) => form.setFieldValue('size', value === '' ? null : Number(value))}
            error={form.errors.size}
          />
          <TextInput
            label={t('packages.fields.installCommand')}
            {...form.getInputProps('installCommand')}
          />
          <Group justify='flex-end'>
            <Button type='submit' leftSection={<FloppyDiskIcon size={18} />} loading={saving}>
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </form>
    </main>
  )
}
