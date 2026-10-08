import './css/app.css'
import '@fontsource-variable/jost'
import '@fontsource-variable/rubik'
import '@fontsource-variable/jetbrains-mono'
import { client } from './client'
import { createRoot } from 'react-dom/client'
import { TuyauProvider } from '@adonisjs/inertia/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react'

const appName = import.meta.env.VITE_APP_NAME || 'Digital Covet Portfolio'

createInertiaApp({
  title: (title) => (title ? `${title} - ${appName}` : appName),
  resolve: async (name) => {
    const page = await resolvePageComponent(
      `./pages/${name}.tsx`,
      import.meta.glob<{ default: ResolvedComponent }>('./pages/**/*.tsx')
    )
    const component = page.default as ResolvedComponent & { layout?: unknown }
    // Persistent AppShell survives navigation when pages opt in via
    // Page.layout = (page) => <AppShell>{page}</AppShell>
    return component
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <TuyauProvider client={client}>
        <App {...props} />
      </TuyauProvider>
    )
  },
  progress: false,
})
