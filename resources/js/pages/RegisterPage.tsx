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
import { UserPlusIcon } from '@phosphor-icons/react/UserPlus'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'wouter'

import { useAuth } from '../auth'
import { register } from '../services/auth'

import styles from './AuthPage.module.css'

export default function RegisterPage() {
  const { t } = useTranslation()
  const [, navigate] = useLocation()
  const { setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { name: '', email: '', password: '', passwordConfirmation: '' },
    validate: {
      name: (value) => (value.trim() ? null : t('required')),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : t('invalidEmail')),
      password: (value) => (value.length >= 8 ? null : t('passwordHint')),
      passwordConfirmation: (value, values) =>
        value === values.password ? null : t('passwordMismatch'),
    },
  })

  async function handleSubmit(values: typeof form.values) {
    form.setFieldError('form', null)
    setLoading(true)
    try {
      setUser(await register(values))
      navigate('/')
    } catch (error) {
      form.setFieldError('form', error instanceof Error ? error.message : t('registerFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size={420} className={styles.page}>
      <Text className={styles.brand}>{t('appName')}</Text>
      <Title order={1}>{t('createAccount')}</Title>
      <Text c='dimmed' mt={6}>
        {t('hasAccount')} <Anchor onClick={() => navigate('/login')}>{t('login')}</Anchor>
      </Text>
      <Paper withBorder p='xl' mt='xl' radius='sm'>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label={t('common.name')}
              key={form.key('name')}
              {...form.getInputProps('name')}
              maxLength={32}
            />
            <TextInput
              label={t('email')}
              type='email'
              key={form.key('email')}
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label={t('common.password')}
              description={t('passwordHint')}
              key={form.key('password')}
              {...form.getInputProps('password')}
              minLength={8}
              maxLength={32}
            />
            <PasswordInput
              label={t('confirmPassword')}
              key={form.key('passwordConfirmation')}
              {...form.getInputProps('passwordConfirmation')}
            />
            {form.errors.form && (
              <Text c='red' size='sm'>
                {form.errors.form}
              </Text>
            )}
            <Button
              leftSection={<UserPlusIcon size={18} />}
              type='submit'
              color='orange'
              loading={loading}
            >
              {t('register')}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}
