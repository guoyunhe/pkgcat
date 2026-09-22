import { AppShell } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'

import AppRoutes from './AppRoutes'
import { AuthProvider } from './auth'
import AppHeader from './components/AppHeader'
import AppNavbar from './components/AppNavbar'
import { SearchParamsProvider } from './searchParams'

/**
 * Viewport width the shell switches at, in pixels: above it the navigation sits in the header,
 * below it the header keeps only the burger that opens it from the drawer. The styles of the header
 * carry the same value.
 */
const navbarBreakpoint = 600

/**
 * Application shell: the providers the pages read the URL and the session with, the header that
 * holds the search across the catalog, the drawer the navigation moves into on narrow screens and
 * the routed page. The drawer is opened from the burger of the header, so its state belongs here.
 */
export default function App() {
  const [navbarOpened, { toggle: toggleNavbar, close: closeNavbar }] = useDisclosure(false)

  return (
    <SearchParamsProvider>
      <AuthProvider>
        <AppShell
          header={{ height: 68 }}
          navbar={{
            width: 280,
            breakpoint: navbarBreakpoint,
            collapsed: { desktop: true, mobile: !navbarOpened },
          }}
        >
          <AppHeader navbarOpened={navbarOpened} onToggleNavbar={toggleNavbar} />
          <AppNavbar onClose={closeNavbar} />
          <AppShell.Main>
            <AppRoutes />
          </AppShell.Main>
        </AppShell>
      </AuthProvider>
    </SearchParamsProvider>
  )
}
