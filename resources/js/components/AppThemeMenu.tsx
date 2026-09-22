import { ActionIcon, Menu, useComputedColorScheme, useMantineColorScheme } from '@mantine/core'
import { CheckIcon } from '@phosphor-icons/react/Check'
import { DesktopIcon } from '@phosphor-icons/react/Desktop'
import { MoonIcon } from '@phosphor-icons/react/Moon'
import { SunIcon } from '@phosphor-icons/react/Sun'
import { useTranslation } from 'react-i18next'

/**
 * Color scheme the interface is shown in, which the browser keeps and which follows the system
 * until one is picked. The control is an icon, so it fits the header as well as the drawer.
 */
export default function AppThemeMenu() {
  const { t } = useTranslation()
  const { colorScheme, setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme()

  return (
    <Menu position='bottom-end' shadow='md' width={170}>
      <Menu.Target>
        <ActionIcon
          aria-label={t('header.theme')}
          size='lg'
          title={t('header.theme')}
          variant='default'
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
  )
}
