// @ts-check
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

import { mermaid } from './src/plugins/mermaid'

export default defineConfig({
  integrations: [
    starlight({
      title: 'Flows AI',
      social: {
        github: 'https://github.com/callstackincubator/flows-ai',
      },
      sidebar: [
        {
          label: 'Getting Started',
          slug: '',
        },
        {
          label: 'Flows',
          autogenerate: { directory: 'flows' },
        },
        {
          label: 'Guides',
          autogenerate: { directory: 'guides' },
        },
      ],
    }),
  ],
  markdown: {
    remarkPlugins: [mermaid],
  },
})
