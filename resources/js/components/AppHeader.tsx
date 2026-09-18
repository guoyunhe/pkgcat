import {
  ActionIcon,
  AppShell,
  Button,
  Group,
  Menu,
  Text,
  TextInput,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core'
import { CheckIcon } from '@phosphor-icons/react/Check'
import { DesktopIcon } from '@phosphor-icons/react/Desktop'
import { GearSixIcon } from '@phosphor-icons/react/GearSix'
import { HardDrivesIcon } from '@phosphor-icons/react/HardDrives'
import { LinuxLogoIcon } from '@phosphor-icons/react/LinuxLogo'
import { MagnifyingGlassIcon } from '@phosphor-icons/react/MagnifyingGlass'
import { MoonIcon } from '@phosphor-icons/react/Moon'
import { PackageIcon } from '@phosphor-icons/react/Package'
import { SignInIcon } from '@phosphor-icons/react/SignIn'
import { SignOutIcon } from '@phosphor-icons/react/SignOut'
import { SquaresFourIcon } from '@phosphor-icons/react/SquaresFour'
import { SunIcon } from '@phosphor-icons/react/Sun'
import { UserCircleIcon } from '@phosphor-icons/react/UserCircle'
import { UserPlusIcon } from '@phosphor-icons/react/UserPlus'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useSearchParams } from 'wouter'

import { useAuth } from '../auth'
import LanguageMenu from './LanguageMenu'
import UserAvatar from './UserAvatar'

import styles from './AppHeader.module.css'

/**
 * Header of the application shell: the navigation to the listings, the search across the catalog
 * and the account controls. The search box mirrors the `q` query of the current location, so that a
 * searched term stays visible and editing it navigates to a new search.
 */
export default function AppHeader() {
  const { t } = useTranslation()
  const { ready, user, logout } = useAuth()
  const { colorScheme, setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme()
  const [, navigate] = useLocation()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const [searchQuery, setSearchQuery] = useState(query)

  useEffect(() => {
    setSearchQuery(query)
  }, [query])

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <AppShell.Header className={styles.header}>
      <div className={styles.inner}>
        <nav className={styles.nav}>
          <Text component={Link} href='/' className={styles.brand} fw={700}>
            <img src='/favicon.svg' alt='' className={styles.icon} />
            PkgCat
          </Text>
          <Button
            component={Link}
            href='/apps'
            className={styles.navButton}
            color='gray'
            leftSection={<SquaresFourIcon size={18} />}
            variant='subtle'
          >
            {t('common.apps')}
          </Button>
          <Button
            component={Link}
            href='/pkgs'
            className={styles.navButton}
            color='gray'
            leftSection={<PackageIcon size={18} />}
            variant='subtle'
          >
            {t('common.packages')}
          </Button>
          <Button
            component={Link}
            href='/repos'
            className={styles.navButton}
            color='gray'
            leftSection={<HardDrivesIcon size={18} />}
            variant='subtle'
          >
            {t('common.repositories')}
          </Button>
          <Button
            component={Link}
            href='/distros'
            className={styles.navButton}
            color='gray'
            leftSection={<LinuxLogoIcon size={18} />}
            variant='subtle'
          >
            {t('common.distributions')}
          </Button>
          <form
            className={styles.searchForm}
            onSubmit={(event) => {
              event.preventDefault()
              const value = searchQuery.trim()
              navigate(value ? `/search?q=${encodeURIComponent(value)}` : '/apps')
            }}
          >
            <TextInput
              aria-label={t('common.search')}
              className={styles.search}
              leftSection={<MagnifyingGlassIcon size={18} />}
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.currentTarget.value)}
            />
          </form>
        </nav>
        <Group gap='xs' wrap='nowrap'>
          <Menu shadow='md' width={170} position='bottom-end'>
            <Menu.Target>
              <ActionIcon
                aria-label={t('header.theme')}
                title={t('header.theme')}
                variant='default'
                size='lg'
              >
                {computedColorScheme === 'dark' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<DesktopIcon size={16} />}
                rightSection={colorScheme === 'auto' ? <CheckIcon size={14} /> : null}
                onClick={() => setColorScheme('auto')}
              >
                {t('header.themeAuto')}
              </Menu.Item>
              <Menu.Item
                leftSection={<SunIcon size={16} />}
                rightSection={colorScheme === 'light' ? <CheckIcon size={14} /> : null}
                onClick={() => setColorScheme('light')}
              >
                {t('header.themeLight')}
              </Menu.Item>
              <Menu.Item
                leftSection={<MoonIcon size={16} />}
                rightSection={colorScheme === 'dark' ? <CheckIcon size={14} /> : null}
                onClick={() => setColorScheme('dark')}
              >
                {t('header.themeDark')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <LanguageMenu />
          {ready && user ? (
            <Menu position='bottom-end' shadow='md' width={220}>
              <Menu.Target>
                <ActionIcon
                  aria-label={t('common.account')}
                  size='lg'
                  title={t('common.account')}
                  variant='default'
                >
                  <UserAvatar size={20} user={user} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>
                  {user.name}
                  <Text c='dimmed' size='xs'>
                    {user.email}
                  </Text>
                </Menu.Label>
                <Menu.Item
                  component={Link}
                  href={`/users/${user.id}`}
                  leftSection={<UserCircleIcon size={16} />}
                >
                  {t('common.profile')}
                </Menu.Item>
                <Menu.Item
                  component={Link}
                  href='/settings'
                  leftSection={<GearSixIcon size={16} />}
                >
                  {t('common.settings')}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color='red'
                  leftSection={<SignOutIcon size={16} />}
                  onClick={() => void handleLogout()}
                >
                  {t('logout')}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : ready ? (
            <>
              <Button
                component={Link}
                href='/login'
                leftSection={<SignInIcon size={18} />}
                variant='default'
              >
                {t('login')}
              </Button>
              <Button component={Link} href='/register' leftSection={<UserPlusIcon size={18} />}>
                {t('register')}
              </Button>
            </>
          ) : null}
        </Group>
      </div>
    </AppShell.Header>
  )
}
