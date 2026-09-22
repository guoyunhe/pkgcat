import { AppShell, ActionIcon, Burger, Button, Group, Menu, Text, TextInput } from '@mantine/core'
import { GearSixIcon } from '@phosphor-icons/react/GearSix'
import { MagnifyingGlassIcon } from '@phosphor-icons/react/MagnifyingGlass'
import { SignInIcon } from '@phosphor-icons/react/SignIn'
import { SignOutIcon } from '@phosphor-icons/react/SignOut'
import { UserCircleIcon } from '@phosphor-icons/react/UserCircle'
import { UserPlusIcon } from '@phosphor-icons/react/UserPlus'
import { XIcon } from '@phosphor-icons/react/X'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useSearchParams } from 'wouter'

import { useAuth } from '../auth'
import AppNavLinks from './AppNavLinks'
import AppThemeMenu from './AppThemeMenu'
import LanguageMenu from './LanguageMenu'
import UserAvatar from './UserAvatar'

import styles from './AppHeader.module.css'

type AppHeaderProps = {
  /** Whether the drawer the burger of this header opens is open. */
  navbarOpened: boolean
  /** Opens and closes that drawer. */
  onToggleNavbar: () => void
}

/**
 * Header of the application shell: the brand, the navigation to the listings, the search across the
 * catalog and the account controls. Wider than the breakpoint of the shell all of it fits in one
 * row; narrower, the navigation moves into the drawer the burger opens and the search box is a
 * magnifier that unfolds it over the rest of the header. The search box mirrors the `q` query of
 * the current location, so that a searched term stays visible and editing it navigates to a new
 * search.
 */
export default function AppHeader({ navbarOpened, onToggleNavbar }: AppHeaderProps) {
  const { t } = useTranslation()
  const { ready, user, logout } = useAuth()
  const [, navigate] = useLocation()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const [searchQuery, setSearchQuery] = useState(query)
  const [searchOpened, setSearchOpened] = useState(false)
  const searchInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSearchQuery(query)
  }, [query])

  // The header of a narrow screen fits the search box only once what else it holds steps aside, so
  // the box takes the focus as soon as it is unfolded
  useEffect(() => {
    if (searchOpened) searchInput.current?.focus()
  }, [searchOpened])

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const value = searchQuery.trim()
    setSearchOpened(false)
    navigate(value ? `/search?q=${encodeURIComponent(value)}` : '/apps')
  }

  /** The unfolded search box and the drawer cover the same room, so opening one closes the other. */
  function handleToggleSearch() {
    if (navbarOpened) onToggleNavbar()
    setSearchOpened((opened) => !opened)
  }

  function handleToggleNavbar() {
    setSearchOpened(false)
    onToggleNavbar()
  }

  return (
    <AppShell.Header className={styles.header}>
      <div className={`${styles.inner} ${searchOpened ? styles.searchOpened : ''}`}>
        <Burger
          aria-label={t('header.menu')}
          className={styles.burger}
          opened={navbarOpened}
          size='sm'
          onClick={handleToggleNavbar}
        />
        <Text component={Link} href='/' className={styles.brand} fw={700}>
          <img src='/favicon.svg' alt='' className={styles.icon} />
          PkgCat
        </Text>
        <nav className={styles.nav}>
          <AppNavLinks />
        </nav>
        <form className={styles.searchForm} onSubmit={handleSubmit}>
          <TextInput
            ref={searchInput}
            aria-label={t('common.search')}
            className={styles.search}
            leftSection={<MagnifyingGlassIcon size={18} />}
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setSearchOpened(false)
            }}
          />
        </form>
        <ActionIcon
          aria-label={searchOpened ? t('common.close') : t('common.search')}
          className={styles.searchToggle}
          size='lg'
          title={searchOpened ? t('common.close') : t('common.search')}
          variant='default'
          onClick={handleToggleSearch}
        >
          {searchOpened ? <XIcon size={18} /> : <MagnifyingGlassIcon size={18} />}
        </ActionIcon>
        <Group className={styles.controls} gap='xs' wrap='nowrap'>
          <AppThemeMenu />
          <LanguageMenu />
          <Group className={styles.account} gap='xs' wrap='nowrap'>
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
        </Group>
      </div>
    </AppShell.Header>
  )
}
