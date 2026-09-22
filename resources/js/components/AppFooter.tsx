import { Anchor, Box, Container, Group } from '@mantine/core'
import { GithubLogoIcon } from '@phosphor-icons/react/GithubLogo'
import { TelegramLogoIcon } from '@phosphor-icons/react/TelegramLogo'
import { useTranslation } from 'react-i18next'

import styles from './AppFooter.module.css'

/**
 * The addresses where the project is developed and where its users gather, as the footer lists
 * them.
 */
const links = [
  { href: 'https://github.com/guoyunhe/pkgcat', icon: GithubLogoIcon, label: 'footer.source' },
  { href: 'https://t.me/pkgcat', icon: TelegramLogoIcon, label: 'footer.community' },
] as const

/**
 * Foot of the application shell: the addresses of the project outside the catalog, so that every
 * page of it leads to the code it is built from and to the group where its users talk. It stands
 * under the page of the route, and the pages carry the room above it themselves.
 */
export default function AppFooter() {
  const { t } = useTranslation()

  return (
    <footer className={styles.footer}>
      <Container className={styles.inner} size='lg' display='flex'>
        <Box flex='1'>&copy; 2026 PkgCat Community</Box>
        <Group gap='lg'>
          <Anchor
            href='https://github.com/guoyunhe/pkgcat'
            key='https://github.com/guoyunhe/pkgcat'
            rel='noreferrer'
            target='_blank'
          >
            <Group gap='xs'>
              <GithubLogoIcon size={16} />
              GitHub
            </Group>
          </Anchor>
          <Anchor
            href='https://t.me/pkgcat'
            key='https://t.me/pkgcat'
            rel='noreferrer'
            target='_blank'
          >
            <Group gap='xs'>
              <TelegramLogoIcon size={16} />
              Telegram
            </Group>
          </Anchor>
        </Group>
      </Container>
    </footer>
  )
}
