import type { Data } from '@generated/data'
import {
  Alert,
  Button,
  Group,
  Loader,
  Select,
  Stack,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { FloppyDiskIcon } from '@phosphor-icons/react/FloppyDisk'
import { XIcon } from '@phosphor-icons/react/X'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Redirect, useLocation, useRoute } from 'wouter'

import { useAuth } from '../auth'
import AppTypeSelect from '../components/AppTypeSelect'
import ImageUpload from '../components/ImageUpload'
import { createApp, getApp, updateApp, type AppPayload } from '../services/apps'
import { defaultLanguage, languageOptions } from '../utils/languages'
import { formatPkgNameMapping, parsePkgNameMapping } from '../utils/pkgNames'

import styles from './AppFormPage.module.css'

function emptyForm(language: string): AppPayload {
  return {
    name: { [language]: '' },
    summary: { [language]: '' },
    type: 'desktop-application',
    version: '',
    license: '',
    homepage: '',
    appstreamId: '',
    appstreamIdAliases: [],
    pkgNames: [],
    appstreamUrl: '',
    appstreamContent: '',
    desktopUrl: '',
    desktopContent: '',
    iconId: null,
  }
}

function formFromApp(app: Data.App): AppPayload {
  return {
    name: app.name,
    summary: app.summary,
    type: app.type,
    version: app.version ?? '',
    license: app.license ?? '',
    homepage: app.homepage ?? '',
    appstreamId: app.appstreamId ?? '',
    appstreamIdAliases: app.appstreamIdAliases,
    pkgNames: app.pkgNames,
    appstreamUrl: app.appstreamUrl ?? '',
    appstreamContent: app.appstreamContent ?? '',
    desktopUrl: app.desktopUrl ?? '',
    desktopContent: app.desktopContent ?? '',
    iconId: app.iconId,
  }
}

export default function AppFormPage() {
  const { t, i18n } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const [, params] = useRoute('/apps/:id/edit')
  const appId = params?.id ? Number(params.id) : undefined
  const [form, setForm] = useState<AppPayload>(() => emptyForm(defaultLanguage([], i18n.language)))
  const [iconUrl, setIconUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(appId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Localized text is edited one language at a time. The form owns its language selector, so the
  // interface language only decides which language the form starts with.
  const [chosenLanguage, setChosenLanguage] = useState<string | null>(null)
  const usedLanguages = useMemo(
    () => [...new Set([...Object.keys(form.name), ...Object.keys(form.summary)])],
    [form.name, form.summary],
  )
  const languages = useMemo(() => languageOptions(usedLanguages), [usedLanguages])
  const editingLanguage =
    chosenLanguage && languages.some((option) => option.value === chosenLanguage)
      ? chosenLanguage
      : defaultLanguage(usedLanguages, i18n.language)
  const nameMissing = !Object.values(form.name).some((value) => value?.trim())
  const summaryMissing = !Object.values(form.summary).some((value) => value?.trim())

  useEffect(() => {
    if (!appId) return
    getApp(appId)
      .then((app) => {
        setForm(formFromApp(app))
        setIconUrl(app.icon?.url ?? null)
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : t('common.loadAppError')),
      )
      .finally(() => setLoading(false))
  }, [appId])

  if (!ready)
    return (
      <div className={styles.loading}>
        <Loader color='orange' />
      </div>
    )
  if (!user) return <Redirect to='/login' />
  if (user.role !== 'admin') return <Redirect to='/apps' />
  if (loading)
    return (
      <div className={styles.loading}>
        <Loader color='orange' />
      </div>
    )

  async function save() {
    try {
      setSaving(true)
      if (appId) await updateApp(appId, form)
      else await createApp(form)
      navigate('/apps')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('form.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Text className={styles.eyebrow}>{t('common.apps')}</Text>
          <Title order={1}>{appId ? t('common.edit') : t('common.add')}</Title>
        </div>
        <Button
          leftSection={<XIcon size={18} />}
          variant='default'
          onClick={() => navigate('/apps')}
        >
          {t('common.cancel')}
        </Button>
      </header>
      {error && (
        <Alert color='red' mb='lg'>
          {error}
        </Alert>
      )}
      <Stack className={styles.form}>
        <ImageUpload
          acceptLabel={t('form.iconAccept')}
          dropLabel={t('form.iconDrop')}
          errorLabel={t('form.iconUploadError')}
          formats={['svg', 'png']}
          hint={t('form.iconHint')}
          label={t('form.icon')}
          onChange={(iconId) => setForm((current) => ({ ...current, iconId }))}
          previewUrl={iconUrl}
          rejectLabel={t('form.iconRejected')}
          removeLabel={t('form.iconRemove')}
          value={form.iconId ?? null}
        />
        <Select
          allowDeselect={false}
          data={languages}
          label={t('form.editingLanguage')}
          maw={280}
          searchable
          value={editingLanguage}
          onChange={(value) => setChosenLanguage(value)}
        />
        <TextInput
          label={t('common.name')}
          value={form.name[editingLanguage] ?? ''}
          onChange={(event) =>
            setForm({
              ...form,
              name: { ...form.name, [editingLanguage]: event.currentTarget.value },
            })
          }
        />
        <TextInput
          label={t('common.summary')}
          value={form.summary[editingLanguage] ?? ''}
          onChange={(event) =>
            setForm({
              ...form,
              summary: { ...form.summary, [editingLanguage]: event.currentTarget.value },
            })
          }
        />
        {(nameMissing || summaryMissing) && (
          <Alert color='yellow'>{t('form.localizedRequired')}</Alert>
        )}
        <AppTypeSelect
          value={form.type}
          onChange={(value) => setForm({ ...form, type: value ?? form.type })}
        />
        <TextInput
          label={t('common.version')}
          value={form.version ?? ''}
          onChange={(event) => setForm({ ...form, version: event.currentTarget.value })}
        />
        <TextInput
          label={t('common.license')}
          value={form.license ?? ''}
          onChange={(event) => setForm({ ...form, license: event.currentTarget.value })}
        />
        <TextInput
          label={t('common.homepage')}
          value={form.homepage ?? ''}
          onChange={(event) => setForm({ ...form, homepage: event.currentTarget.value })}
        />
        <TextInput
          label={t('common.appstreamId')}
          value={form.appstreamId ?? ''}
          onChange={(event) => setForm({ ...form, appstreamId: event.currentTarget.value })}
        />
        <TagsInput
          description={t('form.appstreamIdAliasesHint')}
          label={t('common.appstreamIdAliases')}
          value={form.appstreamIdAliases ?? []}
          onChange={(aliases) => setForm({ ...form, appstreamIdAliases: aliases })}
        />
        <TagsInput
          description={t('form.pkgNamesHint')}
          label={t('common.pkgNames')}
          value={(form.pkgNames ?? []).map(formatPkgNameMapping)}
          onChange={(tags) => setForm({ ...form, pkgNames: tags.map(parsePkgNameMapping) })}
        />
        <TextInput
          label={t('form.appstreamUrl')}
          value={form.appstreamUrl ?? ''}
          onChange={(event) => setForm({ ...form, appstreamUrl: event.currentTarget.value })}
        />
        <Textarea
          autosize
          description={t('form.appstreamContentHint')}
          label={t('form.appstreamContent')}
          maxRows={12}
          minRows={4}
          value={form.appstreamContent ?? ''}
          onChange={(event) => setForm({ ...form, appstreamContent: event.currentTarget.value })}
        />
        <TextInput
          label={t('form.desktopUrl')}
          value={form.desktopUrl ?? ''}
          onChange={(event) => setForm({ ...form, desktopUrl: event.currentTarget.value })}
        />
        <Textarea
          autosize
          description={t('form.desktopContentHint')}
          label={t('common.desktopEntry')}
          maxRows={12}
          minRows={4}
          value={form.desktopContent ?? ''}
          onChange={(event) => setForm({ ...form, desktopContent: event.currentTarget.value })}
        />
        <Group justify='flex-end'>
          <Button
            leftSection={<FloppyDiskIcon size={18} />}
            loading={saving}
            onClick={() => void save()}
          >
            {t('common.save')}
          </Button>
        </Group>
      </Stack>
    </main>
  )
}
