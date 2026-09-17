import '@mantine/core/styles.css'
import '@mantine/carousel/styles.css'
import '@mantine/dropzone/styles.css'
import './styles.css'
import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core'
import { createRoot } from 'react-dom/client'

import App from './App'
import { i18nReady } from './i18n'

const colorSchemeManager = localStorageColorSchemeManager({ key: 'color-scheme' })

const root = document.getElementById('root')

if (!root) {
  throw new Error('React root element was not found')
}

const container = createRoot(root)

function render() {
  container.render(
    <MantineProvider defaultColorScheme='auto' colorSchemeManager={colorSchemeManager}>
      <App />
    </MantineProvider>,
  )
}

// The translations of the interface and the names of the categories are read over HTTP, so the page
// waits for the language it starts in instead of flashing translation keys and category codes
i18nReady.then(render, render)
