import type { Data } from '@generated/data'
import {
  Alert,
  Button,
  Container,
  Group,
  Input,
  Loader,
  Select,
  Stack,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { ArrowsClockwiseIcon } from '@phosphor-icons/react/ArrowsClockwise'
import { FileArrowUpIcon } from '@phosphor-icons/react/FileArrowUp'
import { FloppyDiskIcon } from '@phosphor-icons/react/FloppyDisk'
import { MagicWandIcon } from '@phosphor-icons/react/MagicWand'
import { XIcon } from '@phosphor-icons/react/X'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Redirect, useLocation, useParams } from 'wouter'

import { useAuth } from '../auth'
import AppTypeSelect from '../components/AppTypeSelect'
import ImageUpload from '../components/ImageUpload'
import {
  createApp,
  fetchAppStreamContent,
  getApp,
  getAppStreamFields,
  updateApp,
  type AppPayload,
} from '../services/apps'
import { getErrorMessage } from '../services/errors'
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
  const { t } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const { id } = useParams()
  const appId = Number(id)
  const [form, setForm] = useState<AppPayload>(() => emptyForm(defaultLanguage()))
  const [iconUrl, setIconUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(appId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The AppStream URL is read, a metadata file is imported, and the metadata is filled into the
  // form: each of the three runs on its own, so that one failing does not block the others
  const [syncing, setSyncing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [filling, setFilling] = useState(false)
  const [appstreamError, setAppstreamError] = useState<string | null>(null)
  const appstreamFile = useRef<HTMLInputElement>(null)
  // Localized text is edited one language at a time. The form owns its language selector and opens
  // on the language the catalog falls back to, which is the one metadata is written in; the editor
  // switches to another language of its own.
  const [chosenLanguage, setChosenLanguage] = useState<string | null>(null)
  const usedLanguages = useMemo(
    () => [...new Set([...Object.keys(form.name), ...Object.keys(form.summary)])],
    [form.name, form.summary],
  )
  const languages = useMemo(() => languageOptions(usedLanguages), [usedLanguages])
  const editingLanguage =
    chosenLanguage && languages.some((option) => option.value === chosenLanguage)
      ? chosenLanguage
      : defaultLanguage()
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

  /** Read the metadata the AppStream URL publishes, replacing the content the editor holds. */
  async function syncAppStream() {
    const url = form.appstreamUrl?.trim()
    if (!url) return

    try {
      setSyncing(true)
      setAppstreamError(null)
      const content = await fetchAppStreamContent(url)
      setForm((current) => ({ ...current, appstreamContent: content }))
    } catch (reason) {
      setAppstreamError(getErrorMessage(reason))
    } finally {
      setSyncing(false)
    }
  }

  /** Read a metadata file of the editor's own machine, which it may have downloaded elsewhere. */
  async function importAppStreamFile(file: File) {
    try {
      setImporting(true)
      setAppstreamError(null)
      const content = await file.text()
      setForm((current) => ({ ...current, appstreamContent: content }))
    } catch {
      setAppstreamError(t('form.appstreamImportError'))
    } finally {
      setImporting(false)
    }
  }

  /**
   * Fill the form with what the metadata declares. Only the fields the metadata speaks about are
   * written, so an application that carries something the metadata does not mention keeps it, and
   * the name and the summary arrive in every language the metadata translates them into.
   */
  async function fillFromAppStream() {
    const content = form.appstreamContent?.trim()
    if (!content) return

    try {
      setFilling(true)
      setAppstreamError(null)
      const fields = await getAppStreamFields(content)
      setForm((current) => ({
        ...current,
        name: { ...current.name, ...fields.name },
        summary: { ...current.summary, ...fields.summary },
        type: fields.type,
        version: fields.version ?? current.version,
        license: fields.license ?? current.license,
        homepage: fields.homepage ?? current.homepage,
        appstreamId: fields.appstreamId ?? current.appstreamId,
      }))
    } catch (reason) {
      setAppstreamError(getErrorMessage(reason))
    } finally {
      setFilling(false)
    }
  }

  return (
    <Container component='main' py={{ base: 44, xs: 72 }} size='sm'>
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
        {/* The AppStream metadata is where an application comes from, so the editor reads it
            first and writes the rest of the form out of it */}
        <Group align='flex-end' gap='sm' wrap='nowrap'>
          <TextInput
            className={styles.field}
            label={t('form.appstreamUrl')}
            onChange={(event) => setForm({ ...form, appstreamUrl: event.currentTarget.value })}
            value={form.appstreamUrl ?? ''}
          />
          <Button
            disabled={!form.appstreamUrl?.trim()}
            leftSection={<ArrowsClockwiseIcon size={18} />}
            loading={syncing}
            onClick={() => void syncAppStream()}
            variant='default'
          >
            {t('form.appstreamSync')}
          </Button>
        </Group>
        <Input.Wrapper
          description={t('form.appstreamContentHint')}
          label={
            <Group gap='xs' justify='space-between' wrap='nowrap'>
              <Text fw={500} size='sm'>
                {t('form.appstreamContent')}
              </Text>
              <Group gap='xs'>
                <Button
                  leftSection={<FileArrowUpIcon size={16} />}
                  loading={importing}
                  onClick={() => appstreamFile.current?.click()}
                  size='compact-sm'
                  variant='light'
                >
                  {t('form.appstreamImport')}
                </Button>
                <Button
                  disabled={!form.appstreamContent?.trim()}
                  leftSection={<MagicWandIcon size={16} />}
                  loading={filling}
                  onClick={() => void fillFromAppStream()}
                  size='compact-sm'
                  variant='light'
                >
                  {t('form.appstreamFill')}
                </Button>
              </Group>
            </Group>
          }
          labelElement='div'
        >
          <Textarea
            aria-label={t('form.appstreamContent')}
            autosize
            maxRows={12}
            minRows={4}
            onChange={(event) => setForm({ ...form, appstreamContent: event.currentTarget.value })}
            value={form.appstreamContent ?? ''}
          />
        </Input.Wrapper>
        <input
          accept='.xml,.metainfo,.appdata,application/xml,text/xml'
          hidden
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            event.currentTarget.value = ''
            if (file) void importAppStreamFile(file)
          }}
          ref={appstreamFile}
          type='file'
        />
        {appstreamError && <Alert color='red'>{appstreamError}</Alert>}
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
    </Container>
  )
}
