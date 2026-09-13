import { AppShell } from '@mantine/core'

import { AuthProvider } from './auth'
import AppHeader from './components/AppHeader'
import AppRoutes from './components/AppRoutes'

/** Application shell: the authentication provider, the header and the routed page. */
export default function App() {
  return (
    <AuthProvider>
      <AppShell header={{ height: 68 }}>
        <AppHeader />
        <AppShell.Main>
          <AppRoutes />
        </AppShell.Main>
      </AppShell>
    </AuthProvider>
  )
}
