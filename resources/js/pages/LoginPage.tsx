import {
  Anchor,
  Button,
  Container,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { SignInIcon } from '@phosphor-icons/react/SignIn'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'wouter'

import { useAuth } from '../auth'
import { login } from '../services/auth'

import styles from './AuthPage.module.css'

export default function LoginPage() {
  const { t } = useTranslation()
  const [, navigate] = useLocation()
  const { setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { email: '', password: '' },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : t('invalidEmail')),
      password: (value) => (value ? null : t('required')),
    },
  })

  async function handleSubmit(values: typeof form.values) {
    form.setFieldError('form', null)
    setLoading(true)
    try {
      setUser(await login(values))
      navigate('/')
    } catch (error) {
      form.setFieldError('form', error instanceof Error ? error.message : t('loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size={420} className={styles.page}>
      <Text className={styles.brand}>{t('appName')}</Text>
      <Title order={1}>{t('welcomeBack')}</Title>
      <Text c='dimmed' mt={6}>
        {t('noAccount')} <Anchor onClick={() => navigate('/register')}>{t('register')}</Anchor>
      </Text>
      <Paper withBorder p='xl' mt='xl' radius='sm'>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label={t('email')}
              type='email'
              key={form.key('email')}
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label={t('common.password')}
              key={form.key('password')}
              {...form.getInputProps('password')}
            />
            {form.errors.form && (
              <Text c='red' size='sm'>
                {form.errors.form}
              </Text>
            )}
            <Button
              leftSection={<SignInIcon size={18} />}
              type='submit'
              color='orange'
              loading={loading}
            >
              {t('login')}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}
