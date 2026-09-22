import { Button } from '@mantine/core'
import { HardDrivesIcon } from '@phosphor-icons/react/HardDrives'
import { LinuxLogoIcon } from '@phosphor-icons/react/LinuxLogo'
import { PackageIcon } from '@phosphor-icons/react/Package'
import { SquaresFourIcon } from '@phosphor-icons/react/SquaresFour'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

/** The listings of the catalog, in the order the header and the drawer show them. */
const links = [
  { href: '/apps', icon: SquaresFourIcon, label: 'common.apps' },
  { href: '/pkgs', icon: PackageIcon, label: 'common.packages' },
  { href: '/repos', icon: HardDrivesIcon, label: 'common.repositories' },
  { href: '/distros', icon: LinuxLogoIcon, label: 'common.distributions' },
] as const

type AppNavLinksProps = {
  /** Whether the links fill their container and read from its start, the way the drawer stacks them. */
  fullWidth?: boolean
  /** What a link does once it navigated, which is what closes the drawer it was read in. */
  onNavigate?: () => void
}

/**
 * Links to the listings of the catalog, which the header lays out in a row and the drawer stacks,
 * and which are one list so that both offer the same destinations in the same order.
 */
export default function AppNavLinks({ fullWidth = false, onNavigate }: AppNavLinksProps) {
  const { t } = useTranslation()

  return (
    <>
      {links.map(({ href, icon: Icon, label }) => (
        <Button
          key={href}
          color='gray'
          component={Link}
          fullWidth={fullWidth}
          href={href}
          justify={fullWidth ? 'flex-start' : undefined}
          leftSection={<Icon size={18} />}
          variant='subtle'
          onClick={onNavigate}
        >
          {t(label)}
        </Button>
      ))}
    </>
  )
}
