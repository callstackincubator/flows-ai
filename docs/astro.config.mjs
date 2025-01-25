// @ts-check
import react from '@astrojs/react'
import starlight from '@astrojs/starlight'
import tailwind from '@astrojs/tailwind'
import { defineConfig } from 'astro/config'

import { mermaid } from './src/plugins/mermaid'

export default defineConfig({
  vite: {
    resolve: {
      conditions: ['bun'],
    },
  },
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    starlight({
      title: 'Flows AI',
      social: {
        github: 'https://github.com/callstackincubator/flows-ai',
      },
      customCss: ['./src/styles/base.css'],
      sidebar: [
        {
          label: 'Introduction',
          items: [
            {
              label: 'Getting Started',
              slug: '',
            },
            'introduction/options',
          ],
        },
        {
          label: 'Flows',
          autogenerate: { directory: 'flows' },
        },
        {
          label: 'Guides',
          autogenerate: { directory: 'guides' },
        },
        {
          label: 'Sandbox',
          slug: 'sandbox',
        },
      ],
    }),
  ],
  markdown: {
    remarkPlugins: [mermaid],
  },
})
