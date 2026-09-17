import { Button, Group, Stack, Text } from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import { TrashIcon } from '@phosphor-icons/react/Trash'
import { UploadSimpleIcon } from '@phosphor-icons/react/UploadSimple'
import { useState } from 'react'

import { uploadImage, type ImageFormat } from '../services/images'

import styles from './ImageUpload.module.css'

const maxSize = 10 * 1024 * 1024

/** Media type of every format the endpoint stores, which is what the dropzone accepts by. */
const mediaTypes: Record<ImageFormat, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
}

type ImageUploadProps = {
  /**
   * Id of the selected image, or null when the entry has none.
   */
  value: number | null
  /**
   * Url of the image already stored on the entry. Uploading a file replaces it in the preview.
   */
  previewUrl?: string | null
  onChange: (imageId: number | null) => void
  /** Formats the field accepts, which the endpoint is told about as well. */
  formats: ImageFormat[]
  /**
   * Media types the dropzone takes as well, for what the endpoint decodes on its own: a picture a
   * phone stores is coded with HEVC, so it never reaches the formats the field stores.
   */
  extraMediaTypes?: string[]
  /**
   * Text of every state of the field. What is uploaded differs — a catalog entry takes an icon, an
   * account an avatar — and the wording names it, so the labels are the ones of the caller.
   */
  label: string
  hint: string
  dropLabel: string
  acceptLabel: string
  rejectLabel: string
  removeLabel: string
  errorLabel: string
  /** Round the picture, which an avatar is and an icon is not. */
  round?: boolean
}

/**
 * Field that takes an image file and hands back the image it was stored as. It owns the upload, the
 * preview and the removal, while what the image is for — the icon of an entry, the avatar of an
 * account — is the caller's, which is also where the wording comes from.
 */
export default function ImageUpload({
  acceptLabel,
  dropLabel,
  errorLabel,
  extraMediaTypes = [],
  formats,
  hint,
  label,
  onChange,
  previewUrl = null,
  rejectLabel,
  removeLabel,
  round,
  value,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const preview = value ? (uploadedUrl ?? previewUrl) : null
  const box = round ? `${styles.box} ${styles.round}` : styles.box

  async function upload(files: File[]) {
    const file = files[0]
    if (!file) return

    try {
      setUploading(true)
      setError(null)
      const image = await uploadImage(file, { acceptedFormats: formats })
      setUploadedUrl(image.url)
      onChange(image.id)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : errorLabel)
    } finally {
      setUploading(false)
    }
  }

  function remove() {
    setUploadedUrl(null)
    setError(null)
    onChange(null)
  }

  return (
    <Stack gap='xs'>
      <Text fw={500} size='sm'>
        {label}
      </Text>
      <Group align='flex-start' gap='lg' wrap='nowrap'>
        <Dropzone
          accept={[...formats.map((format) => mediaTypes[format]), ...extraMediaTypes]}
          className={box}
          loading={uploading}
          maxSize={maxSize}
          multiple={false}
          onDrop={upload}
          onReject={() => setError(rejectLabel)}
          p={0}
        >
          <Dropzone.Idle>
            {preview ? (
              <img alt='' className={box} src={preview} />
            ) : (
              <Stack align='center' gap={4} px='xs'>
                <UploadSimpleIcon size={24} />
                <Text c='dimmed' size='xs' ta='center'>
                  {dropLabel}
                </Text>
              </Stack>
            )}
          </Dropzone.Idle>
          <Dropzone.Accept>
            <Text size='xs' ta='center'>
              {acceptLabel}
            </Text>
          </Dropzone.Accept>
          <Dropzone.Reject>
            <Text c='red' size='xs' ta='center'>
              {rejectLabel}
            </Text>
          </Dropzone.Reject>
        </Dropzone>
        <Stack className={styles.aside} gap='xs'>
          <Text c='dimmed' size='xs'>
            {hint}
          </Text>
          {error && (
            <Text c='red' size='xs'>
              {error}
            </Text>
          )}
          {value !== null && (
            <Group>
              <Button
                leftSection={<TrashIcon size={16} />}
                onClick={remove}
                size='xs'
                variant='subtle'
              >
                {removeLabel}
              </Button>
            </Group>
          )}
        </Stack>
      </Group>
    </Stack>
  )
}
