import {
  ActionIcon,
  AppShell,
  Button,
  Group,
  Menu,
  Select,
  Text,
  TextInput,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core'
import { CheckIcon } from '@phosphor-icons/react/Check'
import { DesktopIcon } from '@phosphor-icons/react/Desktop'
import { GlobeIcon } from '@phosphor-icons/react/Globe'
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

import styles from './AppHeader.module.css'

/**
 * Header of the application shell: the navigation to the listings, the application search and the
 * account controls. The search box mirrors the `q` query of the current location, so that a
 * searched term stays visible and editing it navigates to a new search.
 */
export default function AppHeader() {
  const { t, i18n } = useTranslation()
  const { ready, user, logout } = useAuth()
  const { colorScheme, setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme()
  const [, navigate] = useLocation()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const [searchQuery, setSearchQuery] = useState(query)
  const currentLanguage = i18n.resolvedLanguage ?? 'en'

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
            {t('header.applications')}
          </Button>
          <Button
            component={Link}
            href='/repos'
            className={styles.navButton}
            color='gray'
            leftSection={<HardDrivesIcon size={18} />}
            variant='subtle'
          >
            {t('header.repositories')}
          </Button>
          <Button
            component={Link}
            href='/distros'
            className={styles.navButton}
            color='gray'
            leftSection={<LinuxLogoIcon size={18} />}
            variant='subtle'
          >
            {t('header.distributions')}
          </Button>
          <Button
            component={Link}
            href='/pkgs'
            className={styles.navButton}
            color='gray'
            leftSection={<PackageIcon size={18} />}
            variant='subtle'
          >
            {t('header.packages')}
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
              aria-label={t('header.searchApplications')}
              className={styles.search}
              leftSection={<MagnifyingGlassIcon size={18} />}
              placeholder={t('header.searchApplications')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.currentTarget.value)}
            />
          </form>
        </nav>
        <Group gap='xs'>
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
          <Select
            aria-label={t('language')}
            className={styles.lang}
            allowDeselect={false}
            checkIconPosition='right'
            data={[
              { value: 'en', label: 'EN' },
              { value: 'zh-CN', label: '简中' },
              { value: 'zh-TW', label: '繁中' },
            ]}
            leftSection={<GlobeIcon size={15} />}
            value={currentLanguage}
            variant='default'
            w={100}
            onChange={(language) => {
              if (language) void i18n.changeLanguage(language)
            }}
          />
          {ready && user ? (
            <>
              <ActionIcon
                aria-label={t('header.profile')}
                component={Link}
                href={`/users/${user.id}`}
                size='lg'
                title={t('header.profile')}
                variant='default'
              >
                <UserCircleIcon size={20} />
              </ActionIcon>
              <Button
                leftSection={<SignOutIcon size={18} />}
                variant='default'
                onClick={() => void handleLogout()}
              >
                {t('logout')}
              </Button>
            </>
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
