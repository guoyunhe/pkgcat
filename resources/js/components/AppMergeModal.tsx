import type { Data } from '@generated/data'
import { Alert, Button, Group, Loader, Modal, Select, Stack, Text } from '@mantine/core'
import { ArrowsMergeIcon } from '@phosphor-icons/react/ArrowsMerge'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getApps, mergeApp } from '../services/apps'
import { localized } from '../utils/appstream'

type AppMergeModalProps = {
  /** Application the others are folded into. */
  app: Data.App
  /** Called with the application after the merge, which answers to the merged AppStream IDs. */
  onMerged: (app: Data.App) => void
}

/**
 * Administration action that folds another catalog entry of the same application into this one.
 * Repositories name an application with different AppStream IDs over time, and each spelling is
 * imported on its own; merging registers the IDs of the merged entry as aliases of this one, so
 * that the next synchronization links its packages here instead of recreating the entry.
 */
export default function AppMergeModal({ app, onMerged }: AppMergeModalProps) {
  const { t, i18n } = useTranslation()
  const [opened, setOpened] = useState(false)
  const [query, setQuery] = useState('')
  const [candidates, setCandidates] = useState<Data.App[]>([])
  const [sourceId, setSourceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [merging, setMerging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!opened) return

    let cancelled = false
    setLoading(true)
    setError(null)
    getApps(query, 1, 20)
      .then(({ data }) => {
        if (!cancelled) setCandidates(data.filter((candidate) => candidate.id !== app.id))
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : t('merge.loadError'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [opened, query, app.id])

  function reset() {
    setQuery('')
    setSourceId(null)
    setError(null)
  }

  function close() {
    if (merging) return
    setOpened(false)
    reset()
  }

  async function merge() {
    if (!sourceId) return

    try {
      setMerging(true)
      setError(null)
      const merged = await mergeApp(app.id, Number(sourceId))
      setMerging(false)
      setOpened(false)
      reset()
      onMerged(merged)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('merge.error'))
    } finally {
      setMerging(false)
    }
  }

  const options = candidates.map((candidate) => ({
    value: String(candidate.id),
    label: [localized(candidate.name, i18n.language), candidate.appstreamId]
      .filter(Boolean)
      .join(' · '),
  }))

  return (
    <>
      <Button
        leftSection={<ArrowsMergeIcon size={18} />}
        variant='default'
        onClick={() => setOpened(true)}
      >
        {t('merge.action')}
      </Button>
      <Modal opened={opened} onClose={close} title={t('merge.title')}>
        <Stack gap='md'>
          <Text size='sm'>
            {t('merge.description', { name: localized(app.name, i18n.language) })}
          </Text>
          <Select
            clearable
            data={options}
            label={t('merge.select')}
            nothingFoundMessage={t('merge.notFound')}
            placeholder={t('merge.placeholder')}
            rightSection={loading ? <Loader size='xs' /> : undefined}
            searchable
            value={sourceId}
            onChange={setSourceId}
            onSearchChange={setQuery}
          />
          {sourceId && <Alert color='yellow'>{t('merge.warning')}</Alert>}
          {error && <Alert color='red'>{error}</Alert>}
          <Group justify='flex-end'>
            <Button disabled={merging} variant='default' onClick={close}>
              {t('common.cancel')}
            </Button>
            <Button
              color='red'
              disabled={!sourceId}
              leftSection={<ArrowsMergeIcon size={18} />}
              loading={merging}
              onClick={() => void merge()}
            >
              {t('merge.confirm')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
