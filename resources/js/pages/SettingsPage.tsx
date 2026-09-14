import { Alert, Button, Card, Group, Loader, Stack, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { FloppyDiskIcon } from '@phosphor-icons/react/FloppyDisk'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Redirect } from 'wouter'

import { useAuth } from '../auth'
import { updatePassword, updateProfile } from '../services/auth'

import styles from './SettingsPage.module.css'

type ProfileValues = {
  name: string
  email: string
}

type PasswordValues = {
  currentPassword: string
  password: string
  passwordConfirmation: string
}

/**
 * Settings of the account the reader is signed in with: the name and email it is known by, and the
 * password that protects it. The account arrives from the session, so the fields follow it whenever
 * it is read, and a saved profile is handed back to the session, which names it in the header.
 */
export default function SettingsPage() {
  const { t } = useTranslation()
  const { ready, user, setUser } = useAuth()

  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const profileForm = useForm<ProfileValues>({ initialValues: { email: '', name: '' } })
  const passwordForm = useForm<PasswordValues>({
    initialValues: { currentPassword: '', password: '', passwordConfirmation: '' },
  })

  useEffect(() => {
    if (user) profileForm.setValues({ email: user.email, name: user.name })
  }, [user])

  if (!ready)
    return (
      <div className={styles.loading}>
        <Loader color='orange' />
      </div>
    )
  if (!user) return <Redirect to='/login' />

  async function saveProfile(values: ProfileValues) {
    try {
      setSavingProfile(true)
      setProfileError(null)
      setProfileSaved(false)
      // One section is saved at a time, so a confirmation left over from the other one is dropped
      setPasswordSaved(false)
      setPasswordError(null)
      setUser(await updateProfile(values))
      setProfileSaved(true)
    } catch (reason) {
      setProfileError(reason instanceof Error ? reason.message : t('settings.saveError'))
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePassword(values: PasswordValues) {
    try {
      setSavingPassword(true)
      setPasswordError(null)
      setPasswordSaved(false)
      // One section is saved at a time, so a confirmation left over from the other one is dropped
      setProfileSaved(false)
      setProfileError(null)
      await updatePassword(values)
      passwordForm.reset()
      setPasswordSaved(true)
    } catch (reason) {
      setPasswordError(reason instanceof Error ? reason.message : t('settings.saveError'))
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Text className={styles.eyebrow}>{t('settings.eyebrow')}</Text>
        <Title order={1}>{t('settings.title')}</Title>
        <Text c='dimmed'>{t('settings.subtitle')}</Text>
      </header>

      <Stack gap='lg'>
        <Card padding='lg' radius='sm' withBorder>
          <Stack>
            <div>
              <Text fw={700}>{t('settings.profileTitle')}</Text>
              <Text c='dimmed' size='sm'>
                {t('settings.profileHint')}
              </Text>
            </div>
            {profileSaved && <Alert color='green'>{t('settings.profileSaved')}</Alert>}
            {profileError && <Alert color='red'>{profileError}</Alert>}
            <form onSubmit={profileForm.onSubmit(saveProfile)}>
              <Stack>
                <TextInput
                  label={t('settings.name')}
                  required
                  {...profileForm.getInputProps('name')}
                />
                <TextInput
                  label={t('settings.email')}
                  required
                  type='email'
                  {...profileForm.getInputProps('email')}
                />
                <Group justify='flex-end'>
                  <Button
                    leftSection={<FloppyDiskIcon size={18} />}
                    loading={savingProfile}
                    type='submit'
                  >
                    {t('settings.saveProfile')}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Stack>
        </Card>

        <Card padding='lg' radius='sm' withBorder>
          <Stack>
            <div>
              <Text fw={700}>{t('settings.passwordTitle')}</Text>
              <Text c='dimmed' size='sm'>
                {t('settings.passwordHint')}
              </Text>
            </div>
            {passwordSaved && <Alert color='green'>{t('settings.passwordSaved')}</Alert>}
            {passwordError && <Alert color='red'>{passwordError}</Alert>}
            <form onSubmit={passwordForm.onSubmit(savePassword)}>
              <Stack>
                <TextInput
                  label={t('settings.currentPassword')}
                  required
                  type='password'
                  {...passwordForm.getInputProps('currentPassword')}
                />
                <TextInput
                  description={t('settings.newPasswordHint')}
                  label={t('settings.newPassword')}
                  required
                  type='password'
                  {...passwordForm.getInputProps('password')}
                />
                <TextInput
                  label={t('settings.passwordConfirmation')}
                  required
                  type='password'
                  {...passwordForm.getInputProps('passwordConfirmation')}
                />
                <Group justify='flex-end'>
                  <Button
                    leftSection={<FloppyDiskIcon size={18} />}
                    loading={savingPassword}
                    type='submit'
                  >
                    {t('settings.savePassword')}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Stack>
        </Card>
      </Stack>
    </main>
  )
}
