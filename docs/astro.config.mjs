// @ts-check
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

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
          items: [{ label: 'Introduction', slug: '' }],
        },
        {
          label: 'Flows',
          autogenerate: { directory: 'flows' },
        },
      ],
    }),
  ],
})
