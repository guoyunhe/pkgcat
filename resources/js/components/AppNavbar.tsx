import { AppShell, Button, Group, Text } from '@mantine/core'
import { GearSixIcon } from '@phosphor-icons/react/GearSix'
import { SignInIcon } from '@phosphor-icons/react/SignIn'
import { SignOutIcon } from '@phosphor-icons/react/SignOut'
import { UserCircleIcon } from '@phosphor-icons/react/UserCircle'
import { UserPlusIcon } from '@phosphor-icons/react/UserPlus'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'wouter'

import { useAuth } from '../auth'
import AppNavLinks from './AppNavLinks'
import UserAvatar from './UserAvatar'

import styles from './AppNavbar.module.css'

type AppNavbarProps = {
  /** Closes the drawer, which is what every link of it does on its way out. */
  onClose: () => void
}

/**
 * Drawer the navigation moves into on narrow screens, where the header keeps only the search box,
 * the color scheme and the language: the links to the listings and the account of the visitor, the
 * same destinations the header offers when there is room for them.
 */
export default function AppNavbar({ onClose }: AppNavbarProps) {
  const { t } = useTranslation()
  const { ready, user, logout } = useAuth()
  const [, navigate] = useLocation()

  async function handleLogout() {
    onClose()
    await logout()
    navigate('/')
  }

  return (
    <AppShell.Navbar className={styles.navbar}>
      <div className={styles.links}>
        <AppNavLinks fullWidth onNavigate={onClose} />
      </div>
      {ready ? (
        <div className={styles.account}>
          {user ? (
            <>
              <Group className={styles.identity} gap='sm' wrap='nowrap'>
                <UserAvatar size={36} user={user} />
                <div className={styles.names}>
                  <Text fw={600} truncate>
                    {user.name}
                  </Text>
                  <Text c='dimmed' size='xs' truncate>
                    {user.email}
                  </Text>
                </div>
              </Group>
              <Button
                fullWidth
                color='gray'
                component={Link}
                href={`/users/${user.id}`}
                justify='flex-start'
                leftSection={<UserCircleIcon size={18} />}
                variant='subtle'
                onClick={onClose}
              >
                {t('common.profile')}
              </Button>
              <Button
                fullWidth
                color='gray'
                component={Link}
                href='/settings'
                justify='flex-start'
                leftSection={<GearSixIcon size={18} />}
                variant='subtle'
                onClick={onClose}
              >
                {t('common.settings')}
              </Button>
              <Button
                fullWidth
                color='red'
                justify='flex-start'
                leftSection={<SignOutIcon size={18} />}
                variant='subtle'
                onClick={() => void handleLogout()}
              >
                {t('logout')}
              </Button>
            </>
          ) : (
            <>
              <Button
                fullWidth
                component={Link}
                href='/login'
                leftSection={<SignInIcon size={18} />}
                variant='default'
                onClick={onClose}
              >
                {t('login')}
              </Button>
              <Button
                fullWidth
                component={Link}
                href='/register'
                leftSection={<UserPlusIcon size={18} />}
                onClick={onClose}
              >
                {t('register')}
              </Button>
            </>
          )}
        </div>
      ) : null}
    </AppShell.Navbar>
  )
}
