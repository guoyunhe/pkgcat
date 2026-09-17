import { Alert, Button, Group, Rating, Text, Textarea } from '@mantine/core'
import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'wouter'

import { useAuth } from '../auth'
import { createReview } from '../services/reviews'
import DistroSelect from './DistroSelect'

import styles from './ReviewForm.module.css'

type ReviewFormProps = {
  appId: number
  onSubmitted: () => void
}

export default function ReviewForm({ appId, onSubmitted }: ReviewFormProps) {
  const { t } = useTranslation()
  const { ready, user } = useAuth()
  const [, navigate] = useLocation()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [distroId, setDistroId] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The distribution of the account is the one the review names until the reviewer says otherwise
  useEffect(() => {
    setDistroId(user?.distroId ? String(user.distroId) : null)
  }, [user])

  if (!ready || !user) {
    return (
      <Button variant='light' onClick={() => navigate('/login')}>
        {t('reviews.signInToReview')}
      </Button>
    )
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || rating < 1 || rating > 5) return

    setPending(true)
    setError(null)
    try {
      await createReview(appId, {
        rating,
        comment: comment.trim() || undefined,
        distroId: distroId ? Number(distroId) : null,
      })
      setRating(0)
      setComment('')
      onSubmitted()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('reviews.submitError'))
    } finally {
      setPending(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={(event) => void submit(event)}>
      <Text component='label' fw={600} size='sm'>
        {t('reviews.yourRating')}
      </Text>
      <Rating
        aria-label={t('reviews.yourRating')}
        count={5}
        onChange={setRating}
        size='lg'
        value={rating}
      />
      <DistroSelect
        label={t('common.distribution')}
        onChange={setDistroId}
        searchable
        value={distroId}
      />
      <Textarea
        autosize
        label={t('reviews.comment')}
        maxLength={1000}
        maxRows={6}
        minRows={3}
        onChange={(event) => setComment(event.currentTarget.value)}
        placeholder={t('reviews.commentPlaceholder')}
        value={comment}
      />
      {error && <Alert color='red'>{error}</Alert>}
      <Group justify='flex-end'>
        <Button loading={pending} type='submit'>
          {t('reviews.submit')}
        </Button>
      </Group>
    </form>
  )
}
