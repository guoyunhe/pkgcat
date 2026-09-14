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
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Redirect, useLocation, useRoute } from 'wouter'

import { useAuth } from '../auth'
import { distroLabel, getDistros } from '../services/distros'
import { createRepo, getRepo, updateRepo, type RepoPayload } from '../services/repos'

import styles from './AppFormPage.module.css'

export default function RepoFormPage() {
  const { t } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const [, params] = useRoute('/repos/:id/edit')
  const repoId = params?.id ? Number(params.id) : undefined

  const [distros, setDistros] = useState<Data.Distro[]>([])
  const [loading, setLoading] = useState(Boolean(repoId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<RepoPayload>({
    initialValues: {
      type: 'deb',
      source: 'community',
      name: '',
      baseUrl: '',
      configUrl: '',
      configContent: '',
      installScript: '',
      syncIntervalDays: null,
      distroIds: [],
    },
  })

  useEffect(() => {
    getDistros()
      .then(setDistros)
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!repoId) return
    getRepo(repoId)
      .then((repo) => {
        form.setValues({
          type: repo.type,
          source: repo.source,
          name: repo.name,
          baseUrl: repo.baseUrl,
          configUrl: repo.configUrl ?? '',
          configContent: repo.configContent ?? '',
          installScript: repo.installScript ?? '',
          syncIntervalDays: repo.syncIntervalDays,
          distroIds: repo.distros.map((distro) => distro.id),
        })
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : t('repos.loadError')))
      .finally(() => setLoading(false))
  }, [repoId])

  if (!ready)
    return (
      <div className={styles.loading}>
        <Loader color='orange' />
      </div>
    )
  if (!user) return <Redirect to='/login' />
  if (user.role !== 'admin') return <Redirect to='/repos' />
  if (loading)
    return (
      <div className={styles.loading}>
        <Loader color='orange' />
      </div>
    )

  async function handleSubmit(values: RepoPayload) {
    try {
      setSaving(true)
      setError(null)
      if (repoId) await updateRepo(repoId, values)
      else await createRepo(values)
      navigate('/repos')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('repos.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>
            {repoId ? t('repos.editEntry') : t('repos.newEntry')}
          </Text>
          <Title order={1}>{repoId ? t('repos.editRepo') : t('repos.addRepo')}</Title>
        </div>
        <Button
          leftSection={<XIcon size={18} />}
          variant='default'
          onClick={() => navigate('/repos')}
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
          <Select
            label={t('repos.fields.type')}
            required
            allowDeselect={false}
            data={[
              { value: 'deb', label: 'DEB (Debian/Ubuntu)' },
              { value: 'rpm', label: 'RPM (RHEL/openSUSE/Fedora)' },
              { value: 'flatpak', label: 'Flatpak' },
              { value: 'snap', label: 'Snap' },
            ]}
            {...form.getInputProps('type')}
          />

          <TextInput label={t('repos.fields.name')} required {...form.getInputProps('name')} />

          <TextInput
            label={t('repos.fields.baseUrl')}
            required
            placeholder='https://deb.debian.org/debian/'
            {...form.getInputProps('baseUrl')}
          />

          <Select
            label={t('repos.fields.source')}
            required
            allowDeselect={false}
            data={[
              { value: 'distro', label: t('repos.sources.distro') },
              { value: 'community', label: t('repos.sources.community') },
            ]}
            {...form.getInputProps('source')}
          />

          <MultiSelect
            clearable
            data={distros.map((distro) => ({
              value: String(distro.id),
              label: distroLabel(distro),
            }))}
            description={t('repos.fields.distrosHint')}
            label={t('repos.fields.distros')}
            searchable
            value={(form.values.distroIds ?? []).map(String)}
            onChange={(values) => form.setFieldValue('distroIds', values.map(Number))}
            error={form.errors.distroIds}
          />

          <Textarea
            autosize
            label={t('repos.fields.configUrl')}
            maxRows={6}
            minRows={2}
            {...form.getInputProps('configUrl')}
          />

          <Textarea
            autosize
            label={t('repos.fields.configContent')}
            maxRows={12}
            minRows={2}
            {...form.getInputProps('configContent')}
          />

          <Textarea
            autosize
            description={t('repos.installScriptHint')}
            label={t('repos.fields.installScript')}
            maxRows={6}
            minRows={2}
            {...form.getInputProps('installScript')}
          />

          <NumberInput
            description={t('repos.syncIntervalHint')}
            label={t('repos.fields.syncIntervalDays')}
            min={0}
            {...form.getInputProps('syncIntervalDays')}
          />

          <Group justify='flex-end'>
            <Button type='submit' leftSection={<FloppyDiskIcon size={18} />} loading={saving}>
              {t('repos.save')}
            </Button>
          </Group>
        </Stack>
      </form>
    </main>
  )
}
