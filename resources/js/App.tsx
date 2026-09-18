import { AppShell } from '@mantine/core'

import AppRoutes from './AppRoutes'
import { AuthProvider } from './auth'
import AppHeader from './components/AppHeader'
import { SearchParamsProvider } from './searchParams'

/**
 * Application shell: the providers the pages read the URL and the session with, the header and the
 * routed page.
 */
export default function App() {
  return (
    <SearchParamsProvider>
      <AuthProvider>
        <AppShell header={{ height: 68 }}>
          <AppHeader />
          <AppShell.Main>
            <AppRoutes />
          </AppShell.Main>
        </AppShell>
      </AuthProvider>
    </SearchParamsProvider>
  )
}
